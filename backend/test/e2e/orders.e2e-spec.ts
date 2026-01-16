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
import { OrderFactory } from '../helpers/factories/order.factory';
import { UserFactory } from '../helpers/factories/user.factory';
import { InventoryFactory } from '../helpers/factories/inventory.factory';
import AllExceptionsFilter from '../../src/filters/allExceptions.filter';
import { UserRole } from '../../src/modules/core/users/schema/user.schema';
import { OrderType, OrderStatus } from '../../src/modules/orders/schema/order.schema';
import { CreateOrderDto } from '../../src/modules/orders/dto/create-order.dto';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Orders Controller (e2e)', () => {
  let app: INestApplication;
  let orderFactory: OrderFactory;
  let userFactory: UserFactory;
  let inventoryFactory: InventoryFactory;

  let staffToken: string;
  let staffUserId: string;

  beforeAll(async () => {
    await connectToDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();

    const orderModel = moduleFixture.get('OrderModel');
    const userModel = moduleFixture.get('UserModel');
    const inventoryModel = moduleFixture.get('InventoryItemModel');

    orderFactory = new OrderFactory(orderModel);
    userFactory = new UserFactory(userModel);
    inventoryFactory = new InventoryFactory(inventoryModel);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    if (app) await app.close();
    await closeDatabaseConnection();
  });

  // ... (keep the rest of the file exactly as it was) ...
  const setupUser = async () => {
    const uniqueUsername = `staff_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const user = await userFactory.create({
      username: uniqueUsername,
      role: UserRole.STAFF,
      password: 'password123',
    });
    staffUserId = user._id.toString();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ username: uniqueUsername, password: 'password123' });

    staffToken = loginRes.body.accessToken;
  };

  describe('POST /orders', () => {
    beforeEach(async () => await setupUser());

    it('should fail (400) if quantity is invalid', async () => {
      const item = await inventoryFactory.create();
      const createDto = {
        type: OrderType.OUTGOING,
        items: [{ itemId: item._id.toString(), quantity: 0 }],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /orders', () => {
    beforeEach(async () => await setupUser());

    it('should list all orders', async () => {
      await orderFactory.create({ createdBy: new mongoose.Types.ObjectId(staffUserId) });
      await orderFactory.create({ createdBy: new mongoose.Types.ObjectId(staffUserId) });

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should filter by status', async () => {
      await orderFactory.create({ status: OrderStatus.PENDING });
      await orderFactory.create({ status: OrderStatus.COMPLETED });

      const response = await request(app.getHttpServer())
        .get(`/orders?status=${OrderStatus.COMPLETED}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe(OrderStatus.COMPLETED);
    });
  });

  describe('GET /orders/:id', () => {
    let orderId: string;
    beforeEach(async () => {
      await setupUser();
      const order = await orderFactory.create();
      orderId = order._id.toString();
    });

    it('should return a single order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', orderId);
    });

    it('should return 404 for unknown ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .get(`/orders/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);
    });
  });

  describe('PUT /orders/:id', () => {
    let orderId: string;
    beforeEach(async () => {
      await setupUser();
      const order = await orderFactory.create({ status: OrderStatus.PENDING });
      orderId = order._id.toString();
    });

    it('should update order status', async () => {
      const updateDto = { status: OrderStatus.COMPLETED };

      const response = await request(app.getHttpServer())
        .put(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('status', OrderStatus.COMPLETED);
    });
  });

  describe('PATCH /orders/:id/cancel', () => {
    let orderId: string;
    beforeEach(async () => {
      await setupUser();
      const order = await orderFactory.create({ status: OrderStatus.PENDING });
      orderId = order._id.toString();
    });

    it('should cancel an order', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', OrderStatus.CANCELLED);
    });
  });
});
