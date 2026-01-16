import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import { Order, OrderType, OrderStatus } from '../../../src/modules/orders/schema/order.schema';
import { ItemUnit } from '../../../src/modules/inventory/schema/inventory-item.schema';

export class OrderFactory {
  constructor(private orderModel: Model<Order>) {}

  async create(overrides: Partial<Order> = {}): Promise<Order> {
    // Generate a random ObjectId for user if not provided
    const defaultUserId = new Types.ObjectId();
    const defaultItemId = new Types.ObjectId();

    const defaultData = {
      type: OrderType.OUTGOING,
      status: OrderStatus.PENDING,
      notes: faker.lorem.sentence(),
      createdBy: defaultUserId,
      createdAt: new Date(),
      items: [
        {
          itemId: defaultItemId,
          name: faker.commerce.productName(),
          quantity: faker.datatype.number({ min: 1, max: 10 }),
          unit: ItemUnit.PCS,
        },
      ],
    };

    return this.orderModel.create({ ...defaultData, ...overrides });
  }

  async createMany(count: number, overrides: Partial<Order> = {}): Promise<Order[]> {
    const orders: Order[] = [];
    for (let i = 0; i < count; i++) {
      orders.push(await this.create(overrides));
    }
    return orders;
  }
}
