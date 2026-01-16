import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import mongoose from 'mongoose';
import AppModule from '../../src/modules/app/app.module';
import {
  connectToDatabase,
  closeDatabaseConnection,
  clearDatabase,
} from '../helpers/test-database.helper';
import { AlertFactory } from '../helpers/factories/alert.factory';
import { UserFactory } from '../helpers/factories/user.factory';
import AllExceptionsFilter from '../../src/filters/allExceptions.filter';
import { UserRole } from '../../src/modules/core/users/schema/user.schema';
import { AlertStatus, AlertType } from '../../src/modules/alerts/schema/alert.schema';

describe('Alerts Controller (e2e)', () => {
  let app: INestApplication;
  let alertFactory: AlertFactory;
  let userFactory: UserFactory;

  let staffToken: string;

  beforeAll(async () => {
    await connectToDatabase();

    process.env.JWT_SECRET = 'test-secret';
    // Disable AI for deterministic behavior in job triggers
    delete process.env.OPENROUTER_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const alertModel = moduleFixture.get('AlertModel');
    const userModel = moduleFixture.get('UserModel');

    alertFactory = new AlertFactory(alertModel);
    userFactory = new UserFactory(userModel);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabaseConnection();
  });

  const setupUser = async () => {
    const uniqueStaffUsername = `alert_staff_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await userFactory.create({
      username: uniqueStaffUsername,
      role: UserRole.STAFF,
      password: 'password123',
    });

    const loginRes = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ username: uniqueStaffUsername, password: 'password123' });

    staffToken = loginRes.body.accessToken;
  };

  describe('GET /alerts', () => {
    beforeEach(async () => await setupUser());

    it('should list all alerts', async () => {
      await alertFactory.create({ itemName: 'Item A' });
      await alertFactory.create({ itemName: 'Item B' });

      const response = await request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should filter by status', async () => {
      await alertFactory.create({ status: AlertStatus.NEW });
      await alertFactory.create({ status: AlertStatus.DISMISSED });

      const response = await request(app.getHttpServer())
        .get(`/alerts?status=${AlertStatus.NEW}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(AlertStatus.NEW);
    });
  });

  describe('GET /alerts/count', () => {
    beforeEach(async () => await setupUser());

    it('should return count of active alerts', async () => {
      await alertFactory.createMany(3, { status: AlertStatus.NEW });
      await alertFactory.createMany(2, { status: AlertStatus.DISMISSED });

      const response = await request(app.getHttpServer())
        .get('/alerts/count')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count', 3);
    });
  });

  describe('GET /alerts/:id', () => {
    let alertId: string;
    beforeEach(async () => {
      await setupUser();
      const alert = await alertFactory.create({ itemName: 'Critical Item' });
      alertId = alert._id.toString();
    });

    it('should return a single alert', async () => {
      const response = await request(app.getHttpServer())
        .get(`/alerts/${alertId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('itemName', 'Critical Item');
    });

    it('should return 404 for unknown ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .get(`/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);
    });
  });

  describe('Alert Dismissal', () => {
    let alertId: string;
    beforeEach(async () => {
      await setupUser();
      const alert = await alertFactory.create({ status: AlertStatus.NEW });
      alertId = alert._id.toString();
    });

    it('should dismiss alert via PUT', async () => {
      const response = await request(app.getHttpServer())
        .put(`/alerts/${alertId}/dismiss`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', AlertStatus.DISMISSED);
    });

    it('should dismiss alert via PATCH', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/alerts/${alertId}/dismiss`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', AlertStatus.DISMISSED);
    });
  });

  describe('Job Triggers', () => {
    beforeEach(async () => await setupUser());

    it('should trigger forecasting job', async () => {
      await request(app.getHttpServer())
        .post('/alerts/trigger/forecasting')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(201); // Post usually returns 201
    });

    it('should trigger reorder alerts job', async () => {
      await request(app.getHttpServer())
        .post('/alerts/trigger/reorder-alerts')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(201);
    });
  });
});
