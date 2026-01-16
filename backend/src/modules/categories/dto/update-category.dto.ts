import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Tools', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Hand tools and power tools', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '🔧', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
