import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true ,sparse:true},
  password: String,
  fcmToken: String,
  role: {
    type: String,
    enum: ["customer", "shop_admin", "super_admin"],
    default: "customer"
  },
  // For shop admins
  managedShops: [{ type: mongoose.Schema.Types.ObjectId, ref: "Shop" }],
  // For customers
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      variant: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to specific variant
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true }, // Price at time of adding to cart
      shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
      addedAt: { type: Date, default: Date.now }
    },
  ],
  // User profile
  profile: {
    phone: {type:String,unique:true},
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    avatar: String,
  },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,

});

const User = mongoose.model("User", UserSchema);
export default User;