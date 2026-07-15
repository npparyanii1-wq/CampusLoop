import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReturnBookingDto } from './dto/return-booking.dto';
import { InspectBookingDto } from './dto/inspect-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List bookings' })
  async findAll(@Request() req) {
    return this.bookingsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.bookingsService.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new asset booking' })
  async create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingsService.create(createBookingDto, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('staff', 'admin')
  @ApiOperation({ summary: 'Approve or decline a pending booking' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('comment') comment: string,
    @Request() req,
  ) {
    return this.bookingsService.updateStatus(id, status, comment, req.user);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Initiate asset return and trigger AI condition pre-fill' })
  async processReturn(
    @Param('id') id: string,
    @Body() returnDto: ReturnBookingDto,
    @Request() req,
  ) {
    return this.bookingsService.processReturn(id, returnDto, req.user);
  }

  @Post(':id/inspect')
  @UseGuards(RolesGuard)
  @Roles('staff', 'admin')
  @ApiOperation({ summary: 'Confirm returned asset inspection' })
  async confirmInspection(
    @Param('id') id: string,
    @Body() inspectDto: InspectBookingDto,
    @Request() req,
  ) {
    return this.bookingsService.confirmInspection(id, inspectDto, req.user);
  }
}