# Bruno API Collection - Inventory Management System

Complete API endpoints collection for testing with Bruno API Client.

## 📁 Collection Structure

```
bruno-api/
├── environments/
│   ├── local.bru          # Local development (localhost:3000)
│   └── production.bru     # Production environment
├── Auth/
│   ├── sign-up.bru        # Create new user
│   ├── sign-in.bru        # Login & get token
│   └── check-token.bru    # Verify token
├── Inventory/
│   ├── get-all-items.bru       # List all items
│   ├── get-low-stock.bru       # Low stock items
│   ├── get-single-item.bru     # Get item by ID
│   ├── create-item.bru         # Create item (Admin)
│   ├── update-item.bru         # Update item (Admin)
│   └── delete-item.bru         # Delete item (Admin)
├── Orders/
│   ├── create-order.bru             # Create outgoing order
│   ├── create-incoming-order.bru    # Create incoming order
│   ├── get-all-orders.bru           # List orders
│   ├── get-single-order.bru         # Get order by ID
│   └── update-order-status.bru      # Update order
├── Alerts/
│   ├── get-all-alerts.bru      # List alerts
│   ├── get-alerts-count.bru    # Active alerts count
│   ├── get-single-alert.bru    # Get alert by ID
│   └── dismiss-alert.bru       # Dismiss alert
└── Chatbot/
    ├── query-stock-level.bru    # Ask about stock
    ├── query-list-items.bru     # List items
    ├── query-low-stock.bru      # Check low stock
    ├── query-recent-orders.bru  # View orders
    └── query-category-info.bru  # Category stats
```

## 🚀 Quick Start

### 1. Install Bruno
Download from: https://www.usebruno.com/

### 2. Open Collection
```
File → Open Collection → Select the "bruno-api" folder
```

### 3. Select Environment
- Click environment dropdown (top right)
- Select "local" for development
- Select "production" for production

### 4. Login to Get Token
1. Open `Auth/sign-in.bru`
2. Click "Send" button
3. Token is **automatically saved** to environment
4. You're ready to use protected endpoints!

## 🔑 Authentication Flow

### Step 1: Sign Up (Optional - if no account)
```
POST /auth/sign-up

Body:
{
  "username": "admin",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}
```

### Step 2: Sign In
```
POST /auth/sign-in

Body:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "user": { ... }
}
```

**Token is auto-saved** - The test script automatically saves the token to the environment variable.

### Step 3: Use Protected Endpoints
All other endpoints automatically use the saved token via `Bearer {{token}}`.

## 📝 Testing Workflows

### Workflow 1: Create Inventory & Test Stock Usage

1. **Sign In**
   - Use `Auth/sign-in.bru`
   - Credentials: `admin` / `admin123`

2. **Create Item**
   - Use `Inventory/create-item.bru`
   - Copy the returned `_id`

3. **Create Outgoing Order**
   - Use `Orders/create-order.bru`
   - Paste the item `_id` in `itemId` field
   - Set quantity to test

4. **Verify Stock Decreased**
   - Use `Inventory/get-single-item.bru`
   - Paste the item `_id`
   - Check new quantity

### Workflow 2: Test Low Stock Alerts

1. **Create Item with Low Stock**
   ```json
   {
     "name": "Test Item",
     "quantity": 3,
     "reorderThreshold": 5
   }
   ```

2. **Check Alerts**
   - Use `Alerts/get-all-alerts.bru?status=new`
   - Should show alert for the item

3. **Dismiss Alert**
   - Copy alert `_id`
   - Use `Alerts/dismiss-alert.bru`

### Workflow 3: Test Chatbot

1. **Stock Level Query**
   ```json
   { "query": "stock level for Test Item" }
   ```

2. **List Items Query**
   ```json
   { "query": "show all tools" }
   ```

3. **Low Stock Query**
   ```json
   { "query": "what items are running low?" }
   ```

### Workflow 4: Test Transactions

1. **Create Item with Quantity 5**

