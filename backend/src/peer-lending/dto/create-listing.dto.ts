import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ example: 'Introduction to Algorithms' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CLRS textbook...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'textbook', enum: ['textbook', 'transport', 'electronics', 'other'] })
  @IsEnum(['textbook', 'transport', 'electronics', 'other'])
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 'good', enum: ['excellent', 'good', 'fair', 'damaged'] })
  @IsEnum(['excellent', 'good', 'fair', 'damaged'])
  @IsNotEmpty()
  condition: string;
}