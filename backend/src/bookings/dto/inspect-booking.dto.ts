import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InspectBookingDto {
  @ApiProperty({ example: 'good', enum: ['excellent', 'good', 'fair', 'damaged'] })
  @IsEnum(['excellent', 'good', 'fair', 'damaged'])
  @IsNotEmpty()
  condition: string;

  @ApiProperty({ example: 'ready for reuse', enum: ['ready for reuse', 'needs repair', 'retire'] })
  @IsEnum(['ready for reuse', 'needs repair', 'retire'])
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'Clean return.', required: false })
  @IsString()
  @IsOptional()
  managerComment?: string;
}