2. **Try to Use 10 (Should Fail)**
   - Use `Orders/create-order.bru`
   - Set quantity to 10
   - Should get error: "Not enough stock"

3. **Use 3 (Should Succeed)**
   - Set quantity to 3
   - Should succeed and decrease stock to 2

## 🎯 Common Test Scenarios

### Test 1: Authentication
```
✓ Sign up new user
✓ Sign in with credentials
✓ Check token validity
✓ Try endpoint without token (should fail)
✓ Try endpoint with expired token (should fail)
```

### Test 2: Inventory CRUD
```
✓ Create item (admin)
✓ Get all items
✓ Get single item
✓ Update item (admin)
✓ Delete item (admin)
✓ Try create as staff (should fail)
```

### Test 3: Order Transactions
```
✓ Create outgoing order (sufficient stock)
✓ Verify stock decreased
✓ Try outgoing order (insufficient stock - should fail)
✓ Create incoming order
✓ Verify stock increased
```

### Test 4: Alerts System
```
✓ Create item below threshold
✓ Check alerts appear
✓ Dismiss alert
✓ Verify alert count decreased
```

### Test 5: Chatbot Queries
```
✓ Ask about stock level
✓ List items by category
✓ Check low stock items
✓ View recent orders
✓ Get category statistics
```

## 🔧 Environment Variables

### Local Environment
```
baseUrl: http://localhost:3000
token: (auto-saved after login)
```

### Production Environment
```
baseUrl: https://api.yourdomain.com
token: (auto-saved after login)
```

### Setting Manually
If auto-save fails:
1. Copy `accessToken` from login response
2. Click environment dropdown
3. Click "Configure"
4. Paste token value

## 📊 Response Examples

### Successful Response
```json
{
  "_id": "673d4e8a8f1c2d3e4f5a6b7c",
  "name": "10mm Wrench",
  "quantity": 15,
  "unit": "pcs",
  ...
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Not enough stock for 10mm Wrench. Available: 5, Requested: 10",
  "error": "Bad Request"
}
```

### Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "quantity must not be less than 0",
    "unit must be a valid enum value"
  ],
  "error": "Bad Request"
}
```

## 🧪 Test Scripts

Each endpoint includes automatic tests:

```javascript
test("Status code is 200", function() {
  expect(res.getStatus()).to.equal(200);
});

test("Response has required fields", function() {
  expect(res.body).to.have.property('_id');
});
```

View test results in Bruno's response panel.

## 🎨 Tips & Tricks

### 1. Path Parameters
Replace `:id` with actual MongoDB ObjectId:
```
/inventory/:id  →  /inventory/673d4e8a8f1c2d3e4f5a6b7c
```

### 2. Query Parameters
Use the query params section in Bruno or URL:
```
/inventory?category=Tools&search=wrench
```

### 3. Multi-Item Orders
```json
{
  "type": "outgoing",
  "items": [
    { "itemId": "id1", "quantity": 2 },
    { "itemId": "id2", "quantity": 5 },
    { "itemId": "id3", "quantity": 1 }
  ]
}
```

### 4. Duplicate Requests
Right-click request → Duplicate → Modify for variations

### 5. Environment Switching
Quickly switch between local/production environments

## 🐛 Troubleshooting

### Issue: 401 Unauthorized
**Solution**: Run sign-in request again to refresh token

### Issue: 404 Not Found
**Solution**: Check if you replaced `:id` with actual ObjectId

### Issue: 400 Bad Request
**Solution**: Check request body matches expected format

### Issue: Token not saving
**Solution**: Manually copy token and set in environment

## 📚 Additional Resources

- **API Documentation**: http://localhost:3000/api (Swagger)
- **Backend Repo**: See README.md for backend setup
- **Frontend Guide**: See FRONTEND_GUIDE.md

## 🎉 You're All Set!

Start testing by:
1. Sign in with `admin` / `admin123`
2. Create some inventory items
3. Test creating orders
4. Try the chatbot queries
5. Monitor alerts

Happy testing! 🚀
