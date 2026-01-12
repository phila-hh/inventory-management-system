import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertStatus } from './schema/alert.schema';
import ParseObjectIdPipe from '@pipes/parseObjectId.pipe';
import { ReorderAlertService } from '../jobs/reorder-alert.service';
import { ForecastingService } from '../jobs/forecasting.service';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly reorderAlertService: ReorderAlertService,
    private readonly forecastingService: ForecastingService,
  ) {}

  @Get('count')
  @ApiOperation({ summary: 'Get count of active alerts' })
  @ApiResponse({ status: 200, description: 'Number of active alerts' })
  async getActiveCount() {
    const count = await this.alertsService.getActiveAlertsCount();
    return { count };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread (new) alerts' })
  @ApiResponse({ status: 200, description: 'Number of unread alerts' })
  async getUnreadCount() {
    const count = await this.alertsService.getActiveAlertsCount();
    return { count };
  }

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async findAll(
    @Query('status') status?: AlertStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.alertsService.findAll(status, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert found' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an alert as read' })
  @ApiResponse({ status: 200, description: 'Alert marked as read' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async markAsRead(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.dismiss(id);
  }

  @Put(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiResponse({ status: 200, description: 'Alert dismissed successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async dismiss(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.dismiss(id);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert (PATCH)' })
  @ApiResponse({ status: 200, description: 'Alert dismissed successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async dismissPatch(@Param('id', ParseObjectIdPipe) id: string) {
    return this.alertsService.dismiss(id);
  }

  @Post('trigger/forecasting')
  @ApiOperation({ summary: 'Manually trigger AI forecasting job' })
  @ApiResponse({ status: 200, description: 'Forecasting job triggered successfully' })
  async triggerForecasting() {
    await this.forecastingService.runDemandForecasting();
    return { message: 'Forecasting job completed successfully' };
  }

  @Post('trigger/reorder-alerts')
  @ApiOperation({ summary: 'Manually trigger reorder alerts job' })
  @ApiResponse({ status: 200, description: 'Reorder alerts job triggered successfully' })
  async triggerReorderAlerts() {
    await this.reorderAlertService.runReorderAlerts();
    return { message: 'Reorder alerts job completed successfully' };
  }
}
