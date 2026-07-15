import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { PeerListing } from '../database/entities/peer-listing.entity';
import { PeerLoan } from '../database/entities/peer-loan.entity';
import { User } from '../database/entities/user.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateLoanRequestDto } from './dto/create-loan-request.dto';
import { RateLoanDto } from './dto/rate-loan.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PeerLendingService {
  constructor(
    @InjectRepository(PeerListing)
    private readonly listingRepo: Repository<PeerListing>,
    @InjectRepository(PeerLoan)
    private readonly loanRepo: Repository<PeerLoan>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async findAllListings(): Promise<PeerListing[]> {
    return this.listingRepo.find({
      where: { status: 'available' },
      relations: ['owner'],
    });
  }

  async findMyListings(userId: string): Promise<PeerListing[]> {
    return this.listingRepo.find({
      where: { ownerId: userId },
      relations: ['owner'],
    });
  }

  async findListing(id: string): Promise<PeerListing> {
    const listing = await this.listingRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    return listing;
  }

  async createListing(dto: CreateListingDto, user: any): Promise<PeerListing> {
    const dbUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (dbUser && Number(dbUser.reputationScore) < 3.0) {
      throw new ForbiddenException(
        `Listing denied. Your reputation score (${dbUser.reputationScore}) is below the threshold of 3.0.`
      );
    }

    const listing = this.listingRepo.create({
      ...dto,
      ownerId: user.id,
      status: 'available',
    });
    return this.listingRepo.save(listing);
  }

  async removeListing(id: string, user: any): Promise<void> {
    const listing = await this.findListing(id);
    if (listing.ownerId !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Only the owner of this listing can delete it.');
    }
    await this.listingRepo.remove(listing);
  }

  async findMyLoans(userId: string): Promise<PeerLoan[]> {
    return this.loanRepo.find({
      where: [
        { borrowerId: userId },
        { peerListing: { ownerId: userId } },
      ],
      relations: ['peerListing', 'peerListing.owner', 'borrower'],
      order: { createdAt: 'DESC' },
    });
  }

  async requestLoan(dto: CreateLoanRequestDto, user: any): Promise<PeerLoan> {
    const dbUser = await this.userRepo.findOne({ where: { id: user.id } });
    if (dbUser && Number(dbUser.reputationScore) < 3.0) {
      throw new ForbiddenException(
        `Borrow request denied. Your reputation score (${dbUser.reputationScore}) is below the threshold of 3.0.`
      );
    }

    const listing = await this.findListing(dto.peerListingId);
    if (listing.status !== 'available') {
      throw new BadRequestException('This item is currently not available for loan.');
    }
    if (listing.ownerId === user.id) {
      throw new BadRequestException('You cannot borrow your own listed item.');
    }

    const loan = this.loanRepo.create({
      peerListingId: dto.peerListingId,
      borrowerId: user.id,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      status: 'pending',
    });

    const saved = await this.loanRepo.save(loan);

    this.notificationsGateway.sendToUser(
      listing.ownerId,
      'peer_loan_requested',
      { loanId: saved.id, itemName: listing.name }
    );

    return saved;
  }

  async respondToLoan(id: string, status: 'accepted' | 'declined', user: any): Promise<PeerLoan> {
    const loan = await this.loanRepo.findOne({
      where: { id },
      relations: ['peerListing'],
    });

    if (!loan) {
      throw new NotFoundException('Loan request not found');
    }

    if (loan.peerListing.ownerId !== user.id) {
      throw new ForbiddenException('Only the owner of this listing can respond to loan requests.');
    }

    if (loan.status !== 'pending') {
      throw new BadRequestException('This loan request has already been processed.');
    }

    if (status === 'accepted') {
      loan.status = 'active';
      const listing = loan.peerListing;
      listing.status = 'loaned';
      await this.listingRepo.save(listing);
    } else {
      loan.status = 'declined';
    }

    const saved = await this.loanRepo.save(loan);

    this.notificationsGateway.sendToUser(loan.borrowerId, 'peer_loan_response', {
      loanId: loan.id,
      itemName: loan.peerListing.name,
      status: loan.status,
    });

    return saved;
  }

  async returnLoan(id: string, user: any): Promise<PeerLoan> {
    const loan = await this.loanRepo.findOne({
      where: { id },
      relations: ['peerListing'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.borrowerId !== user.id && loan.peerListing.ownerId !== user.id) {
      throw new ForbiddenException('Only parties involved in this loan can mark it as returned.');
    }

    loan.status = 'returned';
    const saved = await this.loanRepo.save(loan);

    const listing = loan.peerListing;
    listing.status = 'available';
    await this.listingRepo.save(listing);

    const recipientId = (user.id === loan.borrowerId) ? loan.peerListing.ownerId : loan.borrowerId;
    this.notificationsGateway.sendToUser(recipientId, 'peer_loan_returned', {
      loanId: loan.id,
      itemName: listing.name,
    });

    return saved;
  }

  async rateLoan(id: string, dto: RateLoanDto, user: any): Promise<PeerLoan> {
    const loan = await this.loanRepo.findOne({
      where: { id },
      relations: ['peerListing', 'peerListing.owner'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.status !== 'returned' && loan.status !== 'overdue') {
      throw new BadRequestException('Ratings can only be submitted after return or overdue.');
    }

    let targetUserId = '';

    if (user.id === loan.borrowerId) {
      if (loan.lenderRating !== null) {
        throw new BadRequestException('You have already rated the lender.');
      }
      loan.lenderRating = dto.rating;
      loan.lenderReview = dto.review;
      targetUserId = loan.peerListing.ownerId;
    } else if (user.id === loan.peerListing.ownerId) {
      if (loan.borrowerRating !== null) {
        throw new BadRequestException('You have already rated the borrower.');
      }
      loan.borrowerRating = dto.rating;
      loan.borrowerReview = dto.review;
      targetUserId = loan.borrowerId;
    } else {
      throw new ForbiddenException('You are not a participant.');
    }

    const saved = await this.loanRepo.save(loan);
    await this.recalculateUserReputation(targetUserId);

    return saved;
  }

  private async recalculateUserReputation(userId: string): Promise<void> {
    const borrowerLoans = await this.loanRepo.find({
      where: { borrowerId: userId },
      select: ['borrowerRating'],
    });

    const lenderLoans = await this.loanRepo.find({
      where: { peerListing: { ownerId: userId } },
      relations: ['peerListing'],
      select: ['lenderRating'],
    });

    const ratings = [];

    for (const l of borrowerLoans) {
      if (l.borrowerRating !== null && l.borrowerRating !== undefined) {
        ratings.push(l.borrowerRating);
      }
    }

    for (const l of lenderLoans) {
      if (l.lenderRating !== null && l.lenderRating !== undefined) {
        ratings.push(l.lenderRating);
      }
    }

    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, val) => sum + val, 0) / ratings.length;
      await this.userRepo.update(userId, { reputationScore: Number(avg.toFixed(2)) });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleOverdueLoans() {
    console.log('[Cron Job] Scanning for overdue peer loans...');
    const now = new Date();

    const overdueLoans = await this.loanRepo.find({
      where: {
        status: 'active',
        endTime: LessThan(now),
      },
      relations: ['peerListing'],
    });

    for (const loan of overdueLoans) {
      loan.status = 'overdue';
      await this.loanRepo.save(loan);

      this.notificationsGateway.sendToUser(loan.borrowerId, 'peer_loan_overdue', {
        loanId: loan.id,
        itemName: loan.peerListing.name,
      });

      this.notificationsGateway.sendToUser(loan.peerListing.ownerId, 'peer_loan_overdue_lender', {
        loanId: loan.id,
        itemName: loan.peerListing.name,
      });
    }
  }
}