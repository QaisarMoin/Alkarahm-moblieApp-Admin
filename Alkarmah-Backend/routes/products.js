import { Router } from "express";
const router = Router();
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getAllProducts, 
  getProductById,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getProductVariant,
  getProducts,
} from "../controllers/productController.js";
import { verifyToken } from "../middleware/auth.js";

// Product routes (general)
router.post("/",createProduct);
router.get("/", getAllProducts);
router.get("/prod",getProducts);
router.get("/search", getAllProducts);  //Search route

// Variant routes (specific routes first)
router.post("/:productId/variants", verifyToken, addProductVariant);
router.get("/:productId/variants/:variantId", getProductVariant);
router.put("/:productId/variants/:variantId", verifyToken, updateProductVariant);
router.delete("/:productId/variants/:variantId", verifyToken, deleteProductVariant);

// Product routes (parameterized routes last)
router.get("/:id", getProductById);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

export default router;
