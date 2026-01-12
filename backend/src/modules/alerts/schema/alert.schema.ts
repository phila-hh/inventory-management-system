import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AlertDocument = HydratedDocument<Alert>;

export enum AlertStatus {
  NEW = 'new',
  DISMISSED = 'dismissed',
}

export enum AlertType {
  MANUAL_THRESHOLD = 'manual_threshold',
  FORECAST_BASED = 'forecast_based',
}

@Schema({ timestamps: true, id: true })
export class Alert extends mongoose.Document {
  @ApiProperty({ description: 'Reference to the inventory item' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true })
  itemId: mongoose.Types.ObjectId;

  @ApiProperty({ description: 'Snapshot of item name for easy display' })
  @Prop({ required: true, trim: true })
  itemName: string;

  @ApiProperty({ type: String })
  @Prop({ required: true })
  message: string;

  @ApiProperty({ type: String, enum: AlertStatus })
  @Prop({
    type: String,
    enum: Object.values(AlertStatus),
    required: true,
    default: AlertStatus.NEW,
  })
  status: AlertStatus;

  @ApiProperty({ type: String, enum: AlertType })
  @Prop({
    type: String,
    enum: Object.values(AlertType),
    required: true,
  })
  type: AlertType;

  @ApiProperty({ type: Date })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);


AlertSchema.index({ itemId: 1, status: 1 });
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ type: 1 });
