import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { User } from './models/User';
import { Shop } from './models/Shop';
import { Category } from './models/Category';
import { Product } from './models/Product';

const SAMPLE_CATEGORIES = [
  { name: 'Fruits', slug: 'fruits', description: 'Fresh seasonal fruits', isActive: true },
  { name: 'Vegetables', slug: 'vegetables', description: 'Farm-fresh vegetables', isActive: true },
  { name: 'Dairy', slug: 'dairy', description: 'Milk, cheese, butter and more', isActive: true },
  { name: 'Rice & Grains', slug: 'rice-grains', description: 'Rice, wheat, pulses and cereals', isActive: true },
  { name: 'Snacks', slug: 'snacks', description: 'Biscuits, chips and namkeen', isActive: true },
  { name: 'Beverages', slug: 'beverages', description: 'Juices, soft drinks and water', isActive: true },
  { name: 'Bakery', slug: 'bakery', description: 'Bread, cakes and baked goods', isActive: true },
  { name: 'Personal Care', slug: 'personal-care', description: 'Soaps, shampoos and hygiene products', isActive: true },
  { name: 'Household', slug: 'household', description: 'Cleaning and household essentials', isActive: true },
];

const seed = async () => {
  await connectDB();

  console.log('🌱 Starting seed...');

  // Clear existing data
  await Category.deleteMany({});
  await Product.deleteMany({});
  console.log('🗑️  Cleared existing categories and products');

  // Seed categories
  const categories = await Category.insertMany(SAMPLE_CATEGORIES);
  console.log(`✅ Created ${categories.length} categories`);

  // Check if a sample shop exists (only seed if ownerId is available in DB)
  const sampleOwner = await User.findOne({ role: 'shopOwner' });
  if (sampleOwner) {
    let sampleShop = await Shop.findOne({ ownerId: sampleOwner._id.toString() });
    if (!sampleShop) {
      sampleShop = await Shop.create({
        ownerId: sampleOwner._id.toString(),
        shopName: 'Fresh Mart',
        description: 'Your neighbourhood grocery store with the freshest produce',
        phone: '9876543210',
        email: sampleOwner.email,
        address: '12 Main Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        latitude: 13.0827,
        longitude: 80.2707,
        isApproved: true,
        isActive: true,
        deliveryAvailable: true,
        pickupAvailable: true,
        minimumOrderAmount: 100,
      });
      console.log(`✅ Created sample shop: ${sampleShop.shopName}`);
    }

    // Seed sample products
    const fruitsCat = categories.find((c) => c.slug === 'fruits');
    const vegCat = categories.find((c) => c.slug === 'vegetables');
    const dairyCat = categories.find((c) => c.slug === 'dairy');

    const sampleProducts = [
      { shopId: sampleShop._id.toString(), categoryId: fruitsCat!._id.toString(), name: 'Banana', price: 50, stock: 100, unit: 'dozen', isAvailable: true, description: 'Fresh yellow bananas' },
      { shopId: sampleShop._id.toString(), categoryId: fruitsCat!._id.toString(), name: 'Apple (Shimla)', price: 180, stock: 50, unit: 'kg', isAvailable: true, description: 'Premium Shimla apples' },
      { shopId: sampleShop._id.toString(), categoryId: fruitsCat!._id.toString(), name: 'Mango (Alphonso)', price: 250, stock: 30, unit: 'kg', isAvailable: true, description: 'Sweet Alphonso mangoes' },
      { shopId: sampleShop._id.toString(), categoryId: vegCat!._id.toString(), name: 'Tomato', price: 40, stock: 200, unit: 'kg', isAvailable: true, description: 'Fresh red tomatoes' },
      { shopId: sampleShop._id.toString(), categoryId: vegCat!._id.toString(), name: 'Onion', price: 35, stock: 300, unit: 'kg', isAvailable: true, description: 'Red onions' },
      { shopId: sampleShop._id.toString(), categoryId: vegCat!._id.toString(), name: 'Potato', price: 30, stock: 400, unit: 'kg', isAvailable: true, description: 'Fresh potatoes' },
      { shopId: sampleShop._id.toString(), categoryId: dairyCat!._id.toString(), name: 'Milk (Full Cream)', price: 70, stock: 100, unit: 'litre', isAvailable: true, description: 'Pasteurised full cream milk' },
      { shopId: sampleShop._id.toString(), categoryId: dairyCat!._id.toString(), name: 'Curd', price: 45, stock: 80, unit: '500g', isAvailable: true, description: 'Fresh set curd' },
      { shopId: sampleShop._id.toString(), categoryId: dairyCat!._id.toString(), name: 'Paneer', price: 120, stock: 40, unit: '200g', isAvailable: true, description: 'Fresh cottage cheese' },
    ];

    await Product.deleteMany({ shopId: sampleShop._id.toString() });
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${products.length} sample products`);
  } else {
    console.log('ℹ️  No shop owner found — skipping product seed. Register a shop owner first.');
  }

  console.log('🌱 Seed complete!');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
