import { Router } from "express";
const router = Router();
import {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  addShopAdmin,
  removeShopAdmin,
  getShopStatistics,
  getUserShops,
  updateShopStatus
} from "../controllers/shopController.js";
import {
  verifyToken,
  requireSuperAdmin,
  requireShopAdmin,
  requireShopAccess,
  requireShopOwnership,
  optionalAuth
} from "../middleware/auth.js";

// Public routes (general first)
router.get("/", optionalAuth, getAllShops); // Public view of active shops

// Admin routes (require authentication)
router.post("/", verifyToken, createShop); // Create new shop

// Shop admin management (specific routes first)
router.post("/admin/add", verifyToken, requireShopOwnership, addShopAdmin);
router.post("/admin/remove", verifyToken, requireShopOwnership, removeShopAdmin);

// User-specific routes
router.get("/user/:userId", verifyToken, requireShopAdmin, getUserShops);

// Shop-specific routes with shopId parameter
router.get("/:shopId/statistics", verifyToken, requireShopAccess, getShopStatistics);
router.put("/:shopId/status", verifyToken, requireSuperAdmin, updateShopStatus);

// General ID routes (most generic last)
router.get("/:id", optionalAuth, getShopById); // Public shop details
router.put("/:id", verifyToken, requireShopOwnership, updateShop); // Update shop
router.delete("/:id", verifyToken, requireSuperAdmin, deleteShop); // Delete shop (super admin only)

export default router; 