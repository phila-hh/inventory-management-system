import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from '../inventory/inventory.service';
import { OrdersService } from '../orders/orders.service';
import axios from 'axios';

@Injectable()
export class ForecastingService {
  private readonly logger = new Logger(ForecastingService.name);
  private aiEnabled: boolean = false;
  private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly MODEL = 'deepseek/deepseek-chat';
  private apiKey: string;

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly ordersService: OrdersService,
  ) {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    if (this.apiKey) {
      this.aiEnabled = true;
      this.logger.log('✅ OpenRouter AI initialized for forecasting with DeepSeek model');
    } else {
      this.logger.warn('⚠️  OPENROUTER_API_KEY not set, using fallback forecasting');
    }
  }


  @Cron(CronExpression.EVERY_DAY_AT_1AM)

// To (runs every 5 minutes):
// @Cron('*/5 * * * *')
  async runDemandForecasting() {
    this.logger.log('Starting AI demand forecasting job...');

    try {
      const allItems = await this.inventoryService.findAll();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const today = new Date();

      for (const item of allItems) {
        try {

          const historicalData = await this.ordersService.getHistoricalUsage(
            item._id.toString(),
            sixMonthsAgo,
            today,
          );

          if (historicalData.length === 0) {
            this.logger.warn(`No historical data for item: ${item.name}`);
            continue;
          }


          const response = await this.callAIForecastAPI({
            itemId: item._id.toString(),
            itemName: item.name,
            historicalData,
          });


          await this.inventoryService.updateForecast(
            item._id.toString(),
            response.predictedUsage,
          );

          this.logger.log(
            `Updated forecast for ${item.name}: ${response.predictedUsage}`,
          );
        } catch (error) {
          this.logger.error(
            `Error forecasting for item ${item.name}: ${error.message}`,
          );
        }
      }

      this.logger.log('AI demand forecasting job completed');
    } catch (error) {
      this.logger.error(`Forecasting job failed: ${error.message}`);
    }
  }

  private async callAIForecastAPI(data: any): Promise<{ predictedUsage: number }> {

    if (this.aiEnabled) {
      try {
        return await this.forecastWithAI(data);
      } catch (error) {
        this.logger.error(`OpenRouter AI forecasting failed: ${error.message}`);
        return this.fallbackForecast(data);
      }
    }

    return this.fallbackForecast(data);
  }

  private async forecastWithAI(data: any): Promise<{ predictedUsage: number }> {
    const systemPrompt = `You are an inventory forecasting AI. Analyze historical usage data and predict future usage. Return ONLY a JSON object with format: {"predictedUsage": number}`;

    const userPrompt = `Item: ${data.itemName}\nHistorical Daily Usage (last 6 months):\n${JSON.stringify(data.historicalData, null, 2)}\n\nTask: Predict the usage for the next period based on trends, patterns, and seasonality.\n\nImportant:\n- Consider trends (increasing/decreasing usage)\n- Consider day of week patterns\n- Consider seasonal patterns\n- Be conservative but realistic\n- Round to whole numbers\n\nReturn JSON with predictedUsage field.`;

    const response = await axios.post(
      this.OPENROUTER_API_URL,
      {
        model: this.MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data.choices[0].message.content;


    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.predictedUsage && typeof parsed.predictedUsage === 'number') {
        this.logger.log(`AI forecast for ${data.itemName}: ${parsed.predictedUsage}`);
        return { predictedUsage: Math.ceil(parsed.predictedUsage) };
      }
    }

    throw new Error('Invalid response format from AI');
  }

  private fallbackForecast(data: any): { predictedUsage: number } {
    this.logger.warn(`Using fallback forecast for ${data.itemName}`);

    const totalUsage = data.historicalData.reduce(
      (sum: number, day: any) => sum + day.totalUsage,
      0,
    );
    const averageUsage = Math.ceil(totalUsage / data.historicalData.length);

    return { predictedUsage: averageUsage };
  }


  async triggerForecasting() {
    return this.runDemandForecasting();
  }
}
