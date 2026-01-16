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
import { InventoryFactory } from '../helpers/factories/inventory.factory';
import { OrderFactory } from '../helpers/factories/order.factory';
import { UserFactory } from '../helpers/factories/user.factory';
import AllExceptionsFilter from '../../src/filters/allExceptions.filter';
import { UserRole } from '../../src/modules/core/users/schema/user.schema';
import { ItemUnit } from '../../src/modules/inventory/schema/inventory-item.schema';


describe('Chatbot Controller (e2e)', () => {
  let app: INestApplication;
  let inventoryFactory: InventoryFactory;
  let orderFactory: OrderFactory;
  let userFactory: UserFactory;

  let staffToken: string;

  beforeAll(async () => {
    await connectToDatabase();

    process.env.JWT_SECRET = 'test-secret';
    // Ensure AI is disabled so we test deterministic rule-based logic
    delete process.env.OPENROUTER_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const inventoryModel = moduleFixture.get('InventoryItemModel');
    const orderModel = moduleFixture.get('OrderModel');
    const userModel = moduleFixture.get('UserModel');

    inventoryFactory = new InventoryFactory(inventoryModel);
    orderFactory = new OrderFactory(orderModel);
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
    const uniqueStaffUsername = `chat_staff_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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

  describe('POST /chatbot/query', () => {
    beforeEach(async () => await setupUser());

    it('should return stock level for a specific item', async () => {
      await inventoryFactory.create({
        name: 'Hammer',
        quantity: 15,
        unit: ItemUnit.PCS
      });

      const response = await request(app.getHttpServer())
        .post('/chatbot/query')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ query: 'stock level for Hammer' })
        .expect(200);

      expect(response.body.response).toContain('15 pcs');
      expect(response.body.response).toContain('Hammer');
    });

    it('should handle item not found', async () => {
      const response = await request(app.getHttpServer())
        .post('/chatbot/query')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ query: 'stock level for NonExistentItem' })
        .expect(200);

      expect(response.body.response).toContain('not found');
    });

    it('should list low stock items', async () => {
      // Good Stock
      await inventoryFactory.create({ name: 'Plenty', quantity: 100, reorderThreshold: 10 });
      // Low Stock
      await inventoryFactory.create({ name: 'Scarce', quantity: 2, reorderThreshold: 10 });

      const response = await request(app.getHttpServer())
        .post('/chatbot/query')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ query: 'items running low' })
        .expect(200);

      expect(response.body.response).toContain('Scarce');
      expect(response.body.response).not.toContain('Plenty');
      expect(response.body.response).toContain('running low');
    });

    it('should list recent orders', async () => {
      await orderFactory.createMany(3);

      const response = await request(app.getHttpServer())
        .post('/chatbot/query')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ query: 'check recent orders' })
        .expect(200);

      expect(response.body.response).toContain('Recent orders');
      // Should find at least one list item (e.g. "1. OUTGOING")
      expect(response.body.response).toMatch(/\d\.\s+(incoming|outgoing)/);
    });

    it('should filter items by category', async () => {
      await inventoryFactory.create({ name: 'Drill', category: 'Tools' });
      await inventoryFactory.create({ name: 'Paint', category: 'Materials' });

      const response = await request(app.getHttpServer())
        .post('/chatbot/query')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ query: 'show all tools' })
        .expect(200);

      expect(response.body.response).toContain('Drill');
      expect(response.body.response).not.toContain('Paint');
    });

    it('should provide help for unrecognized queries', async () => {
      const response = await request(app.getHttpServer())
        .post('/chatbot/query')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ query: 'what is the meaning of life' })
        .expect(200);

      expect(response.body.response).toContain('I can help you with');
      expect(response.body.response).toContain('Check stock levels');
    });
  });
});
