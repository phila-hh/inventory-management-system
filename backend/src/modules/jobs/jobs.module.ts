import { Module, forwardRef } from '@nestjs/common';
import { ForecastingService } from './forecasting.service';
import { ReorderAlertService } from './reorder-alert.service';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [InventoryModule, OrdersModule, forwardRef(() => AlertsModule)],
  providers: [ForecastingService, ReorderAlertService],
  exports: [ForecastingService, ReorderAlertService],
})
export class JobsModule {}
