import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { StudyGroupInterest } from '../database/entities/study-group-interest.entity';
import { Booking } from '../database/entities/booking.entity';
import { User } from '../database/entities/user.entity';
import { RegisterInterestDto } from './dto/register-interest.dto';
import { AiService } from '../ai/ai.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class StudyGroupsService {
  constructor(
    @InjectRepository(StudyGroupInterest)
    private readonly interestRepo: Repository<StudyGroupInterest>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly aiService: AiService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getMyInterests(userId: string): Promise<StudyGroupInterest[]> {
    return this.interestRepo.find({ where: { userId } });
  }

  async registerInterest(dto: RegisterInterestDto, user: any): Promise<StudyGroupInterest> {
    let interest = await this.interestRepo.findOne({
      where: { userId: user.id, moduleCode: dto.moduleCode },
    });

    if (interest) {
      interest.preferredStyle = dto.preferredStyle;
      interest.availabilitySlots = JSON.stringify(dto.availabilitySlots);
      interest.status = 'searching';
      interest.matchedWithId = null;
    } else {
      interest = this.interestRepo.create({
        userId: user.id,
        moduleCode: dto.moduleCode,
        preferredStyle: dto.preferredStyle,
        availabilitySlots: JSON.stringify(dto.availabilitySlots),
        status: 'searching',
      });
    }

    return this.interestRepo.save(interest);
  }

  async findMatches(moduleCode: string, user: any) {
    const myInterest = await this.interestRepo.findOne({
      where: { userId: user.id, moduleCode },
    });

    if (!myInterest) {
      throw new BadRequestException(`Please register your interest for ${moduleCode} first.`);
    }

    const otherInterests = await this.interestRepo.find({
      where: {
        moduleCode,
        status: 'searching',
        userId: Not(user.id),
      },
      relations: ['user'],
    });

    const matches = await this.aiService.matchStudyGroups(myInterest, otherInterests);

    if (matches.length === 0) {
      return this.runRoomBookingFallback(myInterest, user.id);
    }

    return matches.map(m => ({
      interestId: m.match.id,
      userId: m.match.user.id,
      email: m.match.user.email.split('@')[0],
      preferredStyle: m.match.preferredStyle,
      slots: JSON.parse(m.match.availabilitySlots),
      compatibilityScore: m.score,
      rationale: m.rationale,
    }));
  }

  private async runRoomBookingFallback(myInterest: StudyGroupInterest, currentUserId: string) {
    console.log('[Study Matcher] Running room booking fallback strategy...');
    const myBookings = await this.bookingRepo.find({
      where: { userId: currentUserId, asset: { category: 'room' } },
      relations: ['asset'],
    });

    if (myBookings.length === 0) {
      const basicList = await this.interestRepo.find({
        where: { moduleCode: myInterest.moduleCode, userId: Not(myInterest.userId) },
        relations: ['user'],
        take: 3,
      });

      return basicList.map(item => ({
        interestId: item.id,
        userId: item.user.id,
        email: item.user.email.split('@')[0],
        preferredStyle: item.preferredStyle,
        slots: JSON.parse(item.availabilitySlots),
        compatibilityScore: 70,
        rationale: 'Classmate who is also taking this module (fallback match).',
      }));
    }

    const bookdates = myBookings.map(b => b.startTime.toDateString());
    
    const otherBookings = await this.bookingRepo.find({
      where: {
        userId: Not(currentUserId),
        asset: { category: 'room' },
      },
      relations: ['user'],
    });

    const matchingUsers = otherBookings.filter(b => bookdates.includes(b.startTime.toDateString())).map(b => b.user);
    const uniqueUsers = Array.from(new Map(matchingUsers.map(u => [u.id, u])).values());

    const matches = [];
    for (const u of uniqueUsers) {
      const interest = await this.interestRepo.findOne({
        where: { userId: u.id, moduleCode: myInterest.moduleCode },
      });
      if (interest) {
        matches.push({
          interestId: interest.id,
          userId: u.id,
          email: u.email.split('@')[0],
          preferredStyle: interest.preferredStyle,
          slots: JSON.parse(interest.availabilitySlots),
          compatibilityScore: 85,
          rationale: 'Overlapping study room bookings detected on key dates (static fallback).',
        });
      }
    }

    return matches;
  }

  async sendInvite(moduleCode: string, inviteeUserId: string, user: any) {
    const myInterest = await this.interestRepo.findOne({
      where: { userId: user.id, moduleCode },
    });

    const peerInterest = await this.interestRepo.findOne({
      where: { userId: inviteeUserId, moduleCode },
    });

    if (!myInterest || !peerInterest) {
      throw new BadRequestException('Both users must have registered interest.');
    }

    myInterest.status = 'matched';
    myInterest.matchedWithId = inviteeUserId;
    await this.interestRepo.save(myInterest);

    peerInterest.status = 'matched';
    peerInterest.matchedWithId = user.id;
    await this.interestRepo.save(peerInterest);

    this.notificationsGateway.sendToUser(inviteeUserId, 'study_group_invited', {
      inviterUserId: user.id,
      moduleCode,
      inviterName: user.email.split('@')[0],
    });

    return { status: 'invited', message: 'Invitation sent.' };
  }

  async respondToInvite(moduleCode: string, inviterUserId: string, action: 'accepted' | 'declined', user: any) {
    const myInterest = await this.interestRepo.findOne({
      where: { userId: user.id, moduleCode },
    });

    const peerInterest = await this.interestRepo.findOne({
      where: { userId: inviterUserId, moduleCode },
    });

    if (!myInterest || !peerInterest) {
      throw new BadRequestException('Study match session does not exist.');
    }

    if (action === 'accepted') {
      myInterest.status = 'accepted';
      peerInterest.status = 'accepted';

      await this.interestRepo.save(myInterest);
      await this.interestRepo.save(peerInterest);

      const dbInviter = await this.userRepo.findOne({ where: { id: inviterUserId } });
      const dbCurrentUser = await this.userRepo.findOne({ where: { id: user.id } });

      this.notificationsGateway.sendToUser(inviterUserId, 'study_group_accepted', {
        inviteeName: dbCurrentUser.email.split('@')[0],
        inviteeEmail: dbCurrentUser.email,
        moduleCode,
      });

      return {
        status: 'accepted',
        email: dbInviter.email,
        message: 'Match approved! You can now contact each other.',
      };
    } else {
      myInterest.status = 'searching';
      myInterest.matchedWithId = null;
      peerInterest.status = 'searching';
      peerInterest.matchedWithId = null;

      await this.interestRepo.save(myInterest);
      await this.interestRepo.save(peerInterest);

      this.notificationsGateway.sendToUser(inviterUserId, 'study_group_declined', {
        inviteeName: user.email.split('@')[0],
        moduleCode,
      });

      return { status: 'declined', message: 'Invite declined. Search resumed.' };
    }
  }
}