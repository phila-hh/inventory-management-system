import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { FilterModule } from '@filters/filter.module';
import { RolesGuard } from '@guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import JwtAuthGuard from '@guards/jwtAuth.guard';
import { CoreModule } from 'src/modules/core/core.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { InventoryModule } from 'src/modules/inventory/inventory.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { AlertsModule } from 'src/modules/alerts/alerts.module';
import { ChatbotModule } from 'src/modules/chatbot/chatbot.module';
import { JobsModule } from 'src/modules/jobs/jobs.module';
import { GatewayModule } from 'src/gateways/gateway.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

// Select the URI based on the environment
const getDatabaseUri = () => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/inventory_test_db';
  }
  return process.env.MONGODB_URI;
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(getDatabaseUri()),
    ScheduleModule.forRoot(),
    CoreModule,
    CategoriesModule,
    InventoryModule,
    OrdersModule,
    AlertsModule,
    ChatbotModule,
    JobsModule,
    GatewayModule,
    FilterModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export default class AppModule {}
