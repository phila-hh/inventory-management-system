import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import { User } from 'src/modules/core/users/schema/user.schema';
import jwtConstants from '../constants';

import { IJwtStrategyValidate } from '../interfaces/IJwtStrategyValidate.interface';
import { ApiPayloadTooLargeResponse } from '@nestjs/swagger';

@Injectable()
export default class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }


  async validate(payload: User): Promise<IJwtStrategyValidate> {
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  }
}
