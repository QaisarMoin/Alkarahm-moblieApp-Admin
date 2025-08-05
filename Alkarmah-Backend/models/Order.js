import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      variant: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to specific variant
      variantSnapshot: {
        name: {
          en: { type: String, required: true },
          ar: { type: String, required: true }
        },
        price: { type: Number, required: true },
        attributes: {
          size: String,
          color: String,
          weight: String,
          material: String,
        },
        sku: String
      }, // Snapshot of variant at time of order
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true }, // Price per unit at time of order
      subtotal: { type: Number, required: true },
    },
  ],
  pricing: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    country: { type: String, required: true },
    zipCode: String,
    phone: String,
    instructions: String,
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ["cash_on_delivery", "card", "bank_transfer", "wallet"],
      default: "cash_on_delivery"
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    transactionId: String,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "Out for Delivery", "delivered", "cancelled", "refunded"],
    default: "pending"
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  notes: String,
}, {
  timestamps: true,
});

const Order = mongoose.model("Order", OrderSchema);
export default Order;
