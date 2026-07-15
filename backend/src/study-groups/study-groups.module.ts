import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyGroupsService } from './study-groups.service';
import { StudyGroupsController } from './study-groups.controller';
import { StudyGroupInterest } from '../database/entities/study-group-interest.entity';
import { Booking } from '../database/entities/booking.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudyGroupInterest, Booking, User]),
    NotificationsModule,
    AiModule,
  ],
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService],
  exports: [StudyGroupsService],
})
export class StudyGroupsModule {}