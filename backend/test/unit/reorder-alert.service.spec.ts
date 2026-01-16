import { Test, TestingModule } from '@nestjs/testing';
import { ReorderAlertService } from '../../src/modules/jobs/reorder-alert.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { AlertsService } from '../../src/modules/alerts/alerts.service';
import { AlertType } from '../../src/modules/alerts/schema/alert.schema';

describe('ReorderAlertService', () => {
  let service: ReorderAlertService;
  let inventoryService: jest.Mocked<InventoryService>;
  let alertsService: jest.Mocked<AlertsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReorderAlertService,
        {
          provide: InventoryService,
          useValue: {
            findLowStock: jest.fn(),
            findForecastBasedLowStock: jest.fn(),
          },
        },
        {
          provide: AlertsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReorderAlertService>(ReorderAlertService);
    inventoryService = module.get(InventoryService);
    alertsService = module.get(AlertsService);
  });

  describe('runReorderAlerts', () => {
    it('should check both manual and forecast-based thresholds', async () => {
      inventoryService.findLowStock.mockResolvedValue([]);
      inventoryService.findForecastBasedLowStock.mockResolvedValue([]);

      await service.runReorderAlerts();

      expect(inventoryService.findLowStock).toHaveBeenCalled();
      expect(inventoryService.findForecastBasedLowStock).toHaveBeenCalled();
    });

    it('should create alerts for manual low stock items', async () => {
      const mockItem = {
        _id: 'item1',
        name: 'Wrench',
        quantity: 2,
        reorderThreshold: 5,
      };

      inventoryService.findLowStock.mockResolvedValue([mockItem as any]);
      inventoryService.findForecastBasedLowStock.mockResolvedValue([]);

      await service.runReorderAlerts();

      expect(alertsService.create).toHaveBeenCalledWith(
        'item1',
        'Wrench',
        expect.stringContaining('Stock for \'Wrench\' is low'),
        AlertType.MANUAL_THRESHOLD,
      );
    });

    it('should create alerts for forecast-based low stock items', async () => {
      const mockItem = {
        _id: 'item2',
        name: 'Fast Mover',
        quantity: 20,
        forecast: { predictedUsage: 18 }, // Remaining: 2
        reorderThreshold: 5, // 2 < 5 -> Alert
      };

      inventoryService.findLowStock.mockResolvedValue([]);
      inventoryService.findForecastBasedLowStock.mockResolvedValue([mockItem as any]);

      await service.runReorderAlerts();

      expect(alertsService.create).toHaveBeenCalledWith(
        'item2',
        'Fast Mover',
        expect.stringContaining('AI predicts stock shortage'),
        AlertType.FORECAST_BASED,
      );
    });
  });
});
