import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportItemDto {
  @ApiProperty({ example: 'lost', enum: ['lost', 'found'] })
  @IsEnum(['lost', 'found'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Wallet...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Library Level 1' })
  @IsString()
  @IsNotEmpty()
  lastSeenLocation: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 'good', required: false })
  @IsString()
  @IsOptional()
  condition?: string;
}