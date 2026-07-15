import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { PeerLoan } from './peer-loan.entity';

@Entity('peer_listings')
export class PeerListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({
    type: 'varchar',
    default: 'good',
  })
  condition: string;

  @Column({
    type: 'varchar',
    default: 'available',
  })
  status: string;

  @OneToMany(() => PeerLoan, (loan) => loan.peerListing)
  loans: PeerLoan[];
}