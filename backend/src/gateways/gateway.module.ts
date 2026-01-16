import { Module } from '@nestjs/common';
import { InventoryGateway } from './ems.gateway';

@Module({
  providers: [InventoryGateway],
  exports: [InventoryGateway],
})
export class GatewayModule {}
