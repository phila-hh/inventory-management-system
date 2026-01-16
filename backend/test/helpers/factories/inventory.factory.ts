import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import { InventoryItem, ItemUnit } from '../../../src/modules/inventory/schema/inventory-item.schema';

faker.setLocale('en');

export class InventoryFactory {
  constructor(private inventoryModel: Model<InventoryItem>) {}

  async create(overrides: Partial<InventoryItem> = {}): Promise<InventoryItem> {
    const defaultData = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      // Default to a random word if no category is provided
      category: 'General',
      quantity: faker.datatype.number({ min: 10, max: 100 }),
      unit: faker.helpers.arrayElement(Object.values(ItemUnit)),
      reorderThreshold: 5,
      lastUpdated: new Date(),
      forecast: {
        predictedUsage: 0,
        forecastDate: new Date(),
      },
    };

    return this.inventoryModel.create({ ...defaultData, ...overrides });
  }

  async createMany(count: number, overrides: Partial<InventoryItem> = {}): Promise<InventoryItem[]> {
    const items: InventoryItem[] = [];
    for (let i = 0; i < count; i++) {
      items.push(await this.create(overrides));
    }
    return items;
  }
}
