import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from '../inventory/inventory.service';
import { AlertsService } from '../alerts/alerts.service';
import { AlertType } from '../alerts/schema/alert.schema';

@Injectable()
export class ReorderAlertService {
  private readonly logger = new Logger(ReorderAlertService.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly alertsService: AlertsService,
  ) {}

  
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runReorderAlerts() {
    this.logger.log('Starting smart reorder alert job...');

    try {
      
      await this.checkManualThresholds();

      
      await this.checkForecastBasedAlerts();

      this.logger.log('Smart reorder alert job completed');
    } catch (error) {
      this.logger.error(`Reorder alert job failed: ${error.message}`);
    }
  }

  private async checkManualThresholds() {
    const lowStockItems = await this.inventoryService.findLowStock();

    for (const item of lowStockItems) {
      const message = `Stock for '${item.name}' is low. Current: ${item.quantity}, Threshold: ${item.reorderThreshold}.`;
      
      await this.alertsService.create(
        item._id.toString(),
        item.name,
        message,
        AlertType.MANUAL_THRESHOLD,
      );

      this.logger.log(`Created manual threshold alert for: ${item.name}`);
    }
  }

  private async checkForecastBasedAlerts() {
    const forecastLowStock = await this.inventoryService.findForecastBasedLowStock();

    for (const item of forecastLowStock) {
      const predictedStock = item.quantity - (item.forecast?.predictedUsage || 0);
      const message = `AI predicts stock shortage for '${item.name}'. Current: ${item.quantity}, Predicted usage: ${item.forecast?.predictedUsage || 0}, Expected remaining: ${predictedStock}.`;
      
      await this.alertsService.create(
        item._id.toString(),
        item.name,
        message,
        AlertType.FORECAST_BASED,
      );

      this.logger.log(`Created forecast-based alert for: ${item.name}`);
    }
  }

  
  async triggerReorderAlerts() {
    return this.runReorderAlerts();
  }
}
