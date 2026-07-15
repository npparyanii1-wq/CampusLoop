import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReturnBookingDto {
  @ApiProperty({ example: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500', required: false })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiProperty({ example: 'Returned cleanly.', description: 'Return description' })
  @IsString()
  @IsNotEmpty()
  description: string;
}