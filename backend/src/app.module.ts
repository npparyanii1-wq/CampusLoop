import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Department } from './database/entities/department.entity';
import { User } from './database/entities/user.entity';
import { Asset } from './database/entities/asset.entity';
import { Booking } from './database/entities/booking.entity';
import { PeerListing } from './database/entities/peer-listing.entity';
import { PeerLoan } from './database/entities/peer-loan.entity';
import { LostFoundItem } from './database/entities/lost-found-item.entity';
import { StudyGroupInterest } from './database/entities/study-group-interest.entity';

// Import modules
import { AuthModule } from './auth/auth.module';
import { AssetsModule } from './assets/assets.module';
import { BookingsModule } from './bookings/bookings.module';
import { PeerLendingModule } from './peer-lending/peer-lending.module';
import { LostFoundModule } from './lost-found/lost-found.module';
import { StudyGroupsModule } from './study-groups/study-groups.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SeedService } from './database/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5433),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'campusloop'),
        ssl: config.get<string>('DB_HOST', '').includes('.tech') || config.get<string>('DB_HOST', '').includes('.co') ? { rejectUnauthorized: false } : false,
        entities: [
          Department,
          User,
          Asset,
          Booking,
          PeerListing,
          PeerLoan,
          LostFoundItem,
          StudyGroupInterest,
        ],
        synchronize: false,
      }),
    }),
    AuthModule,
    AssetsModule,
    BookingsModule,
    PeerLendingModule,
    LostFoundModule,
    StudyGroupsModule,
    AiModule,
    NotificationsModule,
    AnalyticsModule,
    TypeOrmModule.forFeature([Department, User, Asset]),
  ],
  providers: [SeedService],
})
export class AppModule {}