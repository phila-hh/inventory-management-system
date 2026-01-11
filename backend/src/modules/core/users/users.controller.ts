import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import JwtAuthGuard from '@guards/jwtAuth.guard';
import ParseObjectIdPipe from '@pipes/parseObjectId.pipe';
import UsersService from './users.service';
import { User, UserRole } from './schema/user.schema';
import * as mongoose from 'mongoose';
import CreateUserDto from './dto/createUser.dto';
import { FilterService } from '@filters/filter.service';
import { Roles } from '@guards/roles.decorator';
import UpdateUserDto from './dto/updateUser.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export default class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filterService: FilterService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: User,
    description:
      '201. Created. Successfully creates a new user and returns the user details.',
  })
  @ApiBadRequestResponse({
    description:
      '400. BadRequestException. Validation failed or invalid input.',
  })
  @ApiUnauthorizedResponse({
    description: '401. UnauthorizedException. User is not authorized.',
  })
  async create(
    @Req() req: any,
    @Body() createUserDto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @ApiOkResponse({
    type: User,
    description: '200. Success. Returns a user',
  })
  @ApiNotFoundResponse({
    description: '404. NotFoundException. User was not found',
  })
  @ApiUnauthorizedResponse({
    description: '401. UnauthorizedException.',
  })
  @Get(':id')
  async getById(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<User | never> {
    const foundUser = await this.usersService.getById(
      new mongoose.Schema.Types.ObjectId(id),
    );
    if (!foundUser) {
      throw new NotFoundException('The user does not exist');
    }
    return foundUser;
  }

  @ApiOkResponse({
    type: [User],
    description: '200. Success. Returns all users',
  })
  @ApiUnauthorizedResponse({
    description: '401. UnauthorizedException.',
  })
  @Get()
  getAllUsers(@Query() qs: any) {
    const foundUsers = this.usersService.getAll();
    this.filterService.initialize(foundUsers, qs);

    this.filterService.filter().sort().limitFields().paginate();
    return this.filterService.getResults();
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: User,
    description: '200. Success. Updates a user.',
  })
  @ApiNotFoundResponse({
    description: '404. NotFoundException. User not found.',
  })
  @ApiUnauthorizedResponse({ description: '401. UnauthorizedException.' })
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: '204. Success. Deletes a User.',
  })
  @ApiNotFoundResponse({
    description: '404. NotFoundException. User was not found.',
  })
  @ApiUnauthorizedResponse({
    description: '401. UnauthorizedException.',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @ApiOkResponse({
    type: [User],
    description: '200. Success. Returns users based on their role',
  })
  @ApiUnauthorizedResponse({
    description: '401. UnauthorizedException.',
  })
  @Get('role/:role')
  async getUsersByRole(
    @Param('role') role: UserRole,
  ): Promise<User[]> {
    return this.usersService.getUsersByRole(role);
  }
}
