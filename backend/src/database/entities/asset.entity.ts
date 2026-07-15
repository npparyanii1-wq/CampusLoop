import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';
import { Booking } from './booking.entity';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'varchar',
    default: 'equipment',
  })
  category: string;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId: string;

  @ManyToOne(() => Department, (dept) => dept.assets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({
    type: 'varchar',
    default: 'excellent',
  })
  condition: string;

  @Column({
    type: 'varchar',
    default: 'available',
  })
  status: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ name: 'booking_lead_time', type: 'integer', default: 0 })
  bookingLeadTime: number;

  @Column({ name: 'is_high_value', type: 'boolean', default: false })
  isHighValue: boolean;

  @OneToMany(() => Booking, (booking) => booking.asset)
  bookings: Booking[];
}