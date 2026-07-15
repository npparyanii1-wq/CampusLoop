import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PeerLendingService } from './peer-lending.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateLoanRequestDto } from './dto/create-loan-request.dto';
import { RateLoanDto } from './dto/rate-loan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Peer Lending')
@Controller('peer-lending')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PeerLendingController {
  constructor(private readonly peerLendingService: PeerLendingService) {}

  @Get('listings')
  @ApiOperation({ summary: 'List all available items listed by other students' })
  async findAllListings() {
    return this.peerLendingService.findAllListings();
  }

  @Get('listings/my')
  @ApiOperation({ summary: 'List items listed by current student' })
  async findMyListings(@Request() req) {
    return this.peerLendingService.findMyListings(req.user.id);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get details of a peer listing by ID' })
  async findListing(@Param('id') id: string) {
    return this.peerLendingService.findListing(id);
  }

  @Post('listings')
  @ApiOperation({ summary: 'List a personal item for loan' })
  async createListing(@Body() dto: CreateListingDto, @Request() req) {
    return this.peerLendingService.createListing(dto, req.user);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Remove a listed item' })
  async removeListing(@Param('id') id: string, @Request() req) {
    return this.peerLendingService.removeListing(id, req.user);
  }

  @Get('loans/my')
  @ApiOperation({ summary: 'List loans' })
  async findMyLoans(@Request() req) {
    return this.peerLendingService.findMyLoans(req.user.id);
  }

  @Post('loans/request')
  @ApiOperation({ summary: 'Request to borrow a listed item' })
  async requestLoan(@Body() dto: CreateLoanRequestDto, @Request() req) {
    return this.peerLendingService.requestLoan(dto, req.user);
  }

  @Patch('loans/:id/respond')
  @ApiOperation({ summary: 'Accept or decline a borrow request' })
  async respondToLoan(
    @Param('id') id: string,
    @Body('status') status: 'accepted' | 'declined',
    @Request() req,
  ) {
    return this.peerLendingService.respondToLoan(id, status, req.user);
  }

  @Post('loans/:id/return')
  @ApiOperation({ summary: 'Mark a loan as returned' })
  async returnLoan(@Param('id') id: string, @Request() req) {
    return this.peerLendingService.returnLoan(id, req.user);
  }

  @Post('loans/:id/rate')
  @ApiOperation({ summary: 'Rate the other party' })
  async rateLoan(
    @Param('id') id: string,
    @Body() dto: RateLoanDto,
    @Request() req,
  ) {
    return this.peerLendingService.rateLoan(id, dto, req.user);
  }
}