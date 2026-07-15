import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('CampusLoop Platform E2E Integration (Controllers)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let staffToken: string;
  let studentToken: string;
  
  let testBookingId: string;
  let testListingId: string;
  let testLoanId: string;
  let testLostItemId: string;
  let testFoundItemId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query('TRUNCATE TABLE bookings, peer_loans, peer_listings, lost_found_items, study_group_interests CASCADE');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Auth Module (SSO Simulator)', () => {
    it('/api/auth/login (Student) - 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'student_cs@meridian.edu', password: 'student123' })
        .expect(201);
      studentToken = response.body.access_token;
    });

    it('/api/auth/login (Staff) - 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'cs_manager@meridian.edu', password: 'manager123' })
        .expect(201);
      staffToken = response.body.access_token;
    });

    it('/api/auth/login (Admin) - 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@meridian.edu', password: 'admin123' })
        .expect(201);
      adminToken = response.body.access_token;
    });

    it('/api/auth/me - 200 OK', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });
  });

  describe('Assets Module', () => {
    it('/api/assets (GET) - 200 OK', () => {
      return request(app.getHttpServer())
        .get('/api/assets')
        .expect(200);
    });

    it('/api/assets (POST) - 403 Student', () => {
      return request(app.getHttpServer())
        .post('/api/assets')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: ' Spectrometer', description: 'desc', category: 'equipment', departmentId: 'c0a80101-1234-1234-1234-1234567890ab' })
        .expect(403);
    });

    it('/api/assets/search/smart - 201', () => {
      return request(app.getHttpServer())
        .post('/api/assets/search/smart')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'something to record sound' })
        .expect(201);
    });
  });

  describe('Bookings Module', () => {
    it('/api/bookings (POST) - 201 Created', async () => {
      const assets = await dataSource.query(`SELECT id FROM assets WHERE name = 'Sony DSLR Camera A7III'`);
      const assetId = assets[0].id;
      const start = new Date();
      start.setDate(start.getDate() + 2);
      const end = new Date(start);
      end.setHours(end.getHours() + 3);

      const response = await request(app.getHttpServer())
        .post('/api/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ assetId, startTime: start.toISOString(), endTime: end.toISOString() })
        .expect(201);
      testBookingId = response.body.id;
    });
  });

  describe('Peer Lending Module', () => {
    it('/api/peer-lending/listings (POST) - 201', () => {
      return request(app.getHttpServer())
        .post('/api/peer-lending/listings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Calculus Book', description: 'CLRS', category: 'textbook', condition: 'good' })
        .expect(201)
        .then(res => { testListingId = res.body.id; });
    });
  });

  describe('Lost & Found Module', () => {
    it('/api/lost-found (POST) - 201', () => {
      return request(app.getHttpServer())
        .post('/api/lost-found')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'lost', description: 'Lost silver MacBook laptop in Library', lastSeenLocation: 'Library Level 1' })
        .expect(201)
        .then(res => { testLostItemId = res.body.id; });
    });

    it('/api/lost-found/matches (GET) - 200', () => {
      return request(app.getHttpServer())
        .get('/api/lost-found/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Study Groups Module', () => {
    it('/api/study-groups/interests (POST) - 201', () => {
      return request(app.getHttpServer())
        .post('/api/study-groups/interests')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ moduleCode: 'CS101', preferredStyle: 'group', availabilitySlots: ['Mon_9_12'] })
        .expect(201);
    });
  });

  describe('Analytics Module (Admin Panel)', () => {
    it('/api/analytics (GET) - 403 Student', () => {
      return request(app.getHttpServer())
        .get('/api/analytics')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('/api/analytics (GET) - 200 Admin', () => {
      return request(app.getHttpServer())
        .get('/api/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});