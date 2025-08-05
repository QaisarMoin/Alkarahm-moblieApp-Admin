import mongoose from "mongoose";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
const ObjectId = mongoose.Types.ObjectId;

// Create a new shop
export const createShop = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log(userId);
    
    
    // Check if user exists and can create shop
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Create shop
    const shopData = {
      ...req.body,
      owner: userId,
      admins: [userId]
    };
    
    const shop = new Shop(shopData);
    await shop.save();

    // Update user role to shop_admin if not already
    if (user.role === "customer") {
      user.role = "shop_admin";
      user.managedShops.push(shop._id);
      await user.save();
    }

    if(!user.managedShops){
      user.managedShops.push(shop._id);
    }

    return res.status(201).json({
      success: true,
      message: "Shop created successfully",
      data: shop
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create shop",
      error: error.message
    });
  }
};

// Get all shops (public endpoint with optional auth for personalized features)
export const getAllShops = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      previouslyOrdered, 
      minRating, 
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isDefault // <- Add this
    } = req.query;
    
    const userId = req.user?._id;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { "name.en": { $regex: search, $options: "i" } },
        { "name.ar": { $regex: search, $options: "i" } },
        { "contact.email": { $regex: search, $options: "i" } }
      ];
    }

    if (minRating || maxRating) {
      query["statistics.rating"] = {};
      if (minRating) {
        query["statistics.rating"].$gte = parseFloat(minRating);
      }
      if (maxRating) {
        query["statistics.rating"].$lte = parseFloat(maxRating);
      }
    }

    if (isDefault === 'true') {
      query.isDefault = true;
    } else if (isDefault === 'false') {
      query.isDefault = false;
    }

    if (previouslyOrdered === 'true' && userId) {
      const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      const userOrders = await Order.find({ user: userObjectId }).distinct('shop');
      query._id = { $in: userOrders };
    } else if (previouslyOrdered === 'false' && userId) {
      const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
      const userOrders = await Order.find({ user: userObjectId }).distinct('shop');
      query._id = { $nin: userOrders };
    }

    const sortObj = {};
    if (sortBy === 'rating') {
      sortObj['statistics.rating'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sortObj['name.en'] = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'orders') {
      sortObj['statistics.totalOrders'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const shops = await Shop.find(query)
      .populate("owner", "name email")
      .populate("admins", "name email")
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Shop.countDocuments(query);

    let shopsWithOrderHistory = shops;
    if (userId) {
      const userOrderCounts = await Order.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$shop", orderCount: { $sum: 1 }, lastOrderDate: { $max: "$createdAt" } } }
      ]);

      const orderHistoryMap = userOrderCounts.reduce((acc, item) => {
        acc[item._id.toString()] = {
          orderCount: item.orderCount,
          lastOrderDate: item.lastOrderDate
        };
        return acc;
      }, {});

      shopsWithOrderHistory = shops.map(shop => {
        const shopObj = shop.toObject();
        const orderHistory = orderHistoryMap[shop._id.toString()];
        return {
          ...shopObj,
          userOrderHistory: orderHistory || { orderCount: 0, lastOrderDate: null }
        };
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shops fetched successfully",
      data: shopsWithOrderHistory,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      filters: {
        status,
        search,
        previouslyOrdered,
        minRating,
        maxRating,
        sortBy,
        sortOrder,
        isDefault
      },
      authenticated: !!userId
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shops",
      error: error.message
    });
  }
};


// Get shop by ID
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate("owner", "name email profile")
      .populate("admins", "name email profile");
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shop",
      error: error.message
    });
  }
};

// Update shop
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shop updated successfully",
      data: shop
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update shop",
      error: error.message
    });
  }
};

// Delete shop
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    // Remove shop reference from users
    await User.updateMany(
      { managedShops: shop._id },
      { $pull: { managedShops: shop._id } }
    );

    return res.status(200).json({
      success: true,
      message: "Shop deleted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete shop",
      error: error.message
    });
  }
};

// Add admin to shop
export const addShopAdmin = async (req, res) => {
  try {
    const { shopId, userId } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is already admin
    if (shop.admins.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already an admin of this shop"
      });
    }

    // Add user as admin
    shop.admins.push(userId);
    await shop.save();

    // Update user role and managed shops
    if (user.role === "customer") {
      user.role = "shop_admin";
    }
    if (!user.managedShops.includes(shopId)) {
      user.managedShops.push(shopId);
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Admin added successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add admin",
      error: error.message
    });
  }
};

// Remove admin from shop
export const removeShopAdmin = async (req, res) => {
  try {
    const { shopId, userId } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    // Don't remove owner
    if (shop.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove shop owner from admins"
      });
    }

    // Remove user from shop admins
    shop.admins = shop.admins.filter(adminId => adminId.toString() !== userId);
    await shop.save();

    // Update user
    const user = await User.findById(userId);
    if (user) {
      user.managedShops = user.managedShops.filter(sId => sId.toString() !== shopId);
      
      // If user has no more shops, change role back to customer
      if (user.managedShops.length === 0 && user.role === "shop_admin") {
        user.role = "customer";
      }
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Admin removed successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove admin",
      error: error.message
    });
  }
};

// Get shop statistics
export const getShopStatistics = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Get product count
    const totalProducts = await Product.countDocuments({ shop: shopId });
    
    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { shop: shopId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.totalAmount" },
          averageOrderValue: { $avg: "$pricing.totalAmount" }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    // Update shop statistics
    await Shop.findByIdAndUpdate(shopId, {
      "statistics.totalProducts": totalProducts,
      "statistics.totalOrders": stats.totalOrders,
      "statistics.totalRevenue": stats.totalRevenue
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        averageOrderValue: stats.averageOrderValue
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shop statistics",
      error: error.message
    });
  }
};

// Get shops by user (for shop admins)
export const getUserShops = async (req, res) => {
  try {
    const { userId } = req.params;
    // console.log(userId);
    

    const user = await User.findById(userId).populate({
      path: "managedShops",
      select: "name description logo status statistics banner address contact settings"
    });

// console.log(user);


    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(user.managedShops);
    

    return res.status(200).json({
      success: true,
      data: user.managedShops
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user shops",
      error: error.message
    });
  }
};

// Approve/Reject shop (super admin only)
export const updateShopStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status, notes } = req.body;

    const shop = await Shop.findByIdAndUpdate(
      shopId,
      { status },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Shop ${status.toLowerCase()} successfully`,
      data: shop
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update shop status",
      error: error.message
    });
  }
}; 