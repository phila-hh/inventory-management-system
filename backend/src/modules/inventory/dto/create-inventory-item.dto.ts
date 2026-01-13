import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ItemUnit } from '../schema/inventory-item.schema';

export class CreateInventoryItemDto {
  @ApiProperty({ example: '10mm Wrench' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Standard 10mm combination wrench', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 'Tools',
    description: 'Category name (can be from Categories collection or any string)'
  })
  @IsString()
  category: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ enum: ItemUnit, example: ItemUnit.PCS })
  @IsEnum(ItemUnit)
  unit: ItemUnit;

  @ApiProperty({ example: 5, description: 'Manual reorder threshold' })
  @IsNumber()
  @Min(0)
  reorderThreshold: number;
}
