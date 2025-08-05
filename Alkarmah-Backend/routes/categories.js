import { Router } from "express";
const router = Router();
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getProductsByCategory,
  getProductsByShopCategory,
} from "../controllers/categoryController.js";
import { getProducts } from "../controllers/productController.js";

// Specific routes first
router.post("/", createCategory);
router.get("/", getAllCategories);
router.post("/products", getProductsByCategory);
router.post("/shop/products", getProductsByShopCategory);

// Parameterized routes last
router.get("/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
