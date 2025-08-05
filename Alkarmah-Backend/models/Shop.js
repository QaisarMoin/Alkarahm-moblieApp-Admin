import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema(
  {
    isDefault: { type: Boolean, required: true, default: false },
    name: {
      en: { type: String, required: true },
      ar: { type: String, required: true },
    },
    description: {
      en: String,
      ar: String,
    },
    logo: String,
    banner: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended", "Pending Approval"],
      default: "Pending Approval",
    },
    settings: {
      allowOnlineOrders: { type: Boolean, default: true },
      deliveryRadius: { type: Number, default: 10 }, // in kilometers
      minimumOrderAmount: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      operatingHours: {
        monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
        sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } },
      },
    },
    statistics: {
      totalProducts: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Shop = mongoose.model("Shop", ShopSchema);
export default Shop; 