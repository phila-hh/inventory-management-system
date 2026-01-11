import {
  Body,
  Controller,
  HttpCode,
  Post,
  NotFoundException,
  UseGuards,
  ForbiddenException,
  Req,
  Get,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import UsersService from 'src/modules/core/users/users.service';
import { User } from 'src/modules/core/users/schema/user.schema';

import OkResponseDto from '@dto/okResponse.dto';
import AuthService from './auth.service';
import SignInDto, { UpdatePasswordDto } from './dto/signIn.dto';
import SignUpDto from './dto/signUp.dto';
import JwtAuthGuard from '@guards/jwtAuth.guard';
import { Public } from '@guards/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export default class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiBody({ type: SignInDto })
  @ApiOkResponse({ description: 'Returns jwt tokens' })
  @ApiInternalServerErrorResponse({ description: '500. InternalServerError' })
  @ApiBearerAuth()
  @HttpCode(200)
  @Post('sign-in')
  @Public()
  async signIn(@Body() user: SignInDto) {
    const foundUser: User = await this.usersService.getByUsername(
      user.username,
    );

    if (!foundUser) {
      throw new NotFoundException('The user does not exist');
    }

    if (!foundUser.canLogin) {
      throw new ForbiddenException('The user is not allowed to log in');
    }

    return this.authService.login(foundUser, user.password);
  }

  @ApiOkResponse({ description: 'Returns the current timestamp' })
  @ApiInternalServerErrorResponse({ description: '500. InternalServerError' })
  @Get('time')
  @Public()
  async getCurrentTimestamp(): Promise<number> {
    return Date.now();
  }

  @ApiBody({ type: SignUpDto })
  @ApiOkResponse({ description: '200, Success' })
  @ApiInternalServerErrorResponse({ description: '500. InternalServerError' })
  @Post('sign-up')
  @Public()
  async signUp(@Body() user: SignUpDto): Promise<OkResponseDto> {
    await this.usersService.create(user);

    return {
      message: 'The item was created successfully',
    };
  }

  @ApiOkResponse({ description: '200, Success' })
  @ApiInternalServerErrorResponse({ description: '500. InternalServerError' })
  @ApiBearerAuth()
  @Get('check-token')
  @UseGuards(JwtAuthGuard)
  async checkToken(@Req() req: any): Promise<User> {
    if (req.user) {
      return this.authService.checkToken(req.user);
    } else {
      throw new UnauthorizedException();
    }
  }

  @ApiBody({ type: UpdatePasswordDto })
  @ApiOkResponse({ description: '200, Success' })
  @ApiInternalServerErrorResponse({ description: '500. InternalServerError' })
  @ApiBearerAuth()
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req: any,
  ): Promise<OkResponseDto> {
    const user: User = req.user;
    const { oldPassword, newPassword } = updatePasswordDto;
    const userDoc = await this.usersService.getById(user.id);

    if (
      !(await this.authService.comparePassword(oldPassword, userDoc.password))
    ) {
      throw new UnauthorizedException('The old password is incorrect');
    }

    user.password = newPassword;
    await this.usersService.update(
      user.id,
      { password: newPassword },
    );

    return { message: 'The password was updated successfully' };
  }
}
