import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Booking } from '../database/entities/booking.entity';
import { Asset } from '../database/entities/asset.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReturnBookingDto } from './dto/return-booking.dto';
import { InspectBookingDto } from './dto/inspect-booking.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AiService } from '../ai/ai.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly dataSource: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly aiService: AiService,
  ) {}

  async findAll(user: any): Promise<Booking[]> {
    if (user.role === 'admin') {
      return this.bookingRepo.find({
        relations: ['asset', 'asset.department', 'user'],
        order: { createdAt: 'DESC' },
      });
    }
    if (user.role === 'staff') {
      return this.bookingRepo.find({
        relations: ['asset', 'asset.department', 'user'],
        where: { asset: { departmentId: user.departmentId } },
        order: { createdAt: 'DESC' },
      });
    }
    return this.bookingRepo.find({
      relations: ['asset', 'asset.department', 'user'],
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, user: any): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['asset', 'asset.department', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (user.role === 'student' && booking.userId !== user.id) {
      throw new ForbiddenException('You cannot access bookings created by other users.');
    }
    if (user.role === 'staff' && booking.asset.departmentId !== user.departmentId) {
      throw new ForbiddenException('You can only access bookings belonging to your department.');
    }

    return booking;
  }

  async create(createBookingDto: CreateBookingDto, user: any): Promise<Booking> {
    const { assetId, startTime, endTime } = createBookingDto;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time.');
    }
    if (start < new Date()) {
      throw new BadRequestException('Cannot book a time slot in the past.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id: assetId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!asset) {
        throw new NotFoundException(`Asset not found`);
      }
      if (asset.status === 'retired') {
        throw new BadRequestException('Asset has been retired and cannot be booked.');
      }
      if (asset.status === 'maintenance') {
        throw new BadRequestException('Asset is in maintenance and cannot be booked.');
      }

      const leadTimeMs = asset.bookingLeadTime * 60 * 60 * 1000;
      if (start.getTime() - Date.now() < leadTimeMs) {
        throw new BadRequestException(
          `This asset requires a lead time of at least ${asset.bookingLeadTime} hours before booking.`
        );
      }

      const overlappingBookings = await queryRunner.manager
        .createQueryBuilder(Booking, 'booking')
        .setLock('pessimistic_write')
        .where('booking.asset_id = :assetId', { assetId })
        .andWhere('booking.status IN (:...statuses)', { statuses: ['pending', 'approved'] })
        .andWhere('booking.start_time < :end AND booking.end_time > :start', { start, end })
        .getMany();

      if (overlappingBookings.length > 0) {
        throw new ConflictException('This timeslot overlaps with an existing booking.');
      }

      const requiresApproval = asset.isHighValue;
      const bookingStatus = requiresApproval ? 'pending' : 'approved';

      const booking = queryRunner.manager.create(Booking, {
        assetId,
        userId: user.id,
        startTime: start,
        endTime: end,
        status: bookingStatus,
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();

      if (requiresApproval) {
        this.notificationsGateway.sendToDept(
          asset.departmentId,
          'booking_approval_needed',
          { bookingId: savedBooking.id, assetName: asset.name }
        );
      }

      return savedBooking;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: string, comment: string, user: any): Promise<Booking> {
    if (!['approved', 'declined'].includes(status)) {
      throw new BadRequestException('Invalid booking status update.');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user.role === 'staff' && booking.asset.departmentId !== user.departmentId) {
      throw new ForbiddenException('You cannot moderate bookings outside your own department.');
    }

    booking.status = status;
    booking.managerComment = comment;
    booking.approvedBy = user.email;

    const saved = await this.bookingRepo.save(booking);

    this.notificationsGateway.sendToUser(booking.userId, 'booking_status_updated', {
      bookingId: booking.id,
      assetName: booking.asset.name,
      status: booking.status,
      comment: booking.managerComment,
    });

    return saved;
  }

  async processReturn(id: string, returnDto: ReturnBookingDto, user: any) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only the borrowing student can return this item.');
    }

    if (booking.status !== 'approved') {
      throw new BadRequestException('Only approved and active bookings can be returned.');
    }

    const aiReport = await this.aiService.assessCondition(
      returnDto.photoUrl,
      returnDto.description,
      booking.asset.condition
    );

    return {
      bookingId: booking.id,
      assetName: booking.asset.name,
      previousCondition: booking.asset.condition,
      aiAssessment: aiReport,
      photoUrl: returnDto.photoUrl,
      studentNote: returnDto.description,
    };
  }

  async confirmInspection(id: string, inspectDto: InspectBookingDto, user: any) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['asset'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user.role === 'staff' && booking.asset.departmentId !== user.departmentId) {
      throw new ForbiddenException('Only department managers can perform returned inspections.');
    }

    const asset = booking.asset;
    asset.condition = inspectDto.condition;

    if (inspectDto.action === 'ready for reuse') {
      asset.status = 'available';
    } else if (inspectDto.action === 'needs repair') {
      asset.status = 'maintenance';
    } else if (inspectDto.action === 'retire') {
      asset.status = 'retired';
    }

    await this.assetRepo.save(asset);

    booking.status = 'returned';
    booking.managerComment = inspectDto.managerComment;
    await this.bookingRepo.save(booking);

    this.notificationsGateway.sendToUser(booking.userId, 'inspection_completed', {
      bookingId: booking.id,
      assetName: asset.name,
      condition: asset.condition,
      action: inspectDto.action,
    });

    return { status: 'success', booking, asset };
  }
}