import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, ClientSession } from 'mongoose';
import { Order, OrderDocument, OrderType, OrderStatus } from './schema/order.schema';
import { InventoryItem, InventoryItemDocument } from '../inventory/schema/inventory-item.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(InventoryItem.name)
    private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async create(createDto: CreateOrderDto, userId: string): Promise<Order> {
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      
      const orderItems = [];

      for (const item of createDto.items) {
        const inventoryItem = await this.inventoryItemModel
          .findById(item.itemId)
          .session(session)
          .exec();

        if (!inventoryItem) {
          throw new NotFoundException(
            `Inventory item with ID ${item.itemId} not found`,
          );
        }

        
        if (createDto.type === OrderType.OUTGOING) {
          if (inventoryItem.quantity < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`,
            );
          }

          
          await this.inventoryItemModel
            .findByIdAndUpdate(
              item.itemId,
              {
                $inc: { quantity: -item.quantity },
                lastUpdated: new Date(),
              },
              { session },
            )
            .exec();
        } else {
          
          await this.inventoryItemModel
            .findByIdAndUpdate(
              item.itemId,
              {
                $inc: { quantity: item.quantity },
                lastUpdated: new Date(),
              },
              { session },
            )
            .exec();
        }

        
        orderItems.push({
          itemId: inventoryItem._id,
          name: inventoryItem.name,
          quantity: item.quantity,
          unit: inventoryItem.unit,
        });
      }

      
      const newOrder = new this.orderModel({
        type: createDto.type,
        status: OrderStatus.COMPLETED,
        items: orderItems,
        notes: createDto.notes,
        createdBy: userId,
        createdAt: new Date(),
      });

      const savedOrder = await newOrder.save({ session });

      
      await session.commitTransaction();

      return savedOrder;
    } catch (error) {
      
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findAll(
    type?: OrderType,
    status?: OrderStatus,
    userId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Order[]> {
    const query: any = {};

    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.createdBy = userId;
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

    return this.orderModel
      .find(query)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('createdBy', 'name username')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateDto: UpdateOrderDto): Promise<Order> {
    const updated = await this.orderModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return updated;
  }

  async getHistoricalUsage(
    itemId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    return this.orderModel.aggregate([
      {
        $match: {
          type: OrderType.OUTGOING,
          status: OrderStatus.COMPLETED,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.itemId': itemId,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          totalUsage: { $sum: '$items.quantity' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);
  }
}
