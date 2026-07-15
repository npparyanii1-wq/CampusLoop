import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ example: 'Spectrometer Model S20', description: 'Name of the asset' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Analytical chemistry instrument...', description: 'Description of the asset' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'equipment', enum: ['equipment', 'room', 'loanable'] })
  @IsEnum(['equipment', 'room', 'loanable'])
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'd0a80101-1234-1234-1234-1234567890ab', description: 'Department UUID owner' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: 'excellent', enum: ['excellent', 'good', 'fair', 'damaged'] })
  @IsEnum(['excellent', 'good', 'fair', 'damaged'])
  @IsOptional()
  condition?: string;

  @ApiProperty({ example: 'available', enum: ['available', 'booked', 'maintenance', 'retired'] })
  @IsEnum(['available', 'booked', 'maintenance', 'retired'])
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 0, description: 'Lead time in hours required before booking' })
  @IsInt()
  @Min(0)
  @IsOptional()
  bookingLeadTime?: number;

  @ApiProperty({ example: false, description: 'Requires manager approval if true' })
  @IsBoolean()
  @IsOptional()
  isHighValue?: boolean;
}