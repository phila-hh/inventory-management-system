import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument, AlertStatus, AlertType } from './schema/alert.schema';
import { InventoryGateway } from 'src/gateways/ems.gateway';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name)
    private alertModel: Model<AlertDocument>,
    private readonly gateway: InventoryGateway,
  ) {}

  async create(
    itemId: string,
    itemName: string,
    message: string,
    type: AlertType,
  ): Promise<Alert> {
    
    const existingAlert = await this.alertModel
      .findOne({ itemId, status: AlertStatus.NEW, type })
      .exec();

    if (existingAlert) {
      
      existingAlert.message = message;
      existingAlert.createdAt = new Date();
      return existingAlert.save();
    }

    const newAlert = new this.alertModel({
      itemId,
      itemName,
      message,
      type,
      status: AlertStatus.NEW,
      createdAt: new Date(),
    });

    const savedAlert = await newAlert.save();
    
    
    this.gateway.emitNewAlert(savedAlert);
    
    return savedAlert;
  }

  async findAll(status?: AlertStatus, startDate?: string, endDate?: string): Promise<Alert[]> {
    const query: any = {};

    if (status) {
      query.status = status;
    }

    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    return this.alertModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertModel.findById(id).exec();
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }
    return alert;
  }

  async dismiss(id: string): Promise<Alert> {
    const updated = await this.alertModel
      .findByIdAndUpdate(
        id,
        { status: AlertStatus.DISMISSED },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    return updated;
  }

  async dismissAllForItem(itemId: string): Promise<void> {
    await this.alertModel
      .updateMany(
        { itemId, status: AlertStatus.NEW },
        { status: AlertStatus.DISMISSED },
      )
      .exec();
  }

  async getActiveAlertsCount(): Promise<number> {
    return this.alertModel.countDocuments({ status: AlertStatus.NEW }).exec();
  }
}
