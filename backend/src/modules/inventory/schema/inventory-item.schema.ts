import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type InventoryItemDocument = HydratedDocument<InventoryItem>;


export enum ItemCategory {
  TOOLS = 'Tools',
  MATERIALS = 'Materials',
  CONSUMABLES = 'Consumables',
}

export enum ItemUnit {
  PCS = 'pcs',
  BOX = 'box',
  KG = 'kg',
  LITERS = 'liters',
  METERS = 'meters',
}

@Schema({ _id: false })
export class Forecast {
  @ApiProperty({ description: 'AI predicted usage for the item', required: false })
  @Prop({ default: 0 })
  predictedUsage: number;

  @ApiProperty({ description: 'Date when the forecast was last updated', required: false })
  @Prop({ type: Date })
  forecastDate?: Date;
}

const ForecastSchema = SchemaFactory.createForClass(Forecast);

@Schema({ timestamps: true, id: true })
export class InventoryItem extends mongoose.Document {
  @ApiProperty({ type: String })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ type: String })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({ 
    type: String, 
    description: 'Category name (can reference Categories collection or use enum)',
    example: 'Tools'
  })
  @Prop({
    type: String,
    required: true,
  })
  category: string;

  @ApiProperty({ type: Number })
  @Prop({ required: true, min: 0, default: 0 })
  quantity: number;

  @ApiProperty({ type: String, enum: ItemUnit })
  @Prop({
    type: String,
    enum: Object.values(ItemUnit),
    required: true,
    default: ItemUnit.PCS,
  })
  unit: ItemUnit;

  @ApiProperty({ type: Number, description: 'Manual reorder threshold' })
  @Prop({ required: true, min: 0, default: 5 })
  reorderThreshold: number;

  @ApiProperty({ type: Date })
  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;

  @ApiProperty({ type: Forecast, required: false })
  @Prop({ type: ForecastSchema, default: () => ({}) })
  forecast?: Forecast;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);


InventoryItemSchema.index({ name: 1 });
InventoryItemSchema.index({ category: 1 });
