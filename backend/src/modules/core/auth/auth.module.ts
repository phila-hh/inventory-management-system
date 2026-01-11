import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import UsersModule from 'src/modules/core/users/users.module';
import JwtStrategy from './strategies/jwt.strategy';
import jwtConstants from './constants';

import AuthController from './auth.controller';
import AuthService from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/modules/core/users/schema/user.schema';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export default class AuthModule {}
