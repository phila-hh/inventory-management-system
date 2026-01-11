import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtConstants from 'src/modules/core/auth/constants';

import { IAuthLoginOutput } from 'src/modules/core/auth/interfaces/IAuthLoginOutput.interface';

import UsersService from 'src/modules/core/users/users.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/modules/core/users/schema/user.schema';

@Injectable()
export default class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async login(user: User, password: string): Promise<IAuthLoginOutput> {
    const passwordCompared = await bcrypt.compare(password, user.password);

    if (!passwordCompared) {
      throw new BadRequestException('Username or Password is incorrect');
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.accessTokenExpirationTime as any,
    });

    return {
      accessToken,
    };
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async checkToken(user: any): Promise<User> {
    const userDocument: User = await this.userModel
      .findById(user.id)
      .select('-password');

    if (!userDocument) {
      throw new NotFoundException('The user does not exist');
    }

    return userDocument;
  }
}
