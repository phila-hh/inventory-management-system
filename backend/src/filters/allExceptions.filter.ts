import {
  HttpStatus,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export default class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const mongodbErrorMapping: Record<
      number,
      {
        status: number;
        message: string;
        sanitizor?: (message: string) => string;
      }
    > = {
      11000: {
        
        status: HttpStatus.CONFLICT,
        message:
          'Duplicate entry detected. A record with this unique value already exists.',
        sanitizor: sanitizeMongoDBErrorMessage,
      },
      121: {
        
        status: HttpStatus.BAD_REQUEST,
        message: 'Document failed validation against the schema.',
      },
      
    };

	
	if (exception.code && mongodbErrorMapping[exception.code]) {
	  const errorConfig = mongodbErrorMapping[exception.code];
	  const message = errorConfig.sanitizor
		? errorConfig.sanitizor(exception.message)
		: errorConfig.message;
	  return res.status(errorConfig.status).json({
		statusCode: errorConfig.status,
		message: message,
		detail: exception.message,
    stack: exception.stack
	  });
	}

    
    if (exception.name === 'ValidationError') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation error occurred.',
        errors: exception.errors,
        detail: exception.message,
        stack: exception.stack
      });
    }

    
    if (exception.name === 'CastError') {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Data type casting failed. Check provided fields.',
        field: exception.path,
        value: exception.value,
        stack: exception.stack,

      });
    }

    if (
      exception instanceof NotFoundException ||
      exception instanceof ForbiddenException ||
      exception instanceof UnauthorizedException ||
      exception instanceof BadRequestException ||
      exception instanceof ConflictException ||
      exception.code === 'ValidationException'
    ) {
      return res.status(exception.getStatus()).json(exception.response);
    }
    return res.status(500).json({
      statusCode: 500,
      message: 'InternalServerError',
      error: exception.message,
      stack: exception.stack, 
      exception: exception,  
    });
  }
}

function sanitizeMongoDBErrorMessage(errorMessage: string): string {
  
  const regex = /dup key:\s*{\s*(\w+):\s*["']([^"']+)["']\s*}/;
  const match = errorMessage.match(regex);

  if (match && match[1] && match[2]) {
    const field = match[1];
    const value = match[2];
    return `The ${field} "${value}" is already registered. Please use a different ${field}.`;
  } else {
    return 'Duplicate entry detected. Please check your input and try again.';
  }
}
