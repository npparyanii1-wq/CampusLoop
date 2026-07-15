import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PeerListing } from './peer-listing.entity';
import { User } from './user.entity';

@Entity('peer_loans')
export class PeerLoan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'peer_listing_id', type: 'uuid' })
  peerListingId: string;

  @ManyToOne(() => PeerListing, (listing) => listing.loans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'peer_listing_id' })
  peerListing: PeerListing;

  @Column({ name: 'borrower_id', type: 'uuid' })
  borrowerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'borrower_id' })
  borrower: User;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  status: string;

  @Column({ name: 'borrower_rating', type: 'integer', nullable: true })
  borrowerRating: number;

  @Column({ name: 'lender_rating', type: 'integer', nullable: true })
  lenderRating: number;

  @Column({ name: 'borrower_review', type: 'text', nullable: true })
  borrowerReview: string;

  @Column({ name: 'lender_review', type: 'text', nullable: true })
  lenderReview: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}