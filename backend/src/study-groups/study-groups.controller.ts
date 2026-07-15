import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StudyGroupsService } from './study-groups.service';
import { RegisterInterestDto } from './dto/register-interest.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Study Groups')
@Controller('study-groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudyGroupsController {
  constructor(private readonly studyGroupsService: StudyGroupsService) {}

  @Get('interests')
  @ApiOperation({ summary: 'Get current user registered study interests' })
  async getMyInterests(@Request() req) {
    return this.studyGroupsService.getMyInterests(req.user.id);
  }

  @Post('interests')
  @ApiOperation({ summary: 'Register study preferences' })
  async registerInterest(@Body() dto: RegisterInterestDto, @Request() req) {
    return this.studyGroupsService.registerInterest(dto, req.user);
  }

  @Get('matches/:moduleCode')
  @ApiOperation({ summary: 'Search and rank compatible study partners' })
  async findMatches(@Param('moduleCode') moduleCode: string, @Request() req) {
    return this.studyGroupsService.findMatches(moduleCode, req.user);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a student to study together' })
  async sendInvite(
    @Body('moduleCode') moduleCode: string,
    @Body('inviteeUserId') inviteeUserId: string,
    @Request() req,
  ) {
    return this.studyGroupsService.sendInvite(moduleCode, inviteeUserId, req.user);
  }

  @Post('respond')
  @ApiOperation({ summary: 'Accept or decline a study group invitation' })
  async respondToInvite(
    @Body('moduleCode') moduleCode: string,
    @Body('inviterUserId') inviterUserId: string,
    @Body('action') action: 'accepted' | 'declined',
    @Request() req,
  ) {
    return this.studyGroupsService.respondToInvite(moduleCode, inviterUserId, action, req.user);
  }
}