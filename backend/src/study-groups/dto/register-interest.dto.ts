import { IsNotEmpty, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterInterestDto {
  @ApiProperty({ example: 'CS101' })
  @IsString()
  @IsNotEmpty()
  moduleCode: string;

  @ApiProperty({ example: 'group', enum: ['solo', 'group', 'discussion'] })
  @IsEnum(['solo', 'group', 'discussion'])
  @IsNotEmpty()
  preferredStyle: string;

  @ApiProperty({ example: ['Mon_9_12'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  availabilitySlots: string[];
}