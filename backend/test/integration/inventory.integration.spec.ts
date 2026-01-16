import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { InventoryItem, InventoryItemSchema, ItemUnit } from '../../src/modules/inventory/schema/inventory-item.schema';
import {
  connectToDatabase,
  closeDatabaseConnection,
  clearDatabase,
} from '../helpers/test-database.helper';
import { InventoryFactory } from '../helpers/factories/inventory.factory';
import { CreateInventoryItemDto } from '../../src/modules/inventory/dto/create-inventory-item.dto';

describe('InventoryService (Integration)', () => {
  let inventoryService: InventoryService;
  let inventoryFactory: InventoryFactory;
  let module: TestingModule;

  beforeAll(async () => {
    await connectToDatabase();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/inventory_test_db'),
        MongooseModule.forFeature([{ name: InventoryItem.name, schema: InventoryItemSchema }]),
      ],
      providers: [InventoryService],
    }).compile();

    inventoryService = module.get<InventoryService>(InventoryService);

    const inventoryModel = module.get('InventoryItemModel');
    inventoryFactory = new InventoryFactory(inventoryModel);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await module.close();
    await closeDatabaseConnection();
  });

  describe('create', () => {
    it('should create and save a new inventory item', async () => {
      const createDto: CreateInventoryItemDto = {
        name: 'Screwdriver',
        description: 'Phillips head',
        category: 'Tools',
        quantity: 100,
        unit: ItemUnit.PCS,
        reorderThreshold: 10,
      };

      const result = await inventoryService.create(createDto);

      expect(result).toHaveProperty('_id');
      expect(result.name).toBe('Screwdriver');
      expect(result.lastUpdated).toBeDefined();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await inventoryFactory.create({ name: 'Hammer', category: 'Tools' });
      await inventoryFactory.create({ name: 'Drill', category: 'Tools' });
      await inventoryFactory.create({ name: 'Paint', category: 'Materials' });
    });

    it('should return all items if no filters provided', async () => {
      const results = await inventoryService.findAll();
      expect(results).toHaveLength(3);
    });

    it('should filter by category', async () => {
      const results = await inventoryService.findAll('Tools');
      expect(results).toHaveLength(2);
      expect(results.every(i => i.category === 'Tools')).toBe(true);
    });

    it('should search by name (case insensitive)', async () => {
      const results = await inventoryService.findAll(undefined, 'drill');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Drill');
    });
  });

  describe('findLowStock', () => {
    it('should return items where quantity < reorderThreshold', async () => {
      // Not Low: 10 > 5
      await inventoryFactory.create({ quantity: 10, reorderThreshold: 5 });
      // Low: 4 < 5
      const lowItem = await inventoryFactory.create({ quantity: 4, reorderThreshold: 5 });
      // Exact: 5 == 5 (Logic says strictly less than)
      await inventoryFactory.create({ quantity: 5, reorderThreshold: 5 });

      const results = await inventoryService.findLowStock();

      expect(results).toHaveLength(1);
      expect(results[0]._id.toString()).toBe(lowItem._id.toString());
    });
  });

  describe('findForecastBasedLowStock', () => {
    it('should return items where (quantity - predictedUsage) < threshold', async () => {
      // Current: 20, Predicted Use: 15, Remaining: 5. Threshold: 6.
      // 5 < 6 -> Should be flagged.
      const riskyItem = await inventoryFactory.create({
        quantity: 20,
        reorderThreshold: 6,
        forecast: { predictedUsage: 15, forecastDate: new Date() }
      });

      // Current: 20, Predicted Use: 10, Remaining: 10. Threshold: 6.
      // 10 > 6 -> Safe.
      await inventoryFactory.create({
        quantity: 20,
        reorderThreshold: 6,
        forecast: { predictedUsage: 10, forecastDate: new Date() }
      });

      const results = await inventoryService.findForecastBasedLowStock();

      expect(results).toHaveLength(1);
      expect(results[0]._id.toString()).toBe(riskyItem._id.toString());
    });
  });

  describe('update', () => {
    it('should update item and lastUpdated timestamp', async () => {
      const item = await inventoryFactory.create({ quantity: 10 });
      const oldUpdateDate = item.lastUpdated;

      // Wait 1ms to ensure time difference
      await new Promise(r => setTimeout(r, 1));

      const updated = await inventoryService.update(item._id.toString(), { quantity: 20 });

      expect(updated.quantity).toBe(20);
      expect(updated.lastUpdated.getTime()).toBeGreaterThan(oldUpdateDate.getTime());
    });

    it('should throw NotFoundException if id invalid', async () => {
      await expect(inventoryService.update('507f1f77bcf86cd799439011', {}))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
