import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('study_group_interests')
export class StudyGroupInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'module_code' })
  moduleCode: string;

  @Column({ name: 'preferred_style', default: 'group' })
  preferredStyle: string;

  @Column({ name: 'availability_slots', type: 'text' })
  availabilitySlots: string;

  @Column({
    type: 'varchar',
    default: 'searching',
  })
  status: string;

  @Column({ name: 'matched_with_id', type: 'uuid', nullable: true })
  matchedWithId: string;
}