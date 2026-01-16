import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true, id: true })
export class Category extends mongoose.Document {
  @ApiProperty({ type: String })
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @ApiProperty({ type: String })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({ type: String })
  @Prop({ trim: true })
  icon?: string;

  @ApiProperty({ type: Boolean })
  @Prop({ default: true })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);


// CategorySchema.index({ name: 1 });
