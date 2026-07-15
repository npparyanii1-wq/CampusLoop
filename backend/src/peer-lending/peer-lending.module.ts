import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeerLendingService } from './peer-lending.service';
import { PeerLendingController } from './peer-lending.controller';
import { PeerListing } from '../database/entities/peer-listing.entity';
import { PeerLoan } from '../database/entities/peer-loan.entity';
import { User } from '../database/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeerListing, PeerLoan, User]),
    NotificationsModule,
  ],
  controllers: [PeerLendingController],
  providers: [PeerLendingService],
  exports: [PeerLendingService],
})
export class PeerLendingModule {}