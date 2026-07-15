import { IsString, IsOptional, IsInt, Min, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAssetDto {
  @ApiProperty({ example: 'Spectrometer S20 V2', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'equipment', enum: ['equipment', 'room', 'loanable'], required: false })
  @IsEnum(['equipment', 'room', 'loanable'])
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'd0a80101-1234-1234-1234-1234567890ab', description: 'Department UUID owner', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: 'good', enum: ['excellent', 'good', 'fair', 'damaged'], required: false })
  @IsEnum(['excellent', 'good', 'fair', 'damaged'])
  @IsOptional()
  condition?: string;

  @ApiProperty({ example: 'available', enum: ['available', 'booked', 'maintenance', 'retired'], required: false })
  @IsEnum(['available', 'booked', 'maintenance', 'retired'])
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  bookingLeadTime?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isHighValue?: boolean;
}