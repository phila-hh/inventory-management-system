import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsPhoneNumber,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schema/user.schema';

export default class CreateUserDto {
  @ApiProperty({
    type: String,
    description: 'Full name of the user',
  })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({
    type: String,
    description: 'Unique username',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  readonly username: string;

  @ApiProperty({
    type: String,
    description: 'Password with a minimum length of 6',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  readonly password: string;

  @ApiProperty({
    type: String,
    description: 'Unique phone number of the user',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('ET')
  readonly phoneNumber?: string;

  @ApiProperty({
    type: String,
    enum: UserRole,
    description: 'Role of the user in the system',
  })
  @IsOptional()
  @IsMongoId()
  readonly specialization?: string;

  @ApiProperty({
    type: String,
    description: 'List of specialties',
  })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({
    type: String,
    enum: UserRole,
    description: 'Role of the user in the system',
  })
  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;
}
