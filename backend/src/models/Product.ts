import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, ref: 'Shop', index: true },
    categoryId: { type: String, required: true, ref: 'Category', index: true },
    sku: { type: String, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, index: true },
    description: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discountPercentage: { type: Number, default: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true, default: 'piece' },
    imageUrl: { type: String },
    images: [{ type: String }],
    cloudinaryPublicId: { type: String },
    brand: { type: String, trim: true, default: '' },
    freshnessInfo: { type: String, trim: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ shopId: 1, categoryId: 1 });
productSchema.index({ shopId: 1, isAvailable: 1 });

productSchema.pre('save', function (this: any) {
  if (this.isModified('name') || !this.slug) {
    this.slug =
      (this.name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now();
  }
});

export const Product = mongoose.model('Product', productSchema);
