import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve core university-wide asset and lending analytics metrics' })
  async getMetrics() {
    return this.analyticsService.getMetrics();
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Retrieve weekly anomaly detection report candidates' })
  async getAnomalyReport() {
    return this.analyticsService.getAnomalyReport();
  }
}