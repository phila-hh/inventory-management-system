import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsOptional, ValidateNested, IsMongoId, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../schema/order.schema';

export class OrderItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'Inventory item ID' })
  @IsMongoId()
  itemId: string;

  @ApiProperty({ example: 2, description: 'Quantity to order/use' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, example: OrderType.OUTGOING })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'Used for client vehicle repair', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
