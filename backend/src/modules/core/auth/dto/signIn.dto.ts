import { ApiProperty } from '@nestjs/swagger';

export default class SignInDto {
  @ApiProperty({ type: String })
  readonly username: string;

  @ApiProperty({ type: String })
  readonly password: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ type: String })
  readonly oldPassword: string;

  @ApiProperty({ type: String })
  readonly newPassword: string;
}
