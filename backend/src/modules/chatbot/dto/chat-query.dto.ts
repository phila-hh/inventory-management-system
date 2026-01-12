import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChatQueryDto {
  @ApiProperty({ example: 'stock level for 10mm Wrench' })
  @IsString()
  @MinLength(3)
  query: string;
}
