import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Tools' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Hand tools and power tools', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '🔧', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
