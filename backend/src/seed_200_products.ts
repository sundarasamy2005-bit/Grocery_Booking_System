import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { connectDB } from './config/database';
import { Product } from './models/Product';
import { Category } from './models/Category';
import { Shop } from './models/Shop';

interface ProductSeedItem {
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

export async function seed200Products() {
  await connectDB();
  console.log('--- Starting 200 Products Seed Script ---');

  // 1. Resolve Target Shop: pavi Grocery Shop
  const TARGET_SHOP_ID = '6acbb65827790d6129887caf';
  let targetShop = await Shop.findById(TARGET_SHOP_ID);
  if (!targetShop) {
    targetShop = await Shop.findOne({ shopName: /pavi/i });
  }

  if (!targetShop) {
    console.error('ERROR: Target shop "pavi Grocery Shop" (ID: 6acbb65827790d6129887caf) not found in database!');
    console.error('Cannot proceed without a valid shop reference.');
    process.exit(1);
  }

  const shopId = targetShop._id.toString();
  console.log(`Found Target Shop: "${targetShop.shopName}" (ID: ${shopId})`);

  // 2. Load Categories
  const allCategories = await Category.find({});
  const categoryMap = new Map<string, any>();
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat);
  }
  console.log(`Loaded ${allCategories.length} categories from DB.`);

  // 3. Read & Validate products.json
  const filePath = path.join(__dirname, 'data', 'products.json');
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Dataset file not found at ${filePath}`);
    process.exit(1);
  }

  const fileData = fs.readFileSync(filePath, 'utf-8');
  const items: ProductSeedItem[] = JSON.parse(fileData);

  console.log(`Read ${items.length} product entries from ${filePath}`);
  if (items.length !== 200) {
    console.error(`ERROR: Expected exactly 200 products, found ${items.length}`);
    process.exit(1);
  }

  // Verify all categories exist
  const missingCategories = new Set<string>();
  for (const item of items) {
    if (!categoryMap.has(item.categorySlug)) {
      missingCategories.add(item.categorySlug);
    }
  }

  if (missingCategories.size > 0) {
    console.warn(`Warning: Missing category slugs in DB:`, Array.from(missingCategories));
    console.log(`Creating missing categories to preserve schema integrity...`);
    for (const slug of missingCategories) {
      const sampleItem = items.find(i => i.categorySlug === slug);
      const name = sampleItem ? sampleItem.categoryGroup.split(' & ')[0] : slug;
      const newCat = await Category.create({
        name,
        slug,
        description: `${name} groceries and items`,
        isActive: true,
      });
      categoryMap.set(slug, newCat);
      console.log(`Created missing category: ${slug} (${name})`);
    }
  }

  // 4. Upsert Products
  let createdCount = 0;
  let updatedCount = 0;
  const categoryStats: Record<string, number> = {};

  for (const item of items) {
    const category = categoryMap.get(item.categorySlug);
    if (!category) {
      throw new Error(`Category not found for slug: ${item.categorySlug}`);
    }

    const categoryId = category._id.toString();
    const slug = (item.name as string)
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
        slug: `${slug}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

    const group = item.categoryGroup;
    categoryStats[group] = (categoryStats[group] || 0) + 1;
  }

  // 5. Verify final counts
  const totalShopProducts = await Product.countDocuments({ shopId });

  console.log('\n--- Seed Execution Summary ---');
  console.log(`Target Shop: ${targetShop.shopName} (${shopId})`);
  console.log(`Dataset File: ${filePath}`);
  console.log(`Processed: ${items.length} items`);
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Total Products for shop in DB: ${totalShopProducts}`);
  console.log('\nCategory Breakdown:');
  for (const [group, count] of Object.entries(categoryStats)) {
    console.log(`  - ${group}: ${count}`);
  }

  return {
    shopName: targetShop.shopName,
    shopId,
    filePath,
    processed: items.length,
    created: createdCount,
    updated: updatedCount,
    totalShopProducts,
    categoryStats,
  };
}

if (require.main === module) {
  seed200Products()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
