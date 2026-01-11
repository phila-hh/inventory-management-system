
import 'module-alias/register';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import AppModule from './modules/app/app.module';
import AllExceptionsFilter from './filters/allExceptions.filter';
import mongoose from 'mongoose';

// Added the following two lines to solve the error that shows
// on Node.js version 18 when running inside a docker container
import { webcrypto } from 'crypto';
(globalThis as any).crypto = webcrypto;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());


  const port = process.env.PORT || process.env.SERVER_PORT || 3000;

  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
  }


  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  const options = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Nest.js Boilerplate API with JWT Authentication')
    .setVersion('1.0')
    .addBearerAuth({ in: 'header', type: 'http' })
    .build();
  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api', app, document);

  await app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📡 WebSocket server is running on ws://localhost:${port}`);
    console.log(`📖 API Documentation: http://localhost:${port}/api`);
  });
}
bootstrap();
