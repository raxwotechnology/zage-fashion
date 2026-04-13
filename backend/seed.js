const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const User = require('./models/User');
const Store = require('./models/Store');
const Category = require('./models/Category');
const Product = require('./models/Product');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Store.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('Data cleared...');

    // Create Users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@freshcart.com',
      password: 'admin123',
      phone: '1234567890',
      role: 'admin',
    });

    const storeOwner1 = await User.create({
      name: 'John Green',
      email: 'john@freshfarms.com',
      password: 'owner123',
      phone: '9876543210',
      role: 'storeOwner',
    });

    const storeOwner2 = await User.create({
      name: 'Sarah Miller',
      email: 'sarah@organicmart.com',
      password: 'owner123',
      phone: '9876543211',
      role: 'storeOwner',
    });

    const customer = await User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'customer123',
      phone: '5555555555',
      role: 'customer',
      addresses: [
        {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          isDefault: true,
        },
      ],
    });

    console.log('Users created...');

    // Create Stores
    const store1 = await Store.create({
      ownerId: storeOwner1._id,
      name: 'Fresh Farms',
      slug: 'fresh-farms',
      description: 'Your local farm-to-table grocery store bringing the freshest produce, dairy, and organic products directly from local farms.',
      address: '456 Market Street',
      city: 'New York',
      phone: '212-555-0101',
      email: 'hello@freshfarms.com',
      bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
      logo: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200',
      operatingHours: { open: '07:00', close: '22:00' },
      isActive: true,
    });

    const store2 = await Store.create({
      ownerId: storeOwner2._id,
      name: 'Organic Mart',
      slug: 'organic-mart',
      description: 'Premium organic and health-focused grocery store. We source only certified organic products for health-conscious shoppers.',
      address: '789 Health Blvd',
      city: 'Brooklyn',
      phone: '718-555-0202',
      email: 'info@organicmart.com',
      bannerImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200',
      logo: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=200',
      operatingHours: { open: '08:00', close: '21:00' },
      isActive: true,
    });

    console.log('Stores created...');

    // Create Cashier Users (assigned to stores)
    const cashier1 = await User.create({
      name: 'Mike Cashier',
      email: 'cashier@freshfarms.com',
      password: 'cashier123',
      phone: '5551234567',
      role: 'cashier',
      assignedStore: store1._id,
    });

    const cashier2 = await User.create({
      name: 'Lisa Cashier',
      email: 'cashier@organicmart.com',
      password: 'cashier123',
      phone: '5559876543',
      role: 'cashier',
      assignedStore: store2._id,
    });

    console.log('Cashiers created...');

    // Create Categories
    const categories = await Category.insertMany([
      { name: 'Fresh Fruits', slug: 'fresh-fruits', icon: '🍎', image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', isActive: true },
      { name: 'Vegetables', slug: 'vegetables', icon: '🥦', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', isActive: true },
      { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥛', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', isActive: true },
      { name: 'Bakery', slug: 'bakery', icon: '🍞', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', isActive: true },
      { name: 'Meat & Seafood', slug: 'meat-seafood', icon: '🥩', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400', isActive: true },
      { name: 'Beverages', slug: 'beverages', icon: '🥤', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400', isActive: true },
      { name: 'Snacks', slug: 'snacks', icon: '🍿', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400', isActive: true },
      { name: 'Pantry', slug: 'pantry', icon: '🫙', image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400', isActive: true },
    ]);

    console.log('Categories created...');

    // Create Products (with barcodes and SKUs for POS)
    const products = [
      // Fresh Fruits
      {
        storeId: store1._id, name: 'Organic Red Apples', slug: 'organic-red-apples',
        categoryId: categories[0]._id, description: 'Crisp and juicy organic Gala apples. Sourced directly from upstate farms, these apples are perfect for snacking, baking, or adding to salads.',
        price: 4.99, mrp: 6.99, discount: 29, unit: 'kg',
        stock: 150, images: [
          'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
          'https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?w=600',
        ],
        averageRating: 4.5, totalReviews: 23, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567001', sku: 'FF-FRT-001',
      },
      {
        storeId: store1._id, name: 'Fresh Bananas', slug: 'fresh-bananas',
        categoryId: categories[0]._id, description: 'Premium yellow bananas, perfectly ripened. Great source of potassium and natural energy.',
        price: 1.99, mrp: 2.49, discount: 20, unit: 'bunch',
        stock: 200, images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600'],
        averageRating: 4.7, totalReviews: 45, isFeatured: true, isOnSale: false, status: 'active',
        barcode: '4901234567002', sku: 'FF-FRT-002',
      },
      {
        storeId: store2._id, name: 'Organic Strawberries', slug: 'organic-strawberries',
        categoryId: categories[0]._id, description: 'Sweet, juicy organic strawberries. Hand-picked at peak ripeness for maximum flavor.',
        price: 5.99, mrp: 7.99, discount: 25, unit: 'pack',
        stock: 80, images: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600'],
        averageRating: 4.8, totalReviews: 34, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567003', sku: 'OM-FRT-001',
      },
      {
        storeId: store2._id, name: 'Valencia Oranges', slug: 'valencia-oranges',
        categoryId: categories[0]._id, description: 'Sweet and seedless Valencia oranges perfect for juicing or eating fresh. Rich in Vitamin C.',
        price: 3.49, mrp: 4.99, discount: 30, unit: 'kg',
        stock: 120, images: ['https://images.unsplash.com/photo-1547514701-42782101795e?w=600'],
        averageRating: 4.3, totalReviews: 19, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '4901234567004', sku: 'OM-FRT-002',
      },

      // Vegetables
      {
        storeId: store1._id, name: 'Fresh Broccoli', slug: 'fresh-broccoli',
        categoryId: categories[1]._id, description: 'Farm-fresh broccoli crowns. Packed with vitamins and perfect for stir-fries, steaming, or roasting.',
        price: 2.99, mrp: 3.99, discount: 25, unit: 'piece',
        stock: 90, images: ['https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600'],
        averageRating: 4.4, totalReviews: 12, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '4901234567005', sku: 'FF-VEG-001',
      },
      {
        storeId: store1._id, name: 'Baby Spinach', slug: 'baby-spinach',
        categoryId: categories[1]._id, description: 'Tender baby spinach leaves. Pre-washed and ready to eat. Great for salads and smoothies.',
        price: 3.49, mrp: 4.49, discount: 22, unit: 'pack',
        stock: 65, images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600'],
        averageRating: 4.6, totalReviews: 28, isFeatured: true, isOnSale: false, status: 'active',
        barcode: '4901234567006', sku: 'FF-VEG-002',
      },
      {
        storeId: store2._id, name: 'Organic Carrots', slug: 'organic-carrots',
        categoryId: categories[1]._id, description: 'Sweet and crunchy organic carrots. Perfect for snacking, cooking, or juicing.',
        price: 2.49, mrp: 3.49, discount: 29, unit: 'kg',
        stock: 110, images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600'],
        averageRating: 4.5, totalReviews: 17, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '4901234567007', sku: 'OM-VEG-001',
      },
      {
        storeId: store2._id, name: 'Cherry Tomatoes', slug: 'cherry-tomatoes',
        categoryId: categories[1]._id, description: 'Vine-ripened cherry tomatoes bursting with flavor. Ideal for salads, pasta, and snacking.',
        price: 3.99, mrp: 4.99, discount: 20, unit: 'pack',
        stock: 75, images: ['https://images.unsplash.com/photo-1546470427-0d4db154ceb8?w=600'],
        averageRating: 4.2, totalReviews: 8, isFeatured: false, isOnSale: false, status: 'active',
        barcode: '4901234567008', sku: 'OM-VEG-002',
      },

      // Dairy & Eggs
      {
        storeId: store1._id, name: 'Farm Fresh Eggs', slug: 'farm-fresh-eggs',
        categoryId: categories[2]._id, description: 'Free-range farm-fresh eggs from happy hens. Rich yolks and superior taste.',
        price: 5.49, mrp: 6.99, discount: 21, unit: 'dozen',
        stock: 200, images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600'],
        averageRating: 4.9, totalReviews: 56, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567009', sku: 'FF-DRY-001',
      },
      {
        storeId: store1._id, name: 'Whole Milk', slug: 'whole-milk',
        categoryId: categories[2]._id, description: 'Fresh whole milk from local dairy farms. Creamy, nutritious, and perfect for your morning cereal or coffee.',
        price: 3.99, mrp: 4.49, discount: 11, unit: 'gallon',
        stock: 100, images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600'],
        averageRating: 4.7, totalReviews: 31, isFeatured: false, isOnSale: false, status: 'active',
        barcode: '4901234567010', sku: 'FF-DRY-002',
      },
      {
        storeId: store2._id, name: 'Greek Yogurt', slug: 'greek-yogurt',
        categoryId: categories[2]._id, description: 'Thick and creamy Greek yogurt. High in protein and probiotics. Perfect for breakfast bowls.',
        price: 4.99, mrp: 5.99, discount: 17, unit: 'pack',
        stock: 85, images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600'],
        averageRating: 4.6, totalReviews: 22, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567011', sku: 'OM-DRY-001',
      },

      // Bakery
      {
        storeId: store1._id, name: 'Sourdough Bread', slug: 'sourdough-bread',
        categoryId: categories[3]._id, description: 'Artisan sourdough bread baked fresh daily. Crispy crust with a soft, tangy interior.',
        price: 5.99, mrp: 7.49, discount: 20, unit: 'loaf',
        stock: 40, images: ['https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=600'],
        averageRating: 4.8, totalReviews: 41, isFeatured: true, isOnSale: false, status: 'active',
        barcode: '4901234567012', sku: 'FF-BKR-001',
      },
      {
        storeId: store2._id, name: 'Chocolate Croissants', slug: 'chocolate-croissants',
        categoryId: categories[3]._id, description: 'Flaky, buttery croissants filled with rich Belgian chocolate. Freshly baked every morning.',
        price: 3.99, mrp: 5.49, discount: 27, unit: 'pack of 4',
        stock: 30, images: ['https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=600'],
        averageRating: 4.7, totalReviews: 18, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '4901234567013', sku: 'OM-BKR-001',
      },

      // Meat & Seafood
      {
        storeId: store1._id, name: 'Atlantic Salmon Fillet', slug: 'atlantic-salmon-fillet',
        categoryId: categories[4]._id, description: 'Premium wild-caught Atlantic salmon fillets. Rich in omega-3 fatty acids.',
        price: 12.99, mrp: 15.99, discount: 19, unit: 'kg',
        stock: 45, images: ['https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=600'],
        averageRating: 4.6, totalReviews: 15, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567014', sku: 'FF-MSF-001',
      },
      {
        storeId: store1._id, name: 'Chicken Breast', slug: 'chicken-breast',
        categoryId: categories[4]._id, description: 'Boneless skinless chicken breast. Hormone-free and raised without antibiotics.',
        price: 8.99, mrp: 10.99, discount: 18, unit: 'kg',
        stock: 70, images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82571?w=600'],
        averageRating: 4.4, totalReviews: 27, isFeatured: false, isOnSale: false, status: 'active',
        barcode: '4901234567015', sku: 'FF-MSF-002',
      },

      // Beverages
      {
        storeId: store2._id, name: 'Cold Pressed Orange Juice', slug: 'cold-pressed-oj',
        categoryId: categories[5]._id, description: 'Freshly cold-pressed orange juice with no added sugars or preservatives. Pure citrus goodness.',
        price: 6.99, mrp: 8.49, discount: 18, unit: 'bottle',
        stock: 60, images: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600'],
        averageRating: 4.5, totalReviews: 20, isFeatured: false, isOnSale: true, status: 'active',
        barcode: '4901234567016', sku: 'OM-BEV-001',
      },
      {
        storeId: store2._id, name: 'Organic Green Tea', slug: 'organic-green-tea',
        categoryId: categories[5]._id, description: 'Premium organic green tea bags. Light, refreshing, and packed with antioxidants.',
        price: 4.99, mrp: 5.99, discount: 17, unit: 'box of 20',
        stock: 90, images: ['https://images.unsplash.com/photo-1556881286-fc6915169721?w=600'],
        averageRating: 4.3, totalReviews: 14, isFeatured: true, isOnSale: false, status: 'active',
        barcode: '4901234567017', sku: 'OM-BEV-002',
      },
      // Snacks
      {
        storeId: store1._id, name: 'Mixed Nuts Premium', slug: 'mixed-nuts-premium',
        categoryId: categories[6]._id, description: 'A premium blend of almonds, cashews, walnuts, and pecans. Lightly salted and roasted to perfection.',
        price: 9.99, mrp: 12.99, discount: 23, unit: 'pack',
        stock: 55, images: ['https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=600'],
        averageRating: 4.7, totalReviews: 33, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567018', sku: 'FF-SNK-001',
      },
      // Pantry
      {
        storeId: store2._id, name: 'Extra Virgin Olive Oil', slug: 'extra-virgin-olive-oil',
        categoryId: categories[7]._id, description: 'Cold-pressed extra virgin olive oil from Mediterranean olives. Perfect for cooking, dressing, and dipping.',
        price: 11.99, mrp: 14.99, discount: 20, unit: 'bottle',
        stock: 40, images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'],
        averageRating: 4.8, totalReviews: 25, isFeatured: true, isOnSale: true, status: 'active',
        barcode: '4901234567019', sku: 'OM-PNT-001',
      },
    ];

    await Product.insertMany(products);

    console.log('Products created...');
    console.log('');
    console.log('=== SEED DATA COMPLETE ===');
    console.log('');
    console.log('Test Accounts:');
    console.log('  Admin:    admin@freshcart.com / admin123');
    console.log('  Owner1:   john@freshfarms.com / owner123');
    console.log('  Owner2:   sarah@organicmart.com / owner123');
    console.log('  Customer: jane@example.com / customer123');
    console.log('  Cashier1: cashier@freshfarms.com / cashier123  (Fresh Farms)');
    console.log('  Cashier2: cashier@organicmart.com / cashier123  (Organic Mart)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
