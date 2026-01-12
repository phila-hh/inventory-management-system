import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  
  connect(userId) {
    if (this.socket?.connected) return;

    try {
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 3,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.socket?.emit('register', userId);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ WebSocket connection error (app will work without real-time updates):', error.message);
      });
    } catch (error) {
      console.warn('⚠️ WebSocket unavailable (app will work without real-time updates):', error.message);
    }
  }

  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  
  onInventoryUpdate(callback) {
    this.socket?.on('inventory-update', callback);
  }

  
  onNewAlert(callback) {
    this.socket?.on('new-alert', callback);
  }

  
  onOrderCreated(callback) {
    this.socket?.on('order-created', callback);
  }

  
  offInventoryUpdate() {
    this.socket?.off('inventory-update');
  }

  
  offNewAlert() {
    this.socket?.off('new-alert');
  }

  
  offOrderCreated() {
    this.socket?.off('order-created');
  }
}

export const socketService = new SocketService();
