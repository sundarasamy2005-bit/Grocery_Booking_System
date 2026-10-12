import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { User } from './models/User';
import { Shop } from './models/Shop';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { Order } from './models/Order';

async function seedShopData() {
  await connectDB();
  console.log('🌱 Seeding rich shop and order data...');

  // 1. Ensure or find a shopOwner user
  let owner = await User.findOne({ role: 'shopOwner' });
  if (!owner) {
    owner = await User.create({
      firebaseUid: 'shop_owner_demo_uid_1001',
      name: 'Karthik Grocers',
      email: 'owner@pollachigrocery.com',
      phone: '9842154321',
      role: 'shopOwner',
      isActive: true,
    });
    console.log('✅ Created demo shop owner:', owner.email);
  }

  // 2. Ensure or find Categories
  const categories = await Category.find();
  if (categories.length === 0) {
    console.error('❌ No categories found. Please seed categories first.');
    process.exit(1);
  }

  const fruitsCat = categories.find((c) => c.slug === 'fruits') || categories[0];
  const vegCat = categories.find((c) => c.slug === 'vegetables') || categories[1];
  const dairyCat = categories.find((c) => c.slug === 'dairy') || categories[2];
  const grainCat = categories.find((c) => c.slug === 'rice-grains') || categories[3];
  const snackCat = categories.find((c) => c.slug === 'snacks') || categories[4];

  // 3. Create or update Shop
  let shop = await Shop.findOne({ ownerId: owner._id.toString() });
  if (!shop) {
    shop = await Shop.create({
      ownerId: owner._id.toString(),
      shopName: 'Pollachi Fresh Organics',
      description: 'Your premier neighbourhood supermarket with fresh local produce, organic vegetables, and daily staples.',
      phone: '9842154321',
      email: 'owner@pollachigrocery.com',
      address: '42 Market Road, Gandhi Nagar',
      city: 'Pollachi',
      state: 'Tamil Nadu',
      postalCode: '642001',
      latitude: 10.6585,
      longitude: 77.0094,
      isApproved: true,
      isActive: true,
      deliveryAvailable: true,
      pickupAvailable: true,
      minimumOrderAmount: 100,
    });
    console.log('✅ Created shop:', shop.shopName);
  }

  const shopId = shop._id.toString();

  // 4. Create rich products (including critical low-stock items)
  await Product.deleteMany({ shopId });

  const sampleProducts = [
    {
      shopId,
      categoryId: fruitsCat._id.toString(),
      name: 'Organic Bananas (Robusta)',
      price: 45,
      stock: 4, // Low stock -> Upcoming risk
      unit: 'dozen',
      isAvailable: true,
      description: 'Fresh local Pollachi farm-picked robusta bananas.',
    },
    {
      shopId,
      categoryId: fruitsCat._id.toString(),
      name: 'Shimla Fresh Apples',
      price: 160,
      stock: 25,
      unit: 'kg',
      isAvailable: true,
      description: 'Crisp and juicy sweet Shimla apples.',
    },
    {
      shopId,
      categoryId: vegCat._id.toString(),
      name: 'Country Tomatoes',
      price: 35,
      stock: 1, // Critical stock -> Immediate risk!
      unit: 'kg',
      isAvailable: true,
      description: 'Fresh sour country tomatoes from local growers.',
    },
    {
      shopId,
      categoryId: vegCat._id.toString(),
      name: 'Red Bell Peppers',
      price: 90,
      stock: 0, // Out of stock -> Immediate risk!
      unit: 'kg',
      isAvailable: true,
      description: 'Crisp bell peppers rich in vitamins.',
    },
    {
      shopId,
      categoryId: vegCat._id.toString(),
      name: 'Fresh Red Onions',
      price: 32,
      stock: 120,
      unit: 'kg',
      isAvailable: true,
      description: 'Farm fresh high-grade cooking onions.',
    },
    {
      shopId,
      categoryId: vegCat._id.toString(),
      name: 'Baby Potatoes',
      price: 28,
      stock: 150,
      unit: 'kg',
      isAvailable: true,
      description: 'Perfect round baby potatoes for curries.',
    },
    {
      shopId,
      categoryId: dairyCat._id.toString(),
      name: 'A2 Cow Milk (Fresh Daily)',
      price: 65,
      stock: 3, // Low stock -> Immediate risk!
      unit: 'litre',
      isAvailable: true,
      description: 'Pure, grass-fed native cow A2 milk delivered fresh every morning.',
    },
    {
      shopId,
      categoryId: dairyCat._id.toString(),
      name: 'Fresh Set Curd',
      price: 40,
      stock: 6, // Low stock
      unit: '500g',
      isAvailable: true,
      description: 'Rich and creamy homestyle curd.',
    },
    {
      shopId,
      categoryId: dairyCat._id.toString(),
      name: 'Malai Paneer',
      price: 110,
      stock: 18,
      unit: '200g',
      isAvailable: true,
      description: 'Soft and melt-in-mouth cottage cheese.',
    },
    {
      shopId,
      categoryId: grainCat._id.toString(),
      name: 'Ponni Boiled Rice',
      price: 60,
      stock: 200,
      unit: 'kg',
      isAvailable: true,
      description: 'Premium aged Thanjavur Ponni boiled rice.',
    },
    {
      shopId,
      categoryId: grainCat._id.toString(),
      name: 'Toor Dal (Organic)',
      price: 155,
      stock: 45,
      unit: 'kg',
      isAvailable: true,
      description: 'Unpolished protein-rich toor dal.',
    },
    {
      shopId,
      categoryId: snackCat._id.toString(),
      name: 'Madras Mixture',
      price: 85,
      stock: 30,
      unit: '250g',
      isAvailable: true,
      description: 'Traditional spicy and crispy savory mixture.',
    },
  ];

  const createdProducts = await Product.insertMany(sampleProducts);
  console.log(`✅ Created ${createdProducts.length} products for shop`);

  // 5. Seed historical orders over the last 14 days
  await Order.deleteMany({ shopId });

  const customers = await User.find({ role: 'customer' });
  const defaultCustomerId = customers[0]?._id?.toString() || owner._id.toString();

  const now = Date.now();
  const ordersToInsert = [];

  // Generate realistic orders over the last 14 days
  for (let daysAgo = 14; daysAgo >= 0; daysAgo--) {
    const ordersCount = daysAgo === 0 ? 5 : Math.floor(Math.random() * 4) + 2; // 2 to 6 orders per day
    const dayDate = new Date(now - daysAgo * 24 * 3600 * 1000);

    for (let oIdx = 0; oIdx < ordersCount; oIdx++) {
      const orderDate = new Date(dayDate.getTime() + (oIdx * 3 + 8) * 3600 * 1000); // spread across daytime

      // Pick 2-4 random products
      const numItems = Math.floor(Math.random() * 3) + 2;
      const shuffled = [...createdProducts].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numItems);

      const items = selected.map((prod) => {
        const qty = Math.floor(Math.random() * 3) + 1;
        return {
          productId: prod._id.toString(),
          name: prod.name,
          price: prod.price,
          quantity: qty,
        };
      });

      const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
      const deliveryFee = 30;
      const totalAmount = subtotal + deliveryFee;

      const isDelivered = daysAgo > 0 || oIdx < 3;
      const orderStatus = isDelivered
        ? 'delivered'
        : oIdx === 3
        ? 'preparing'
        : 'placed';

      ordersToInsert.push({
        orderNumber: `ORD-${dayDate.getFullYear()}${String(dayDate.getMonth() + 1).padStart(2, '0')}${String(dayDate.getDate()).padStart(2, '0')}-${daysAgo * 10 + oIdx + 100}`,
        userId: defaultCustomerId,
        shopId,
        items,
        subtotal,
        deliveryFee,
        totalAmount,
        deliveryType: 'delivery',
        deliveryAddress: {
          fullName: 'Sundarasamy R',
          phone: '9876543210',
          addressLine1: '15 Nehru Street, Mahalingapuram',
          city: 'Pollachi',
          state: 'Tamil Nadu',
          postalCode: '642002',
          latitude: 10.6610,
          longitude: 77.0120,
        },
        deliveryLocation: {
          address: 'Nehru Street, Mahalingapuram, Pollachi',
          latitude: 10.6610,
          longitude: 77.0120,
        },
        paymentMethod: 'COD',
        paymentStatus: isDelivered ? 'confirmed' : 'pending',
        orderStatus,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }
  }

  await Order.insertMany(ordersToInsert);
  console.log(`✅ Seeded ${ordersToInsert.length} historical orders for AI analytics & predictions!`);

  await mongoose.disconnect();
  console.log('🎉 Shop and historical order data seeded successfully!');
}

seedShopData().catch(console.error);
