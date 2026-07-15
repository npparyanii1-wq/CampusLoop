import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Department } from './department.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'varchar',
    default: 'student',
  })
  role: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, (dept) => dept.users, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ nullable: true })
  faculty: string;

  @Column({ name: 'reputation_score', type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  reputationScore: number;
}