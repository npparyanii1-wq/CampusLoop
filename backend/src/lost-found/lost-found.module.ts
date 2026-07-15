import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LostFoundService } from './lost-found.service';
import { LostFoundController } from './lost-found.controller';
import { LostFoundItem } from '../database/entities/lost-found-item.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LostFoundItem]),
    NotificationsModule,
  ],
  controllers: [LostFoundController],
  providers: [LostFoundService],
  exports: [LostFoundService],
})
export class LostFoundModule {}