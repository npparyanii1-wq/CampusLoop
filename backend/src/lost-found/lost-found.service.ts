import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { LostFoundItem } from '../database/entities/lost-found-item.entity';
import { ReportItemDto } from './dto/report-item.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LostFoundService {
  constructor(
    @InjectRepository(LostFoundItem)
    private readonly itemRepo: Repository<LostFoundItem>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async findAll(type?: string): Promise<LostFoundItem[]> {
    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }
    return this.itemRepo.find({
      where,
      relations: ['reportedBy'],
      order: { loggedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LostFoundItem> {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['reportedBy'],
    });
    if (!item) {
      throw new NotFoundException(`Lost/Found item with ID ${id} not found`);
    }
    return item;
  }

  async reportItem(dto: ReportItemDto, user: any): Promise<LostFoundItem> {
    const item = this.itemRepo.create({
      ...dto,
      reportedById: user.id,
      status: 'reported',
    });
    const saved = await this.itemRepo.save(item);

    this.notificationsGateway.sendToRole('lfofficer', 'new_lost_found_report', {
      itemId: saved.id,
      type: saved.type,
      description: saved.description,
    });

    return saved;
  }

  async updateStatus(id: string, status: string, user: any): Promise<LostFoundItem> {
    const item = await this.findOne(id);
    if (user.role !== 'lfofficer' && user.role !== 'admin') {
      throw new ForbiddenException('Only officers can update status.');
    }
    item.status = status;
    return this.itemRepo.save(item);
  }

  async getAiMatches() {
    const lostItems = await this.itemRepo.find({
      where: { type: 'lost', status: 'reported' },
      relations: ['reportedBy'],
    });

    const foundItems = await this.itemRepo.find({
      where: { type: 'found', status: 'reported' },
      relations: ['reportedBy'],
    });

    const matches = [];
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'at', 'with', 'for', 'of', 'and', 'or', 'to', 'containing', 'with', 'my', 'is', 'lost', 'found']);

    for (const lost of lostItems) {
      const lostWords = lost.description.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

      for (const found of foundItems) {
        const foundWords = found.description.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w));

        const intersection = lostWords.filter(w => foundWords.includes(w));
        
        const lostLoc = lost.lastSeenLocation.toLowerCase();
        const foundLoc = found.lastSeenLocation.toLowerCase();
        const locWords = ['library', 'canteen', 'lab', 'gym', 'auditorium', 'block', 'science', 'engineering'];
        let locMatch = false;
        for (const lw of locWords) {
          if (lostLoc.includes(lw) && foundLoc.includes(lw)) {
            locMatch = true;
            break;
          }
        }

        if (intersection.length > 0) {
          const totalWords = Array.from(new Set([...lostWords, ...foundWords])).length;
          let prob = (intersection.length / totalWords) * 100;
          
          if (locMatch) {
            prob += 20;
          }
          prob = Math.min(Math.round(prob), 99);

          if (prob >= 25) {
            matches.push({
              lostItem: lost,
              foundItem: found,
              probability: prob,
              reasoning: `Shared descriptive keywords [${intersection.join(', ')}]` + (locMatch ? ` and matching campus location.` : `.`),
            });
          }
        }
      }
    }

    return matches.sort((a, b) => b.probability - a.probability);
  }

  async linkAndClaim(lostId: string, foundId: string, user: any) {
    if (user.role !== 'lfofficer' && user.role !== 'admin') {
      throw new ForbiddenException('Only officers can link and resolve claims.');
    }

    const lost = await this.findOne(lostId);
    const found = await this.findOne(foundId);

    lost.status = 'claimed';
    lost.matchedWithId = found.id;
    found.status = 'claimed';
    found.matchedWithId = lost.id;

    await this.itemRepo.save(lost);
    await this.itemRepo.save(found);

    this.notificationsGateway.sendToUser(lost.reportedById, 'lost_item_found_claim', {
      lostId: lost.id,
      foundId: found.id,
      description: found.description,
    });

    return { status: 'success', lost, found };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUnclaimedItems() {
    console.log('[Cron Job] Scanning for unclaimed found items...');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const oldItems = await this.itemRepo.find({
      where: {
        type: 'found',
        status: 'reported',
        loggedAt: LessThan(cutoffDate),
      },
    });

    for (const item of oldItems) {
      if (item.condition === 'excellent' || item.condition === 'good') {
        item.status = 'donated';
      } else {
        item.status = 'disposed';
      }
      await this.itemRepo.save(item);
    }
  }
}