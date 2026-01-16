import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import { Category } from '../../../src/modules/categories/schema/category.schema';

export class CategoryFactory {
  constructor(private categoryModel: Model<Category>) {}

  async create(overrides: Partial<Category> = {}): Promise<Category> {
    const defaultData = {
      name: faker.commerce.department() + ' ' + faker.number.int({ min: 1, max: 1000 }), // Ensure uniqueness
      description: faker.lorem.sentence(),
      icon: 'box-icon',
      isActive: true,
    };

    return this.categoryModel.create({ ...defaultData, ...overrides });
  }

  async createMany(count: number, overrides: Partial<Category> = {}): Promise<Category[]> {
    const categories: Category[] = [];
    for (let i = 0; i < count; i++) {
      categories.push(await this.create(overrides));
    }
    return categories;
  }
}
