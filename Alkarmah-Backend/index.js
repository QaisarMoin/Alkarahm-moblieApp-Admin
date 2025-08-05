import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import cartRoutes from "./routes/cart.js";
import wishlistRoutes from "./routes/wishlist.js";
import categoryRoutes from "./routes/categories.js";
import shopRoutes from "./routes/shops.js";
import healthRoutes from "./routes/healthCheck.js";
import uploadFileRoute from "./routes/uploadFile.js"
import searchRoutes from "./routes/search.js"; 

const app = express();
import connectDb from "./Config/Connection.js";

// Middleware
app.use(cors({
  origin: ["https://alkarahm-admin.onrender.com","http://localhost:5173","https://admin.alkaramh.com"], 
  credentials: true
}));
app.use(json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to database
connectDb();

// Health check route (before auth)
app.use("/api", healthRoutes);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/search", searchRoutes);
app.use("/api", healthRoutes)
app.use("/api", uploadFileRoute);


// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
