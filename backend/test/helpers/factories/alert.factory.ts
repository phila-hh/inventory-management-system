import { Model, Types } from 'mongoose';
import { faker } from '@faker-js/faker';
import { Alert, AlertStatus, AlertType } from '../../../src/modules/alerts/schema/alert.schema';

export class AlertFactory {
  constructor(private alertModel: Model<Alert>) {}

  async create(overrides: Partial<Alert> = {}): Promise<Alert> {
    const defaultData = {
      itemId: new Types.ObjectId(),
      itemName: faker.commerce.productName(),
      message: 'Stock is running low',
      status: AlertStatus.NEW,
      type: AlertType.MANUAL_THRESHOLD,
      createdAt: new Date(),
    };

    return this.alertModel.create({ ...defaultData, ...overrides });
  }

  async createMany(count: number, overrides: Partial<Alert> = {}): Promise<Alert[]> {
    const alerts: Alert[] = [];
    for (let i = 0; i < count; i++) {
      alerts.push(await this.create(overrides));
    }
    return alerts;
  }
}
