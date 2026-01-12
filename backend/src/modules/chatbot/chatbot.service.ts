import { Injectable, Logger } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { OrdersService } from '../orders/orders.service';
import axios from 'axios';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
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
      this.logger.log('✅ OpenRouter AI initialized with DeepSeek model');
    } else {
      this.logger.warn('⚠️  OPENROUTER_API_KEY not set, using fallback responses');
    }
  }

  async processQuery(query: string): Promise<string> {
    const normalizedQuery = query.toLowerCase().trim();

    
    if (this.aiEnabled) {
      return this.processWithGemini(query, normalizedQuery);
    }

    
    return this.processWithRules(normalizedQuery);
  }

  private async processWithGemini(originalQuery: string, normalizedQuery: string): Promise<string> {
    try {
      
      const context = await this.getInventoryContext(normalizedQuery);
      
      
      const systemPrompt = `You are an inventory management assistant. Answer questions based on the provided inventory data. Be concise and helpful.`;
      const userPrompt = `Question: ${originalQuery}\n\nInventory Context:\n${context}

Instructions:\n- Be concise and helpful\n- Use emojis when appropriate\n- Format numbers clearly\n- If asking about specific items, search the context data\n- If data is not in context, say you don't have that information\n\nAnswer:`;

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

      return response.data.choices[0].message.content;
      
    } catch (error) {
      this.logger.error(`OpenRouter API error: ${error.message}`);
      
      return this.processWithRules(normalizedQuery);
    }
  }

  private async getInventoryContext(query: string): Promise<string> {
    let context = '';

    try {
      // Get all items for context
      const items = await this.inventoryService.findAll();
      
      if (items.length > 0) {
        context += 'Current Inventory:\n';
        items.forEach(item => {
          context += `- ${item.name}: ${item.quantity} ${item.unit} (Category: ${item.category}, Threshold: ${item.reorderThreshold})`;
          if (item.forecast?.predictedUsage) {
            context += ` [AI Forecast: ${item.forecast.predictedUsage} ${item.unit}]`;
          }
          context += '\n';
        });
      }

      
      if (query.includes('low') || query.includes('shortage') || query.includes('reorder')) {
        const lowStock = await this.inventoryService.findLowStock();
        if (lowStock.length > 0) {
          context += '\nLow Stock Items:\n';
          lowStock.forEach(item => {
            context += `- ${item.name}: ${item.quantity} ${item.unit} (below threshold of ${item.reorderThreshold})\n`;
          });
        }
      }

      
      if (query.includes('order') || query.includes('usage') || query.includes('history')) {
        const orders = await this.ordersService.findAll();
        const recent = orders.slice(0, 5);
        if (recent.length > 0) {
          context += '\nRecent Orders:\n';
          recent.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            context += `- ${order.type} order: ${order.items.length} items on ${date}\n`;
          });
        }
      }

    } catch (error) {
      this.logger.error(`Error getting context: ${error.message}`);
    }

    return context || 'No inventory data available.';
  }

  private async processWithRules(normalizedQuery: string): Promise<string> {
    
    if (this.matchesPattern(normalizedQuery, ['stock', 'level', 'quantity', 'how many', 'available'])) {
      return this.handleStockLevelQuery(normalizedQuery);
    }

    
    if (this.matchesPattern(normalizedQuery, ['list', 'show', 'all items', 'inventory'])) {
      return this.handleListItemsQuery(normalizedQuery);
    }

    
    if (this.matchesPattern(normalizedQuery, ['low stock', 'running low', 'reorder', 'shortage'])) {
      return this.handleLowStockQuery();
    }

    
    if (this.matchesPattern(normalizedQuery, ['recent', 'order', 'usage', 'history'])) {
      return this.handleRecentOrdersQuery();
    }

    
    if (this.matchesPattern(normalizedQuery, ['tools', 'materials', 'consumables', 'category'])) {
      return this.handleCategoryQuery(normalizedQuery);
    }

    
    return 'I can help you with:\n' +
      '- Check stock levels (e.g., "stock level for 10mm Wrench")\n' +
      '- List inventory items (e.g., "show all tools")\n' +
      '- Check low stock items (e.g., "what items are running low?")\n' +
      '- View recent orders (e.g., "show recent orders")\n' +
      'Please rephrase your question.';
  }

  private matchesPattern(query: string, keywords: string[]): boolean {
    return keywords.some(keyword => query.includes(keyword.toLowerCase()));
  }

  private async handleStockLevelQuery(query: string): Promise<string> {
    
    const forMatch = query.match(/(?:for|of)\s+(.+?)(?:\s|$|\?)/i);
    let itemName = forMatch ? forMatch[1].trim() : null;

    
    if (!itemName) {
      const quotedMatch = query.match(/['"](.+?)['"]/);
      itemName = quotedMatch ? quotedMatch[1].trim() : null;
    }

    // If still no match, take everything after "stock level"
    if (!itemName) {
      const afterStock = query.replace(/.*?stock\s+level\s*/i, '').trim();
      itemName = afterStock.split(/\s+/).slice(0, 3).join(' '); // Take up to 3 words
    }

    if (!itemName || itemName.length < 2) {
      return 'Please specify an item name. Example: "stock level for 10mm Wrench"';
    }

    const item = await this.inventoryService.searchByName(itemName);

    if (!item) {
      return `Item "${itemName}" not found. Please check the spelling or try a different name.`;
    }

    let response = `We currently have ${item.quantity} ${item.unit} of '${item.name}' in stock.`;

    if (item.quantity <= item.reorderThreshold) {
      response += `\n⚠️ Warning: Stock is below reorder threshold (${item.reorderThreshold}).`;
    }

    if (item.forecast?.predictedUsage) {
      const expectedRemaining = item.quantity - item.forecast.predictedUsage;
      response += `\n📊 AI predicts usage of ${item.forecast.predictedUsage} ${item.unit}. Expected remaining: ${expectedRemaining} ${item.unit}.`;
    }

    return response;
  }

  private async handleListItemsQuery(query: string): Promise<string> {
    let category: string | undefined;

    if (query.includes('tool')) category = 'Tools';
    else if (query.includes('material')) category = 'Materials';
    else if (query.includes('consumable')) category = 'Consumables';

    const items = await this.inventoryService.findAll(category);

    if (items.length === 0) {
      return category
        ? `No items found in category: ${category}`
        : 'No items in inventory.';
    }

    const itemList = items
      .map((item, idx) => `${idx + 1}. ${item.name} - ${item.quantity} ${item.unit}`)
      .slice(0, 10) 
      .join('\n');

    const header = category
      ? `Items in ${category} (showing ${Math.min(items.length, 10)} of ${items.length}):`
      : `All inventory items (showing ${Math.min(items.length, 10)} of ${items.length}):`;

    return `${header}\n${itemList}`;
  }

  private async handleLowStockQuery(): Promise<string> {
    const lowStockItems = await this.inventoryService.findLowStock();

    if (lowStockItems.length === 0) {
      return 'All items are sufficiently stocked. ✅';
    }

    const itemList = lowStockItems
      .map((item, idx) => 
        `${idx + 1}. ${item.name} - ${item.quantity} ${item.unit} (threshold: ${item.reorderThreshold})`
      )
      .join('\n');

    return `⚠️ ${lowStockItems.length} item(s) are running low:\n${itemList}`;
  }

  private async handleRecentOrdersQuery(): Promise<string> {
    const orders = await this.ordersService.findAll(undefined, undefined, undefined);
    const recentOrders = orders.slice(0, 5);

    if (recentOrders.length === 0) {
      return 'No recent orders found.';
    }

    const orderList = recentOrders
      .map((order, idx) => {
        const itemCount = order.items.length;
        const date = new Date(order.createdAt).toLocaleDateString();
        return `${idx + 1}. ${order.type} - ${itemCount} item(s) - ${date}`;
      })
      .join('\n');

    return `Recent orders:\n${orderList}`;
  }

  private async handleCategoryQuery(query: string): Promise<string> {
    let category: string | undefined;

    if (query.includes('tool')) category = 'Tools';
    else if (query.includes('material')) category = 'Materials';
    else if (query.includes('consumable')) category = 'Consumables';

    if (!category) {
      return 'Please specify a category: Tools, Materials, or Consumables.';
    }

    const items = await this.inventoryService.findAll(category);

    if (items.length === 0) {
      return `No items found in category: ${category}`;
    }

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return `Category: ${category}\nTotal items: ${items.length}\nCombined quantity: ${totalQuantity}`;
  }
}
