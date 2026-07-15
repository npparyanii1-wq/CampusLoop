import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Asset } from './asset.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  faculty: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @OneToMany(() => Asset, (asset) => asset.department)
  assets: Asset[];
}