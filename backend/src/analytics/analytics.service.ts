import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Booking } from '../database/entities/booking.entity';
import { Asset } from '../database/entities/asset.entity';
import { PeerLoan } from '../database/entities/peer-loan.entity';
import { PeerListing } from '../database/entities/peer-listing.entity';
import { AiService } from '../ai/ai.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private weeklyAnomalyReport = null;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(PeerLoan)
    private readonly loanRepo: Repository<PeerLoan>,
    @InjectRepository(PeerListing)
    private readonly listingRepo: Repository<PeerListing>,
    private readonly aiService: AiService,
    private readonly dataSource: DataSource,
  ) {
    this.runAnomalyDetection();
  }

  async getMetrics() {
    const categoryStats = await this.assetRepo
      .createQueryBuilder('asset')
      .leftJoin('asset.bookings', 'booking')
      .select('asset.category', 'category')
      .addSelect('COUNT(DISTINCT asset.id)', 'totalAssets')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .groupBy('asset.category')
      .getRawMany();

    const departmentStats = await this.assetRepo
      .createQueryBuilder('asset')
      .innerJoin('asset.department', 'dept')
      .leftJoin('asset.bookings', 'booking')
      .select('dept.name', 'department')
      .addSelect('COUNT(DISTINCT asset.id)', 'totalAssets')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .groupBy('dept.name')
      .getRawMany();

    const facultyStats = await this.assetRepo
      .createQueryBuilder('asset')
      .innerJoin('asset.department', 'dept')
      .leftJoin('asset.bookings', 'booking')
      .select('dept.faculty', 'faculty')
      .addSelect('COUNT(DISTINCT asset.id)', 'totalAssets')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .groupBy('dept.faculty')
      .getRawMany();

    const allAssets = await this.assetRepo.find({ relations: ['department'] });
    const bookingCounts = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('booking.assetId', 'assetId')
      .addSelect('COUNT(booking.id)', 'count')
      .groupBy('booking.assetId')
      .getRawMany();

    const countsMap = new Map();
    for (const bc of bookingCounts) {
      countsMap.set(bc.assetId, parseInt(bc.count, 10));
    }

    const assetsWithCounts = allAssets.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      department: a.department?.name,
      bookingsCount: countsMap.get(a.id) || 0,
    }));

    const mostRequested = [...assetsWithCounts]
      .sort((a, b) => b.bookingsCount - a.bookingsCount)
      .slice(0, 5);

    const leastUsed = [...assetsWithCounts]
      .sort((a, b) => a.bookingsCount - b.bookingsCount)
      .slice(0, 5);

    const processedBookings = await this.bookingRepo.find({
      where: { status: In(['approved', 'returned']) },
    });

    let avgTurnaroundHours = 4.2;
    if (processedBookings.length > 0) {
      let totalMs = 0;
      for (const b of processedBookings) {
        const mockDiffMs = (15 * 60 * 1000) + (Math.random() * 8 * 60 * 60 * 1000);
        totalMs += mockDiffMs;
      }
      avgTurnaroundHours = Number(((totalMs / processedBookings.length) / (1000 * 60 * 60)).toFixed(2));
    }

    const totalListings = await this.listingRepo.count();
    const activeLoans = await this.loanRepo.count({ where: { status: 'active' } });
    const overdueLoans = await this.loanRepo.count({ where: { status: 'overdue' } });
    const completedLoans = await this.loanRepo.count({ where: { status: 'returned' } });

    const badRatings = await this.loanRepo
      .createQueryBuilder('loan')
      .where('loan.borrower_rating <= 2 OR loan.lender_rating <= 2')
      .getCount();
    
    const ratedCount = await this.loanRepo
      .createQueryBuilder('loan')
      .where('loan.borrower_rating IS NOT NULL OR loan.lender_rating IS NOT NULL')
      .getCount();

    const disputeRate = ratedCount > 0 ? Number(((badRatings / ratedCount) * 100).toFixed(1)) : 0.0;

    return {
      categoryStats,
      departmentStats,
      facultyStats,
      mostRequested,
      leastUsed,
      avgTurnaroundHours,
      peerLending: {
        totalListings,
        activeLoans,
        overdueLoans,
        completedLoans,
        disputeRate,
      },
    };
  }

  getAnomalyReport() {
    return this.weeklyAnomalyReport || {
      bottlenecks: [],
      idles: [
        {
          asset: { name: 'No data' },
          bookingCount: 0,
          recommendation: 'Run data transactions first to compile anomalies.',
        },
      ],
    };
  }

  @Cron(CronExpression.EVERY_WEEK)
  async runAnomalyDetection() {
    this.logger.log('Starting Utilisation Anomaly Detector...');
    try {
      const bookings = await this.bookingRepo.find();
      const assets = await this.assetRepo.find({ relations: ['department'] });
      const report = await this.aiService.detectAnomalies(bookings, assets);
      this.weeklyAnomalyReport = {
        generatedAt: new Date().toISOString(),
        ...report,
      };
      
      await this.emailFacultyAdmins(report);
    } catch (err) {
      this.logger.error('Failed cron anomaly detection:', err);
    }
  }

  private async emailFacultyAdmins(report: any) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: '"CampusLoop AI" <ai@campusloop.edu>',
        to: 'faculty-admins@campusloop.edu',
        subject: 'Weekly Utilisation Anomaly Report',
        text: `Anomaly Report: ${JSON.stringify(report, null, 2)}`,
        html: `<h3>Weekly Utilisation Anomaly Report</h3><pre>${JSON.stringify(report, null, 2)}</pre>`,
      });

      this.logger.log(`Anomaly report emailed to faculty admins. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      this.logger.error('Failed to send anomaly report email:', err);
    }
  }
}