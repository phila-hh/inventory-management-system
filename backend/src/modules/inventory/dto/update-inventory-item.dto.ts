import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ItemUnit } from '../schema/inventory-item.schema';

export class UpdateInventoryItemDto {
  @ApiProperty({ example: '10mm Wrench', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Standard 10mm combination wrench', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 'Tools',
    description: 'Category name (can be from Categories collection or any string)',
    required: false 
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 15, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ enum: ItemUnit, required: false })
  @IsEnum(ItemUnit)
  @IsOptional()
  unit?: ItemUnit;

  @ApiProperty({ example: 5, description: 'Manual reorder threshold', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderThreshold?: number;
}
