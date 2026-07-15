import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('lost_found_items')
export class LostFoundItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    default: 'lost',
  })
  type: string;

  @Column({ name: 'reported_by_id', type: 'uuid' })
  reportedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_by_id' })
  reportedBy: User;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'last_seen_location' })
  lastSeenLocation: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  condition: string;

  @Column({
    type: 'varchar',
    default: 'reported',
  })
  status: string;

  @Column({ name: 'matched_with_id', type: 'uuid', nullable: true })
  matchedWithId: string;

  @Column({ name: 'match_probability', type: 'decimal', precision: 3, scale: 2, nullable: true })
  matchProbability: number;

  @Column({ name: 'logged_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  loggedAt: Date;
}