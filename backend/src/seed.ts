import { NestFactory } from '@nestjs/core';
import AppModule from './modules/app/app.module';
import UsersService from './modules/core/users/users.service';
import { InventoryService } from './modules/inventory/inventory.service';
import { CategoriesService } from './modules/categories/categories.service';
import { ItemUnit } from './modules/inventory/schema/inventory-item.schema';
import { UserRole } from './modules/core/users/schema/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const inventoryService = app.get(InventoryService);
  const categoriesService = app.get(CategoriesService);

  console.log('🌱 Starting database seeding...\n');

  
  const categoryMap: Record<string, string> = {};

  try {
    
    console.log('Creating default categories...');
    const defaultCategories = [
      { name: 'Tools', description: 'Hand tools and power tools', icon: '🔧', isActive: true },
      { name: 'Materials', description: 'Raw materials and supplies', icon: '📦', isActive: true },
      { name: 'Consumables', description: 'Consumable items that need frequent restocking', icon: '🔋', isActive: true },
    ];

    for (const cat of defaultCategories) {
      try {
        const created = await categoriesService.create(cat);
        categoryMap[cat.name] = created.name;
        console.log(`✅ Category created: ${created.name} ${created.icon}`);
      } catch (error) {
        if (error.code === 11000) {
          categoryMap[cat.name] = cat.name;
          console.log(`ℹ️  Category "${cat.name}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    
    console.log('Creating admin user...');
    try {
      const admin = await usersService.create({
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        role: UserRole.ADMIN,
      });
      console.log('✅ Admin user created:', admin.username);
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️  Admin user already exists, skipping...');
      } else {
        throw error;
      }
    }

    
    console.log('Creating staff user...');
    try {
      const staff = await usersService.create({
        username: 'staff',
        password: 'staff123',
        name: 'Staff User',
        role: UserRole.STAFF,
      });
      console.log('✅ Staff user created:', staff.username);
    } catch (error) {
      if (error.code === 11000) {
        console.log('ℹ️  Staff user already exists, skipping...');
      } else {
        throw error;
      }
    }

    
    console.log('\nCreating inventory items...');

    const items = [
      {
        name: '10mm Wrench',
        description: 'Standard 10mm combination wrench',
        category: categoryMap['Tools'] || 'Tools',
        quantity: 15,
        unit: ItemUnit.PCS,
        reorderThreshold: 5,
      },
      {
        name: '12mm Wrench',
        description: 'Standard 12mm combination wrench',
        category: categoryMap['Tools'] || 'Tools',
        quantity: 20,
        unit: ItemUnit.PCS,
        reorderThreshold: 5,
      },
      {
        name: 'Screwdriver Set',
        description: '6-piece screwdriver set',
        category: categoryMap['Tools'] || 'Tools',
        quantity: 8,
        unit: ItemUnit.PCS,
        reorderThreshold: 3,
      },
      {
        name: 'Steel Pipe',
        description: '1 inch diameter steel pipe',
        category: categoryMap['Materials'] || 'Materials',
        quantity: 50,
        unit: ItemUnit.METERS,
        reorderThreshold: 10,
      },
      {
        name: 'Wood Planks',
        description: '2x4 inch wood planks',
        category: categoryMap['Materials'] || 'Materials',
        quantity: 100,
        unit: ItemUnit.PCS,
        reorderThreshold: 20,
      },
      {
        name: 'Paint (White)',
        description: 'White wall paint',
        category: categoryMap['Consumables'] || 'Consumables',
        quantity: 25,
        unit: ItemUnit.LITERS,
        reorderThreshold: 10,
      },
      {
        name: 'Screws Box',
        description: 'Assorted screws box',
        category: categoryMap['Consumables'] || 'Consumables',
        quantity: 30,
        unit: ItemUnit.BOX,
        reorderThreshold: 5,
      },
      {
        name: 'Nails Box',
        description: 'Assorted nails box',
        category: categoryMap['Consumables'] || 'Consumables',
        quantity: 4,
        unit: ItemUnit.BOX,
        reorderThreshold: 5,
      },
      {
        name: 'Sandpaper',
        description: 'Mixed grit sandpaper sheets',
        category: categoryMap['Consumables'] || 'Consumables',
        quantity: 50,
        unit: ItemUnit.PCS,
        reorderThreshold: 20,
      },
      {
        name: 'Power Drill',
        description: 'Cordless power drill with battery',
        category: categoryMap['Tools'] || 'Tools',
        quantity: 5,
        unit: ItemUnit.PCS,
        reorderThreshold: 2,
      },
    ];

    for (const item of items) {
      const created = await inventoryService.create(item);
      console.log(`✅ Created: ${created.name} (${created.quantity} ${created.unit})`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   👤 Admin: username="admin", password="admin123"');
    console.log('   👤 Staff: username="staff", password="staff123"');
    console.log('\n🔑 OpenRouter AI Setup:');
    console.log('   1. Get API key from: https://openrouter.ai/keys');
    console.log('   2. Add to .env: OPENROUTER_API_KEY=your-key-here');
    console.log('   3. Restart server to enable AI chatbot & forecasting');
    console.log('   4. Model: deepseek/deepseek-chat (very affordable!)');
    console.log('\n🚀 Start your server: npm run start:dev');
    console.log('📖 API Docs: http://localhost:3000/api');
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    console.error('\n💡 Tip: If items already exist, that\'s okay! Users were created/verified.');
  } finally {
    await app.close();
  }
}

bootstrap();
