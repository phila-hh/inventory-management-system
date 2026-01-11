# Database Schemas

## User

```typescript
enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

User {
  name: string              // required
  username: string          // required, unique, lowercase
  password: string          // optional, min 6 chars, hashed
  canLogin: boolean         // default: true
  role: UserRole            // required
  isActive: boolean         // default: true
  createdAt: Date           // auto
  updatedAt: Date           // auto
}
```

## Category

```typescript
Category {
  name: string              // required, unique
  description?: string
  icon?: string             // emoji
  isActive: boolean         // default: true
  createdAt: Date           // auto
  updatedAt: Date           // auto
}
```

## InventoryItem

```typescript
enum ItemUnit {
  PCS = 'pcs',
  BOX = 'box',
  KG = 'kg',
  LITERS = 'liters',
  METERS = 'meters',
}

Forecast {
  predictedUsage: number    // default: 0
  forecastDate?: Date
}

InventoryItem {
  name: string              // required
  description?: string
  category: string          // required (references Category.name)
  quantity: number          // required, min: 0, default: 0
  unit: ItemUnit            // required, default: 'pcs'
  reorderThreshold: number  // required, min: 0, default: 5
  lastUpdated: Date         // default: now
  forecast?: Forecast
  createdAt: Date           // auto
  updatedAt: Date           // auto
}
```

## Order

```typescript
enum OrderType {
  INCOMING = 'incoming',    // Purchase/Restock
  OUTGOING = 'outgoing',    // Usage/Consumption
}

enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

OrderItem {
  itemId: ObjectId          // ref: InventoryItem
  name: string              // snapshot at order time
  quantity: number          // min: 1
  unit: string              // snapshot at order time
}

Order {
  type: OrderType           // required
  status: OrderStatus       // required, default: 'pending'
  items: OrderItem[]        // required
  notes?: string
  createdBy: ObjectId       // ref: User
  createdAt: Date           // default: now
  updatedAt: Date           // auto
}
```

## Alert

```typescript
enum AlertStatus {
  NEW = 'new',
  DISMISSED = 'dismissed',
}

enum AlertType {
  MANUAL_THRESHOLD = 'manual_threshold',
  FORECAST_BASED = 'forecast_based',
}

Alert {
  itemId: ObjectId          // ref: InventoryItem
  itemName: string          // snapshot for display
  message: string           // required
  status: AlertStatus       // required, default: 'new'
  type: AlertType           // required
  createdAt: Date           // default: now
  updatedAt: Date           // auto
}
```
