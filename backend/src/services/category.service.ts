import { Category } from '../models/Category';

export const DEFAULT_CATEGORIES = [
  {
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Farm-fresh daily green vegetables, onions, potatoes, tomatoes and fresh roots',
    isActive: true,
  },
  {
    name: 'Cooking Oil',
    slug: 'cooking-oil',
    description: 'Pure sunflower oil, groundnut oil, mustard oil, gingelly oil, ghee and olive oils',
    isActive: true,
  },
  {
    name: 'Pulses & Lentils',
    slug: 'pulses-lentils',
    description: 'Nutritious toor dal, moong dal, urad dal, chana dal, rajma and organic pulses',
    isActive: true,
  },
  {
    name: 'Spices & Masala',
    slug: 'spices-masala',
    description: 'Authentic ground spices, whole spices, garam masala, turmeric, coriander and sambar powder',
    isActive: true,
  },
  {
    name: 'Frozen Foods',
    slug: 'frozen-foods',
    description: 'Quick frozen green peas, sweet corn, ready-to-fry snacks, parathas and frozen veg meals',
    isActive: true,
  },
  {
    name: 'Cleaning Supplies',
    slug: 'cleaning-supplies',
    description: 'Floor cleaners, dishwashing bars, detergents, disinfectant liquids and kitchen cleaning supplies',
    isActive: true,
  },
  {
    name: 'Baby Products',
    slug: 'baby-products',
    description: 'Gentle baby skincare, diapers, baby wipes, baby food and feeding essentials',
    isActive: true,
  },
  {
    name: 'Meat & Seafood',
    slug: 'meat-seafood',
    description: 'Fresh poultry cuts, chicken, mutton, prawns, fish and premium fresh seafood',
    isActive: true,
  },
  {
    name: 'Personal Hygiene',
    slug: 'personal-hygiene',
    description: 'Bathing soaps, shampoos, oral care toothpastes, handwashes, sanitizers and personal hygiene',
    isActive: true,
  },
  {
    name: 'Eggs',
    slug: 'eggs',
    description: 'Farm fresh white eggs, brown eggs, organic country eggs and nutrient-rich table eggs',
    isActive: true,
  },
  {
    name: 'Fruits',
    slug: 'fruits',
    description: 'Fresh seasonal fruits, apples, bananas, citrus and seasonal delights',
    isActive: true,
  },
  {
    name: 'Dairy',
    slug: 'dairy',
    description: 'Fresh milk, paneer, curd, cheese, fresh butter and dairy favorites',
    isActive: true,
  },
  {
    name: 'Rice & Grains',
    slug: 'rice-grains',
    description: 'Ponni rice, basmati, wheat flour, rava, millets and nutritious whole grains',
    isActive: true,
  },
  {
    name: 'Snacks',
    slug: 'snacks',
    description: 'Crunchy biscuits, namkeen, potato chips, roasted nuts and savory snacks',
    isActive: true,
  },
  {
    name: 'Beverages',
    slug: 'beverages',
    description: 'Refreshing juices, tea powder, filter coffee, soft drinks and mineral water',
    isActive: true,
  },
  {
    name: 'Bakery',
    slug: 'bakery',
    description: 'Soft sandwich breads, buns, rusks, cakes and oven-baked items',
    isActive: true,
  },
  {
    name: 'Household',
    slug: 'household',
    description: 'General household essentials, foils, garbage bags and home utility products',
    isActive: true,
  },
];

export const ensureDefaultCategories = async (): Promise<void> => {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { $or: [{ name: cat.name }, { slug: cat.slug }] },
        {
          $setOnInsert: {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            isActive: true,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log('✅ Default product categories ensured in MongoDB (including all 10 specialized categories)');
  } catch (err) {
    console.warn('⚠️ Notice while checking default categories:', err);
  }
};
