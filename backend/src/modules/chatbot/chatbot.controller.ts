import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChatbotService } from './chatbot.service';
import { ChatQueryDto } from './dto/chat-query.dto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('query')
  @ApiOperation({ summary: 'Ask the chatbot a question about inventory' })
  @ApiResponse({ status: 200, description: 'Chatbot response' })
  async query(@Body() queryDto: ChatQueryDto) {
    const response = await this.chatbotService.processQuery(queryDto.query);
    return { query: queryDto.query, response };
  }
}
