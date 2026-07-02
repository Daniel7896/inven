// WARNING: This script is intended to seed test/demo data for development purposes.
// It must NEVER be run against the production database once real users exist.

const mongoose = require('mongoose');
const User = require('../models/User');
const Phone = require('../models/Phone');
const Sale = require('../models/Sale');
const AccessoryCategory = require('../models/AccessoryCategory');
const AccessoryItem = require('../models/AccessoryItem');
const dotenv = require('dotenv');

dotenv.config();

const seed = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
    await mongoose.connect(connStr);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing test data only
    const TEST_EMAIL = 'test@example.com';
    const existingTestUser = await User.findOne({ email: TEST_EMAIL });
    if (existingTestUser) {
      await Phone.deleteMany({ user: existingTestUser._id });
      await Sale.deleteMany({ user: existingTestUser._id });
      await AccessoryCategory.deleteMany({ user: existingTestUser._id });
      await AccessoryItem.deleteMany({ user: existingTestUser._id });
      await User.deleteOne({ _id: existingTestUser._id });
    }
    console.log('Cleared existing test user data.');

    // 1. Create a Test User
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123', // Will be hashed via pre-save hook
      storeName: 'Daniel Mobile Zone',
      settings: {
        currency: '₹',
        lowStockThreshold: 3,
        paymentMethods: ['cash', 'card', 'transfer', 'upi']
      }
    });
    await testUser.save();
    console.log(`Test user created: ${testUser.email} (password: password123)`);

    // 2. Create Accessory Categories
    const categories = ['Earphones', 'Charger', 'Cable', 'Case', 'Screen Guard', 'Tempered Glass', 'Power Bank'];
    const seededCategories = [];
    for (const catName of categories) {
      const cat = await AccessoryCategory.create({
        user: testUser._id,
        name: catName,
        isCustom: false
      });
      seededCategories.push(cat);
    }
    console.log('Seeded standard accessory categories.');

    // 3. Create Phone Inventory
    const phonesData = [
      { brand: 'Apple', model: 'iPhone 15 Pro', variant: 'Pro', ram: '8GB', storage: '256GB', color: 'Natural Titanium', quantity: 5, purchasePrice: 950, sellingPrice: 1199, supplier: 'Apple Direct' },
      { brand: 'Apple', model: 'iPhone 14', variant: 'Base', ram: '6GB', storage: '128GB', color: 'Midnight Blue', quantity: 2, purchasePrice: 650, sellingPrice: 799, supplier: 'Global Distributors' },
      { brand: 'Samsung', model: 'Galaxy S24 Ultra', variant: 'Ultra', ram: '12GB', storage: '512GB', color: 'Titanium Black', quantity: 4, purchasePrice: 1050, sellingPrice: 1299, supplier: 'Samsung Wholesale' },
      { brand: 'Samsung', model: 'Galaxy A55', variant: 'Base', ram: '8GB', storage: '128GB', color: 'Awesome Lilac', quantity: 1, purchasePrice: 320, sellingPrice: 420, supplier: 'Apex Electronics' },
      { brand: 'OnePlus', model: '12', variant: 'Base', ram: '16GB', storage: '256GB', color: 'Emerald Green', quantity: 3, purchasePrice: 600, sellingPrice: 749, supplier: 'OnePlus Distributor' },
      { brand: 'Google', model: 'Pixel 8 Pro', variant: 'Pro', ram: '12GB', storage: '128GB', color: 'Bay Blue', quantity: 0, purchasePrice: 700, sellingPrice: 899, supplier: 'Google US Store', status: 'sold_out' },
      { brand: 'Xiaomi', model: 'Redmi Note 13', variant: 'Base', ram: '8GB', storage: '256GB', color: 'Mint Green', quantity: 8, purchasePrice: 180, sellingPrice: 249, supplier: 'Xiaomi HK' }
    ];

    const seededPhones = [];
    for (const pData of phonesData) {
      const p = await Phone.create({
        user: testUser._id,
        ...pData
      });
      seededPhones.push(p);
    }
    console.log('Seeded phone inventory.');

    // 3b. Seed Accessory Inventory
    const accessoriesStock = [
      { category: 'Case', brand: 'Spigen', modelCompatibility: 'iPhone 15 Pro', quantity: 12, purchasePrice: 150, sellingPrice: 399, supplier: 'Spigen India' },
      { category: 'Case', brand: 'Ringke', modelCompatibility: 'Galaxy S24 Ultra', quantity: 2, purchasePrice: 250, sellingPrice: 599, supplier: 'Ringke Dist' },
      { category: 'Screen Guard', brand: 'Spigen AlignMaster', modelCompatibility: 'iPhone 15 Pro', quantity: 8, purchasePrice: 120, sellingPrice: 299, supplier: 'Spigen India' },
      { category: 'Screen Guard', brand: 'Unbranded Tempered Glass', modelCompatibility: 'Universal 6.7"', quantity: 20, purchasePrice: 15, sellingPrice: 99, supplier: 'Local Market' }
    ];

    for (const accItem of accessoriesStock) {
      await AccessoryItem.create({
        user: testUser._id,
        ...accItem
      });
    }
    console.log('Seeded accessory inventory.');

    // 4. Create Historical Sales spanning past 15 days + 6 months
    const salesData = [];
    const now = new Date();

    // 4a. Seed accessory sales spanning last 15 days
    const accessoryCategories = ['Charger', 'Cable', 'Case', 'Screen Guard'];
    const accCostPrices = { 'Charger': 10, 'Cable': 5, 'Case': 4, 'Screen Guard': 2 };
    const accSellPrices = { 'Charger': 25, 'Cable': 15, 'Case': 20, 'Screen Guard': 10 };
    const paymentMethods = ['cash', 'card', 'upi', 'transfer'];

    for (let i = 15; i >= 0; i--) {
      const saleDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      
      // Accessory sale on almost every day
      const dailyAccCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 items per day
      for (let j = 0; j < dailyAccCount; j++) {
        const category = accessoryCategories[Math.floor(Math.random() * accessoryCategories.length)];
        const costPrice = accCostPrices[category];
        const sellingPrice = accSellPrices[category];
        const profit = sellingPrice - costPrice;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        salesData.push({
          user: testUser._id,
          type: 'accessory',
          category,
          costPrice,
          sellingPrice,
          profit,
          paymentMethod,
          date: new Date(saleDate.getTime() + j * 2 * 3600000) // spread times
        });
      }

      // Phone sale on some days
      if (Math.random() > 0.4) {
        const phone = seededPhones[Math.floor(Math.random() * seededPhones.length)];
        // Use realistic sell price (variation around standard sellingPrice)
        const sellingPrice = phone.sellingPrice || (phone.purchasePrice * 1.25);
        const costPrice = phone.purchasePrice;
        const profit = sellingPrice - costPrice;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        salesData.push({
          user: testUser._id,
          type: 'phone',
          itemRef: phone._id,
          costPrice,
          sellingPrice,
          profit,
          paymentMethod,
          customerName: Math.random() > 0.5 ? 'John Doe' : 'Jane Smith',
          customerPhone: Math.random() > 0.5 ? '+123456789' : null,
          date: new Date(saleDate.getTime() + 12 * 3600000) // sold at noon
        });
      }
    }

    // 4b. Seed some older monthly sales for the bar chart (last 5 months)
    for (let m = 5; m > 0; m--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 15);
      
      // Simulate bulk sales per month
      const monthlyPhoneSales = Math.floor(Math.random() * 5) + 3; // 3 to 7 phones
      const monthlyAccSales = Math.floor(Math.random() * 15) + 10; // 10 to 25 accessories

      for (let p = 0; p < monthlyPhoneSales; p++) {
        const phone = seededPhones[Math.floor(Math.random() * seededPhones.length)];
        const sellingPrice = phone.sellingPrice || (phone.purchasePrice * 1.25);
        const costPrice = phone.purchasePrice;
        const profit = sellingPrice - costPrice;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        salesData.push({
          user: testUser._id,
          type: 'phone',
          itemRef: phone._id,
          costPrice,
          sellingPrice,
          profit,
          paymentMethod,
          date: new Date(monthDate.getTime() + p * 24 * 3600000)
        });
      }

      for (let a = 0; a < monthlyAccSales; a++) {
        const category = accessoryCategories[Math.floor(Math.random() * accessoryCategories.length)];
        const costPrice = accCostPrices[category];
        const sellingPrice = accSellPrices[category];
        const profit = sellingPrice - costPrice;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        salesData.push({
          user: testUser._id,
          type: 'accessory',
          category,
          costPrice,
          sellingPrice,
          profit,
          paymentMethod,
          date: new Date(monthDate.getTime() + a * 12 * 3600000)
        });
      }
    }

    await Sale.insertMany(salesData);
    console.log(`Seeded ${salesData.length} transaction sales records.`);
    console.log('Seeding completed successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
