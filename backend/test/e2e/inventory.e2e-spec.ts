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
import { UserFactory } from '../helpers/factories/user.factory';
import { CategoryFactory } from '../helpers/factories/category.factory';
import AllExceptionsFilter from '../../src/filters/allExceptions.filter';
import { UserRole } from '../../src/modules/core/users/schema/user.schema';
import { CreateInventoryItemDto } from '../../src/modules/inventory/dto/create-inventory-item.dto';
import { ItemUnit } from '../../src/modules/inventory/schema/inventory-item.schema';

describe('Inventory Controller (e2e)', () => {
  let app: INestApplication;
  let inventoryFactory: InventoryFactory;
  let userFactory: UserFactory;
  let categoryFactory: CategoryFactory;

  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    await connectToDatabase();

    process.env.JWT_SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const inventoryModel = moduleFixture.get('InventoryItemModel');
    const userModel = moduleFixture.get('UserModel');
    const categoryModel = moduleFixture.get('CategoryModel');

    inventoryFactory = new InventoryFactory(inventoryModel);
    userFactory = new UserFactory(userModel);
    categoryFactory = new CategoryFactory(categoryModel);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
    await closeDatabaseConnection();
  });

  // Helper to setup users and get tokens before specific test blocks
  const setupUsersAndTokens = async () => {
    // Create Admin
    const uniqueAdminUsername = `admin_inventory_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const adminUser = await userFactory.create({
      username: uniqueAdminUsername,
      password: 'password123',
      role: UserRole.ADMIN,
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ username: uniqueAdminUsername, password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    // Create Staff
    const uniqueStaffUsername = `staff_inventory_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const staffUser = await userFactory.create({
      username: uniqueStaffUsername,
      password: 'password123',
      role: UserRole.STAFF,
    });
    const staffLogin = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ username: uniqueStaffUsername, password: 'password123' });
    staffToken = staffLogin.body.accessToken;
  };

  describe('POST /inventory', () => {
    beforeEach(async () => await setupUsersAndTokens());

    const createDto: CreateInventoryItemDto = {
      name: 'Hammer',
      description: 'Heavy duty hammer',
      category: 'Tools',
      quantity: 50,
      unit: ItemUnit.PCS,
      reorderThreshold: 10,
    };

    it('should create an item successfully when user is Admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('name', 'Hammer');
      expect(response.body).toHaveProperty('_id');
    });

    it('should fail (403) when user is Staff', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(createDto)
        .expect(403);
    });

    it('should fail (401) when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/inventory')
        .send(createDto)
        .expect(401);
    });

    it('should fail (400) on invalid data', async () => {
      const invalidDto = { ...createDto, quantity: -5 }; // Invalid quantity
      await request(app.getHttpServer())
        .post('/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /inventory', () => {
    beforeEach(async () => {
      await setupUsersAndTokens();
      // Seed data
      await inventoryFactory.create({ name: 'Drill', category: 'Tools' });
      await inventoryFactory.create({ name: 'Paint', category: 'Materials' });
      await inventoryFactory.create({ name: 'Nails', category: 'Materials' });
    });

    it('should list all items', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${staffToken}`) // Staff can view
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should filter items by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory?category=Tools')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Drill');
    });

    it('should search items by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory?search=Pai')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Paint');
    });
  });

  describe('GET /inventory/low-stock', () => {
    beforeEach(async () => {
      await setupUsersAndTokens();
      // Good Stock
      await inventoryFactory.create({ quantity: 100, reorderThreshold: 10, name: 'Plenty' });
      // Low Stock
      await inventoryFactory.create({ quantity: 2, reorderThreshold: 10, name: 'Scarce' });
    });

    it('should return only items below threshold', async () => {
      const response = await request(app.getHttpServer())
        .get('/inventory/low-stock')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Scarce');
    });
  });

  describe('GET /inventory/:id', () => {
    let itemId: string;
    beforeEach(async () => {
      await setupUsersAndTokens();
      const item = await inventoryFactory.create({ name: 'Unique Item' });
      itemId = item._id.toString();
    });

    it('should return a single item', async () => {
      const response = await request(app.getHttpServer())
        .get(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Unique Item');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app.getHttpServer())
        .get(`/inventory/${fakeId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(404);
    });
  });

  describe('PUT /inventory/:id', () => {
    let itemId: string;
    beforeEach(async () => {
      await setupUsersAndTokens();
      const item = await inventoryFactory.create({ name: 'Old Name', quantity: 10 });
      itemId = item._id.toString();
    });

    it('should update item when user is Admin', async () => {
      const updateData = { name: 'New Name', quantity: 20 };

      const response = await request(app.getHttpServer())
        .put(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'New Name');
      expect(response.body).toHaveProperty('quantity', 20);
    });

    it('should fail (403) when user is Staff', async () => {
      await request(app.getHttpServer())
        .put(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /inventory/:id', () => {
    let itemId: string;
    beforeEach(async () => {
      await setupUsersAndTokens();
      const item = await inventoryFactory.create();
      itemId = item._id.toString();
    });

    it('should delete item when user is Admin', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's gone
      const response = await request(app.getHttpServer())
        .get(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should fail (403) when user is Staff', async () => {
      await request(app.getHttpServer())
        .delete(`/inventory/${itemId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });
  });
});
