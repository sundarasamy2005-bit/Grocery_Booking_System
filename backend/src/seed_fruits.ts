import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { connectDB } from './config/database';
import { Product } from './models/Product';
import { Category } from './models/Category';
import { Shop } from './models/Shop';

interface FruitSeedItem {
  sku: string;
  name: string;
  categorySlug: string;
  categoryGroup: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  unit: string;
  brand: string;
  freshnessInfo: string;
  imageUrl: string;
  isAvailable: boolean;
}

export async function seedFruits() {
  await connectDB();
  console.log('--- Starting Fruits Seed Script for Pavithra Fruits Shop ---');

  // 1. Resolve Target Shop: PAVITHRA FRUIETS SHOP
  const TARGET_SHOP_ID = '6acb93f2ea86eee7b427ec4e';
  let targetShop = await Shop.findById(TARGET_SHOP_ID);
  if (!targetShop) {
    targetShop = await Shop.findOne({ shopName: /pavithra/i });
  }

  if (!targetShop) {
    console.error('ERROR: Target shop "PAVITHRA FRUIETS SHOP" (ID: 6acb93f2ea86eee7b427ec4e) not found in database!');
    process.exit(1);
  }

  const shopId = targetShop._id.toString();
  console.log(`Found Target Shop: "${targetShop.shopName}" (ID: ${shopId})`);

  // 2. Resolve Category: fruits
  let category = await Category.findOne({ slug: 'fruits' });
  if (!category) {
    category = await Category.create({
      name: 'Fruits',
      slug: 'fruits',
      description: 'Fresh seasonal fruits',
      isActive: true,
    });
    console.log(`Created category: ${category.name}`);
  }
  const categoryId = category._id.toString();
  console.log(`Resolved Category: "${category.name}" (ID: ${categoryId})`);

  // 3. Read fruits.json
  const filePath = path.join(__dirname, 'data', 'fruits.json');
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Fruits dataset file not found at ${filePath}`);
    process.exit(1);
  }

  const fileData = fs.readFileSync(filePath, 'utf-8');
  const items: FruitSeedItem[] = JSON.parse(fileData);
  console.log(`Read ${items.length} fruit entries from ${filePath}`);

  // 4. Upsert Products
  let createdCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    const slugBase = (item.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingProduct = await Product.findOne({
      shopId,
      sku: item.sku,
    });

    if (existingProduct) {
      existingProduct.categoryId = categoryId;
      existingProduct.name = item.name;
      existingProduct.description = item.description;
      existingProduct.price = item.price;
      existingProduct.originalPrice = item.originalPrice;
      existingProduct.discountPercentage = item.discountPercentage;
      existingProduct.stock = item.stock;
      existingProduct.unit = item.unit;
      existingProduct.brand = item.brand;
      existingProduct.freshnessInfo = item.freshnessInfo;
      existingProduct.imageUrl = item.imageUrl;
      existingProduct.isAvailable = item.isAvailable;
      await existingProduct.save();
      updatedCount++;
    } else {
      await Product.create({
        shopId,
        categoryId,
        sku: item.sku,
        name: item.name,
        slug: `${slugBase}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        discountPercentage: item.discountPercentage,
        stock: item.stock,
        unit: item.unit,
        brand: item.brand,
        freshnessInfo: item.freshnessInfo,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      });
      createdCount++;
    }
  }

  const totalShopProducts = await Product.countDocuments({ shopId });
  console.log('\n--- Fruits Seed Execution Summary ---');
  console.log(`Target Shop: ${targetShop.shopName} (${shopId})`);
  console.log(`Processed: ${items.length} items`);
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Total Products for shop in DB: ${totalShopProducts}`);

  return {
    shopName: targetShop.shopName,
    shopId,
    processed: items.length,
    created: createdCount,
    updated: updatedCount,
    totalShopProducts,
  };
}

if (require.main === module) {
  seedFruits()
    .then(() => {
      console.log('Fruits seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fruits seed failed:', err);
      process.exit(1);
    });
}
