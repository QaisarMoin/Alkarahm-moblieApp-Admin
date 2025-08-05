import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Shop from "../models/Shop.js";

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }
    

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET");
    const user = await User.findById(decoded.id).populate("managedShops");
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user deactivated"
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

// Check if user is super admin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Super admin access required"
    });
  }
  next();
};

// Check if user is shop admin or super admin
export const requireShopAdmin = (req, res, next) => {
  // console.log(req.user.role);
  
  if (!["shop_admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }
  next();
};

// Check if user can manage specific shop
export const requireShopAccess = async (req, res, next) => {
  try {
    const shopId = req.params.shopId || req.body.shopId || req.query.shopId;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop ID required"
      });
    }

    // Super admin has access to all shops
    if (req.user.role === "super_admin") {
      req.shop = await Shop.findById(shopId);
      if (!req.shop) {
        return res.status(404).json({
          success: false,
          message: "Shop not found"
        });
      }
      return next();
    }

    // Check if shop admin has access to this specific shop
    if (req.user.role === "shop_admin") {
      const hasAccess = req.user.managedShops.some(
        shop => shop._id.toString() === shopId
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this shop"
        });
      }
      
      req.shop = await Shop.findById(shopId);
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Insufficient permissions"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking shop access",
      error: error.message
    });
  }
};

// Check if user owns or admins the shop
export const requireShopOwnership = async (req, res, next) => {
  try {
    const shopId = req.params.shopId || req.body.shopId;
    

    
    

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Shop ID required"
      });
    }

    const shop = await Shop.findById(shopId);
    console.log(req.user._id.toString(), "Qaisar Moin ");

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    // Super admin has access
    if (req.user.role === "super_admin") {
      req.shop = shop;
      return next();
    }

    // Check ownership or admin status
    const isOwner = shop.owner.toString() === req.user._id.toString();
    const isAdmin = shop.admins.includes(req.user._id);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Shop ownership or admin access required"
      });
    }

    req.shop = shop;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking shop ownership",
      error: error.message
    });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET");
      const user = await User.findById(decoded.id).populate("managedShops");
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Rate limiting for sensitive operations
export const rateLimit = (maxRequests = 10, windowMinutes = 15) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip + (req.user ? req.user._id : "anonymous");
    const now = Date.now();
    const windowStart = now - (windowMinutes * 60 * 1000);
    
    // Clean old requests
    const userRequests = requests.get(key) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
}; 