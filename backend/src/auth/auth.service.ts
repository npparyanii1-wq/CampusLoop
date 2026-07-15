import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { comparePassword, hashPassword } from './hash.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['department'],
    });
    if (user && comparePassword(pass, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      faculty: user.faculty,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        faculty: user.faculty,
        reputationScore: user.reputationScore,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: registerDto.email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const newUser = this.userRepo.create({
      email: registerDto.email,
      passwordHash: hashPassword(registerDto.password),
      role: registerDto.role || 'student',
      departmentId: registerDto.departmentId,
      faculty: registerDto.faculty,
      reputationScore: 5.0,
    });

    const saved = await this.userRepo.save(newUser);
    const { passwordHash, ...result } = saved;
    return result;
  }

  async getUserProfile(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ['department'],
    });
  }
}