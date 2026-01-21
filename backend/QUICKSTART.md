# Quick Start Guide - AI Inventory Management System

## Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] MongoDB v5+ installed
- [ ] Git installed

## Step 1: MongoDB Setup (CRITICAL - Required for Transactions)

### Windows
```bash
# Start MongoDB with replica set
mongod --replSet rs0 --port 27017 --dbpath C:\data\db

# In a new terminal, open mongo shell
mongo

# Initialize replica set (only needed once)
> rs.initiate()
> exit
```

### macOS/Linux
```bash
# Start MongoDB with replica set
mongod --replSet rs0 --port 27017 --dbpath /data/db

# In a new terminal, open mongo shell
mongo

# Initialize replica set (only needed once)
> rs.initiate()
> exit
```

**Note:** MongoDB replica set is REQUIRED for the transaction feature to work. Without it, order creation will fail.

## Step 2: Install Dependencies

```bash
cd backend
npm install --legacy-peer-deps
```

## Step 3: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings (use nano, vim, or any text editor)
nano .env
```

Minimum required settings in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/inventory-management?replicaSet=rs0
JWT_SECRET=change-this-to-a-random-secret-key
PORT=3000
```

## Step 4: Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev
```

The server will start on `http://localhost:3000`

## Step 5: Access API Documentation

Open your browser and visit:
- **Swagger UI**: http://localhost:3000/api

## Step 6: Create Your First Admin User

### Using Swagger UI (Recommended)
1. Go to http://localhost:3000/api
2. Find the `POST /auth/sign-up` endpoint
3. Click "Try it out"
4. Use this JSON:
   ```json
   {
     "username": "admin",
     "password": "admin123",
     "name": "Admin User",
     "role": "admin"
   }
   ```
5. Click "Execute"

### Using cURL
```bash
curl -X POST http://localhost:3000/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "name": "Admin User",
    "role": "admin"
  }'
```

## Step 7: Login and Get JWT Token

### Using Swagger UI
1. Find the `POST /auth/sign-in` endpoint
2. Click "Try it out"
3. Use this JSON:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
4. Copy the `accessToken` from the response
5. Click the "Authorize" button at the top
6. Enter: `Bearer YOUR_TOKEN_HERE`
7. Now you can use all protected endpoints!

## Step 8: Create Your First Inventory Item

Using Swagger UI:
1. Make sure you're authorized (see Step 7)
2. Find `POST /inventory` endpoint
3. Use this JSON:
   ```json
   {
     "name": "10mm Wrench",
     "description": "Standard combination wrench",
     "category": "Tools",
     "quantity": 15,
     "unit": "pcs",
     "reorderThreshold": 5
   }
   ```

## Step 9: Create Your First Order

1. Find `POST /orders` endpoint
2. Copy the `_id` of the item you created in Step 8
3. Use this JSON (replace `ITEM_ID_HERE`):
   ```json
   {
     "type": "outgoing",
     "items": [
       {
         "itemId": "ITEM_ID_HERE",
         "quantity": 2
       }
     ],
     "notes": "Testing the system"
   }
   ```

## Step 10: Test the Chatbot

1. Find `POST /chatbot/query` endpoint
2. Try these queries:
   ```json
   { "query": "stock level for 10mm Wrench" }
   ```
   ```json
   { "query": "show all tools" }
   ```
   ```json
   { "query": "what items are running low?" }
   ```

## Testing Scheduled Jobs

The AI forecasting and alert jobs run automatically at 1 AM and 2 AM. To test them immediately, you can add manual trigger endpoints or modify the cron schedule temporarily:

### Option 1: Change Cron Schedule for Testing
Edit `src/modules/jobs/forecasting.service.ts`:
```typescript
// Change from:
@Cron(CronExpression.EVERY_DAY_AT_1AM)

// To (runs every 5 minutes):
@Cron('*/5 * * * *')
```

### Option 2: Add Manual Trigger Endpoints
The services already have `triggerForecasting()` and `triggerReorderAlerts()` methods that can be exposed via controllers for testing.

## Common Issues and Solutions

### Issue: "Connection refused" when starting the app
**Solution:** Make sure MongoDB is running with replica set enabled.

### Issue: "Transaction not supported" error
**Solution:** Ensure MongoDB is running in replica set mode. Run `rs.status()` in mongo shell to verify.

### Issue: "JWT must be provided"
**Solution:** You need to login first and use the Authorization header with your token.

### Issue: Port 3000 already in use
**Solution:** Change the PORT in your `.env` file to a different port (e.g., 3001).

## Next Steps

1. **Create more inventory items** with different categories
2. **Create staff users** with limited permissions
3. **Test order transactions** with multiple items
4. **Monitor alerts** as stock levels change
5. **Set up the AI forecasting service** (optional, see README for AI API setup)

## WebSocket Testing

To test real-time features, you can use a WebSocket client:

```javascript
// Frontend example
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Register user
socket.emit('register', userId);

// Listen for updates
socket.on('inventory-update', (data) => {
  console.log('Inventory updated:', data);
});

socket.on('new-alert', (alert) => {
  console.log('New alert:', alert);
});

socket.on('order-created', (order) => {
  console.log('Order created:', order);
});
```

## Development Tips

1. **Hot Reload**: The app automatically reloads when you make changes in development mode
2. **Logs**: Check the console for detailed logs about operations
3. **Database**: Use MongoDB Compass to visually inspect your data
4. **Swagger**: All API endpoints are documented and testable in Swagger UI

## Need Help?

- Check the main README.md for detailed documentation
- Review the Swagger UI for API details
- Check server logs for error messages
- Ensure MongoDB replica set is properly initialized

---

🎉 You're all set! Happy coding!
