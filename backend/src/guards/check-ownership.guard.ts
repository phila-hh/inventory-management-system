import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class CheckOwnershipGuard implements CanActivate {
  constructor(
    private readonly model: Model<any>, 
    private readonly ownershipField: string = 'hospital',
    private readonly routeIdField: string = 'id',
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { params, user } = request;

    
    const query: Record<string, any> = {};
    query[this.routeIdField === 'id' ? '_id' : this.routeIdField] = params[this.routeIdField];

    
    const item = await this.model.findOne(query);
    if (!item) {
      throw new NotFoundException('No record found for given details');
    }

    
    if (item[this.ownershipField].toString() !== user.hospital.toString()) {
      throw new ForbiddenException('Unable to perform requested operation!');
    }

    
    request.itemRow = item;
    return true;
  }
}
