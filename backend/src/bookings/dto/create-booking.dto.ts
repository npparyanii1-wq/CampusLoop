import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 'd0a80101-1234-1234-1234-1234567890ab', description: 'Asset UUID' })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ example: '2026-07-11T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2026-07-11T11:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}