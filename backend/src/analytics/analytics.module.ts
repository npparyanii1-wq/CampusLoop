import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Booking } from '../database/entities/booking.entity';
import { Asset } from '../database/entities/asset.entity';
import { PeerLoan } from '../database/entities/peer-loan.entity';
import { PeerListing } from '../database/entities/peer-listing.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Asset, PeerLoan, PeerListing]),
    AiModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}