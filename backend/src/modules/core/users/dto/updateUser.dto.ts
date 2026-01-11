import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import CreateUserDto from './createUser.dto';

export default class UpdateUserDto extends PartialType(CreateUserDto) {
    department?: string;
}
