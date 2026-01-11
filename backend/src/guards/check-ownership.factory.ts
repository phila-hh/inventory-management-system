import { CheckOwnershipGuard } from './check-ownership.guard';
import { Model } from 'mongoose';

export function createCheckOwnershipGuard(model: Model<any>, ownershipField: string = 'hospital', routeIdField: string = 'id') {
  return new CheckOwnershipGuard(model, ownershipField, routeIdField);
}
