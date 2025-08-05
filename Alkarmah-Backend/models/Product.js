import mongoose from "mongoose";

const ProductVariantSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true },
    ar: { type: String, required: true }
  },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 }, // For showing discounts
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, unique: true }, // Stock Keeping Unit
  attributes: {
    size: String,
    color: String,
    weight: String,
    material: String,
    // Add more variant-specific attributes as needed
  },
  images: [String], // Variant-specific images
  isDefault: { type: Boolean, default: false }, // One variant should be default
  status: {
    type: String,
    enum: ["Active", "Out of stock", "Discontinued"],
    default: "Active"
  }
}, {
  _id: true // Ensure each variant has its own _id
});

const ProductSchema = new mongoose.Schema(
  {
    name: { 
      en: { type: String, required: true },
      ar: { type: String }
    },
    description: { 
      en: String, 
      ar: String 
    },
    baseImage: [String], // Main product images
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
    variants: {
      type: [ProductVariantSchema],
      required: true,
      validate: {
        validator: function(variants) {
          return variants && variants.length > 0;
        },
        message: "Product must have at least one variant"
      }
    },
    status: {
      type: String,
      enum: ["Active", "Out of stock", "Low stock", "Hidden", "Draft"],
      default: "Active",
    },
    specifications: {
      weight: String,
      dimensions: String,
      brand: String,
      model: String,
      warranty: String,
      material: String,
      origin: String,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      slug: { type: String, unique: true }
    },
    tags: [String], // For better categorization and search
    isOnSale: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 100000000 },
    viewCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
ProductSchema.index({ shop: 1, status: 1 });
ProductSchema.index({ "name.en": "text", "name.ar": "text", "description.en": "text", "description.ar": "text" });
ProductSchema.index({ "variants.price": 1 });

// Virtual for getting price range
ProductSchema.virtual('priceRange').get(function() {
  if (!this.variants || this.variants.length === 0) return null;
  
  const prices = this.variants
    .filter(v => v.status === 'Active')
    .map(v => v.price);
  
  if (prices.length === 0) return null;
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return {
    min: minPrice,
    max: maxPrice,
    range: minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`
  };
});

// Virtual for total stock
ProductSchema.virtual('totalStock').get(function() {
  if (!this.variants || this.variants.length === 0) return 0;
  
  return this.variants
    .filter(v => v.status === 'Active')
    .reduce((total, variant) => total + variant.stock, 0);
});

// Method to get default variant
ProductSchema.methods.getDefaultVariant = function() {
  if (!this.variants || this.variants.length === 0) return null;
  
  // First try to find explicitly marked default variant
  let defaultVariant = this.variants.find(v => v.isDefault && v.status === 'Active');
  
  // If no default is marked, use the first active variant
  if (!defaultVariant) {
    defaultVariant = this.variants.find(v => v.status === 'Active');
  }
  
  return defaultVariant;
};

// Method to get variant by ID
ProductSchema.methods.getVariantById = function(variantId) {
  if (!this.variants || this.variants.length === 0) return null;
  
  return this.variants.find(v => v._id.toString() === variantId.toString());
};

// Pre-save middleware to ensure at least one default variant
ProductSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    const hasDefault = this.variants.some(v => v.isDefault);
    
    // If no default is set, make the first active variant default
    if (!hasDefault) {
      const firstActiveVariant = this.variants.find(v => v.status === 'Active');
      if (firstActiveVariant) {
        firstActiveVariant.isDefault = true;
      }
    }
    
    // Update product status based on variants
    const activeVariants = this.variants.filter(v => v.status === 'Active');
    const totalStock = activeVariants.reduce((sum, v) => sum + v.stock, 0);
    
    if (activeVariants.length === 0) {
      this.status = 'Out of stock';
    } else if (totalStock === 0) {
      this.status = 'Out of stock';
    } else if (totalStock <= 10) { // Configurable threshold
      this.status = 'Low stock';
    } else if (this.status === 'Out of stock' || this.status === 'Low stock') {
      this.status = 'Active';
    }
  }
  
  next();
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;
