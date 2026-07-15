import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LostFoundService } from './lost-found.service';
import { ReportItemDto } from './dto/report-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Lost & Found')
@Controller('lost-found')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LostFoundController {
  constructor(private readonly lostFoundService: LostFoundService) {}

  @Get()
  @ApiOperation({ summary: 'List reported lost/found items' })
  @ApiQuery({ name: 'type', required: false })
  async findAll(@Query('type') type?: string) {
    return this.lostFoundService.findAll(type);
  }

  @Get('matches')
  @UseGuards(RolesGuard)
  @Roles('lfofficer', 'admin')
  @ApiOperation({ summary: 'Retrieve potential AI matches (LFO/Admin only)' })
  async getAiMatches() {
    return this.lostFoundService.getAiMatches();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of an item by ID' })
  async findOne(@Param('id') id: string) {
    return this.lostFoundService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Report a lost item or log a found item' })
  async reportItem(@Body() dto: ReportItemDto, @Request() req) {
    return this.lostFoundService.reportItem(dto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('lfofficer', 'admin')
  @ApiOperation({ summary: 'Update item resolution status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    return this.lostFoundService.updateStatus(id, status, req.user);
  }

  @Post('claim')
  @UseGuards(RolesGuard)
  @Roles('lfofficer', 'admin')
  @ApiOperation({ summary: 'Link matching reports and resolve claim' })
  async linkAndClaim(
    @Body('lostId') lostId: string,
    @Body('foundId') foundId: string,
    @Request() req,
  ) {
    return this.lostFoundService.linkAndClaim(lostId, foundId, req.user);
  }
}