import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanRequestDto {
  @ApiProperty({ example: 'd0a80101-1234-1234-1234-1234567890ab' })
  @IsString()
  @IsNotEmpty()
  peerListingId: string;

  @ApiProperty({ example: '2026-07-12T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2026-07-15T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}