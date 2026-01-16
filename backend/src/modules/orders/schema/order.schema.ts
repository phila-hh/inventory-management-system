import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderType {
  INCOMING = 'incoming', 
  OUTGOING = 'outgoing', 
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class OrderItem {
  @ApiProperty({ description: 'Reference to the inventory item' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true })
  itemId: mongoose.Types.ObjectId;

  @ApiProperty({ description: 'Snapshot of item name at time of order' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ description: 'Quantity in this order' })
  @Prop({ required: true, min: 1 })
  quantity: number;

  @ApiProperty({ description: 'Snapshot of unit at time of order' })
  @Prop({ required: true })
  unit: string;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, id: true })
export class Order extends mongoose.Document {
  @ApiProperty({ type: String, enum: OrderType })
  @Prop({
    type: String,
    enum: Object.values(OrderType),
    required: true,
  })
  type: OrderType;

  @ApiProperty({ type: String, enum: OrderStatus })
  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    required: true,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({ type: [OrderItem] })
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @ApiProperty({ type: String, required: false })
  @Prop({ trim: true })
  notes?: string;

  @ApiProperty({ description: 'Reference to the user who created this order' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongoose.Types.ObjectId;

  @ApiProperty({ type: Date })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);


OrderSchema.index({ type: 1, status: 1 });
OrderSchema.index({ createdBy: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'items.itemId': 1 });
