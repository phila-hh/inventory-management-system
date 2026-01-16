import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from './schema/inventory-item.schema';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
  ) {}

  async create(createDto: CreateInventoryItemDto): Promise<InventoryItem> {
    const newItem = new this.inventoryItemModel({
      ...createDto,
      lastUpdated: new Date(),
    });
    return newItem.save();
  }

  async findAll(
    category?: string,
    search?: string,
  ): Promise<InventoryItem[]> {
    const query: any = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    return this.inventoryItemModel.find(query).sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<InventoryItem> {
    const item = await this.inventoryItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateDto: UpdateInventoryItemDto,
  ): Promise<InventoryItem> {
    const updated = await this.inventoryItemModel
      .findByIdAndUpdate(
        id,
        { ...updateDto, lastUpdated: new Date() },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.inventoryItemModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
  }

  async updateForecast(
    id: string,
    predictedUsage: number,
  ): Promise<InventoryItem> {
    const updated = await this.inventoryItemModel
      .findByIdAndUpdate(
        id,
        {
          'forecast.predictedUsage': predictedUsage,
          'forecast.forecastDate': new Date(),
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return updated;
  }

  async findLowStock(): Promise<InventoryItem[]> {
    
    return this.inventoryItemModel
      .find({
        $expr: {
          $lt: ['$quantity', '$reorderThreshold'],
        },
      })
      .exec();
  }

  async findForecastBasedLowStock(): Promise<InventoryItem[]> {
    
    return this.inventoryItemModel
      .find({
        $expr: {
          $lt: [
            { $subtract: ['$quantity', '$forecast.predictedUsage'] },
            '$reorderThreshold',
          ],
        },
      })
      .exec();
  }

  async searchByName(name: string): Promise<InventoryItem | null> {
    return this.inventoryItemModel
      .findOne({ name: new RegExp(name, 'i') })
      .exec();
  }
}
