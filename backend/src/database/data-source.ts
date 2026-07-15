import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Department } from './entities/department.entity';
import { User } from './entities/user.entity';
import { Asset } from './entities/asset.entity';
import { Booking } from './entities/booking.entity';
import { PeerListing } from './entities/peer-listing.entity';
import { PeerLoan } from './entities/peer-loan.entity';
import { LostFoundItem } from './entities/lost-found-item.entity';
import { StudyGroupInterest } from './entities/study-group-interest.entity';

config(); // Load .env file

// Use empty password for trust-based auth on localhost
// If DB_PASSWORD not set, use empty string which pg driver accepts
const dbPassword = process.env.DB_PASSWORD || 'postgres';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: dbPassword,
  database: process.env.DB_DATABASE || 'campusloop',
  ssl: process.env.DB_HOST?.includes('.tech') || process.env.DB_HOST?.includes('.co') ? { rejectUnauthorized: false } : false,
  entities: [
    Department,
    User,
    Asset,
    Booking,
    PeerListing,
    PeerLoan,
    LostFoundItem,
    StudyGroupInterest,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
