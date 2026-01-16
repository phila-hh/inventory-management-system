import { Test, TestingModule } from '@nestjs/testing';
import { ForecastingService } from '../../src/modules/jobs/forecasting.service';
import { InventoryService } from '../../src/modules/inventory/inventory.service';
import { OrdersService } from '../../src/modules/orders/orders.service';
import axios from 'axios';

// Mock axios to prevent real API calls
jest.mock('axios');

describe('ForecastingService', () => {
  let service: ForecastingService;
  let inventoryService: jest.Mocked<InventoryService>;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastingService,
        {
          provide: InventoryService,
          useValue: {
            findAll: jest.fn(),
            updateForecast: jest.fn(),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            getHistoricalUsage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ForecastingService>(ForecastingService);
    inventoryService = module.get(InventoryService);
    ordersService = module.get(OrdersService);
  });

  describe('runDemandForecasting', () => {
    it('should skip items with no historical data', async () => {
      // Setup: 1 item found, but no history
      inventoryService.findAll.mockResolvedValue([{
        _id: 'item1',
        name: 'New Item'
      } as any]);

      ordersService.getHistoricalUsage.mockResolvedValue([]); // Empty history

      await service.runDemandForecasting();

      // Expectation: No forecast update should happen
      expect(inventoryService.updateForecast).not.toHaveBeenCalled();
    });

    it('should use fallback forecast (average) when AI is disabled/fails', async () => {
      // Setup: 1 item found
      const mockItem = { _id: 'item1', name: 'Hammer' };
      inventoryService.findAll.mockResolvedValue([mockItem as any]);

      // Setup: History with 3 days of usage (Total: 30, Avg: 10)
      const mockHistory = [
        { totalUsage: 5 },
        { totalUsage: 10 },
        { totalUsage: 15 },
      ];
      ordersService.getHistoricalUsage.mockResolvedValue(mockHistory);

      // Execute
      await service.runDemandForecasting();

      // Expectation:
      // Total = 30, Count = 3, Avg = 10.
      // Should call updateForecast(id, 10)
      expect(inventoryService.updateForecast).toHaveBeenCalledWith(
        'item1',
        10
      );
    });

    it('should handle errors gracefully during iteration', async () => {
      // Setup: 2 items
      inventoryService.findAll.mockResolvedValue([
        { _id: 'item1', name: 'Bad Item' },
        { _id: 'item2', name: 'Good Item' },
      ] as any);

      // Item 1 throws error
      ordersService.getHistoricalUsage.mockRejectedValueOnce(new Error('DB Error'));
      // Item 2 returns valid history (Avg: 5)
      ordersService.getHistoricalUsage.mockResolvedValueOnce([{ totalUsage: 5 }]);

      await service.runDemandForecasting();

      // Should have skipped item 1 and processed item 2
      expect(inventoryService.updateForecast).toHaveBeenCalledTimes(1);
      expect(inventoryService.updateForecast).toHaveBeenCalledWith('item2', 5);
    });
  });
});
