import { ObjectId } from 'mongoose';

export interface IAuthValidateUserOutput {
  id: ObjectId;
  username?: string;
  role?: string;
}
