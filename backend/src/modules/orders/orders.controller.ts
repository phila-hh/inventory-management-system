import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderType, OrderStatus } from './schema/order.schema';
import ParseObjectIdPipe from '@pipes/parseObjectId.pipe';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order (incoming or outgoing)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid data' })
  async create(@Body() createDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createDto, req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get order history (completed orders)' })
  @ApiResponse({ status: 200, description: 'Order history' })
  async getHistory() {
    return this.ordersService.findAll(undefined, OrderStatus.COMPLETED);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with optional filters' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAll(
    @Query('type') type?: OrderType,
    @Query('status') status?: OrderStatus,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAll(type, status, userId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ordersService.update(id, { status: OrderStatus.CANCELLED });
  }
}
