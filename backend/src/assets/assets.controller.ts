import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all assets with optional search, category, and department filter' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return matching assets' })
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.assetsService.findAll({ search, category, departmentId });
  }

  @Post('search/smart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'AI-powered smart search for assets' })
  async smartSearch(@Body('query') query: string) {
    return this.assetsService.smartSearch(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset details by ID' })
  async findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('staff', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new asset' })
  async create(@Body() createAssetDto: CreateAssetDto, @Request() req) {
    return this.assetsService.create(createAssetDto, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('staff', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update asset details' })
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
    @Request() req,
  ) {
    return this.assetsService.update(id, updateAssetDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('staff', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an asset' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.assetsService.remove(id, req.user);
  }
}