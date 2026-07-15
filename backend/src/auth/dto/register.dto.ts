import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'new_student@meridian.edu', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'student123', description: 'User password (min 6 characters)' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'student', enum: ['student', 'staff', 'lfofficer', 'admin'] })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'c0a80101-1234-1234-1234-1234567890ab', description: 'Department UUID', required: false })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: 'Engineering', description: 'Faculty name', required: false })
  @IsString()
  @IsOptional()
  faculty?: string;
}