import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class InventoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  
  private onlineUsers = new Map<string, string>();

  handleConnection(socket: Socket) {
    console.log(`✅ Client connected: ${socket.id}`);
    
    
    socket.on('register', (userId: string) => {
      console.log(`📥 Registering user: ${userId} with socket ID: ${socket.id}`);
      this.onlineUsers.set(userId, socket.id);
      (socket as any).userId = userId;
      this.emitOnlineUsers();
    });
  }

  handleDisconnect(socket: Socket) {
    const userId = (socket as any).userId;
    if (userId && this.onlineUsers.has(userId)) {
      this.onlineUsers.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    }
    this.emitOnlineUsers();
  }

  private emitOnlineUsers() {
    const onlineUserIds = Array.from(this.onlineUsers.keys());
    this.server.emit('online-users', onlineUserIds);
  }

  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(socket: Socket) {
    socket.emit('online-users', Array.from(this.onlineUsers.keys()));
  }

  
  emitInventoryUpdate(itemId: string, data: any) {
    this.server.emit('inventory-update', { itemId, data });
  }

  
  emitNewAlert(alert: any) {
    this.server.emit('new-alert', alert);
  }

  
  emitOrderCreated(order: any) {
    this.server.emit('order-created', order);
  }
}
