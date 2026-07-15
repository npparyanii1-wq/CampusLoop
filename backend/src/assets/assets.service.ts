import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Asset } from '../database/entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly aiService: AiService,
  ) {}

  async findAll(filters: { search?: string; category?: string; departmentId?: string }): Promise<Asset[]> {
    const where: any = {};
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.search) {
      const searchStr = `%${filters.search}%`;
      return this.assetRepo.find({
        where: [
          { ...where, name: ILike(searchStr) },
          { ...where, description: ILike(searchStr) },
        ],
        relations: ['department'],
      });
    }

    return this.assetRepo.find({
      where,
      relations: ['department'],
    });
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  async create(createAssetDto: CreateAssetDto, user: any): Promise<Asset> {
    if (user.role === 'staff' && user.departmentId !== createAssetDto.departmentId) {
      throw new ForbiddenException('Staff managers can only register assets for their own department.');
    }
    const asset = this.assetRepo.create(createAssetDto);
    return this.assetRepo.save(asset);
  }

  async update(id: string, updateAssetDto: UpdateAssetDto, user: any): Promise<Asset> {
    const asset = await this.findOne(id);
    if (user.role === 'staff') {
      if (asset.departmentId !== user.departmentId) {
        throw new ForbiddenException('Staff managers can only modify assets for their own department.');
      }
      if (updateAssetDto.departmentId && updateAssetDto.departmentId !== asset.departmentId) {
        throw new ForbiddenException('Only administrators can transfer assets between departments.');
      }
    }
    Object.assign(asset, updateAssetDto);
    return this.assetRepo.save(asset);
  }

  async remove(id: string, user: any): Promise<void> {
    const asset = await this.findOne(id);
    if (user.role === 'staff' && asset.departmentId !== user.departmentId) {
      throw new ForbiddenException('Staff managers can only delete assets for their own department.');
    }
    await this.assetRepo.remove(asset);
  }

  async smartSearch(query: string) {
    const allAssets = await this.assetRepo.find({ relations: ['department'] });
    return this.aiService.smartSearch(query, allAssets);
  }
}