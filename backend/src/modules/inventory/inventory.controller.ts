import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { Roles } from '@guards/roles.decorator';
import { UserRole } from '../core/users/schema/user.schema';
import ParseObjectIdPipe from '@pipes/parseObjectId.pipe';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new inventory item (Admin only)' })
  @ApiResponse({ status: 201, description: 'Item created successfully' })
  async create(@Body() createDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll(category, search);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items below reorder threshold' })
  @ApiResponse({ status: 200, description: 'List of low stock items' })
  async getLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item found' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an inventory item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Item updated successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an inventory item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.inventoryService.delete(id);
    return { message: 'Item deleted successfully' };
  }
}
