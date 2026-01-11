import { ObjectId } from 'mongoose';

export interface IJwtStrategyValidate {
  id: ObjectId;
  username: string;
  role: string;
}
