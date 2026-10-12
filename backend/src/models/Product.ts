import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, ref: 'Shop', index: true },
    categoryId: { type: String, required: true, ref: 'Category', index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, index: true },
    description: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true, default: 'piece' },
    imageUrl: { type: String },
    cloudinaryPublicId: { type: String },
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
