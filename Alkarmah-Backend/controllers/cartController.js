import User from "../models/User.js";
import Product from "../models/Product.js";

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, variantId, quantity } = req.body;
    
    // Validate required fields
    if (!userId || !productId || !variantId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, productId, variantId, and quantity are required",
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if variant exists and has sufficient stock
    const variant = product.getVariantById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found",
      });
    }

    if (variant.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: "This product variant is not available",
      });
    }

    // Check if this exact variant already in cart
    const existingItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId && item.variant.toString() === variantId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if variant exists in cart
      const existingQty = parseInt(user.cart[existingItemIndex].quantity, 10);
      const addQty = parseInt(quantity, 10);
      const newQuantity = existingQty + addQty;

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: "Total quantity exceeds available stock",
        });
      }
      user.cart[existingItemIndex].quantity = newQuantity;
      user.cart[existingItemIndex].price = variant.price * newQuantity;
    } else {
      // Check stock before adding
      if (quantity > variant.stock) {
        return res.status(400).json({
          success: false,
          message: "Quantity exceeds available stock",
        });
      }

      // Add new item to cart
      user.cart.push({
        product: productId,
        variant: variantId,
        quantity,
        price: variant.price * quantity,
        shop: product.shop
      });
    }

    await user.save();

    // Get updated cart with populated product details
    const updatedUser = await User.findById(userId).populate({
      path: "cart.product",
      populate: {
        path: "shop",
        select: "name logo"
      }
    });

    // Transform cart to include variant details
    const transformedCart = updatedUser.cart.map(item => {
      const product = item.product;
      const variant = product.getVariantById(item.variant);
      
      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          baseImage: product.baseImage,
          shop: product.shop
        },
        variant: variant ? {
          _id: variant._id,
          name: variant.name,
          price: variant.price,
          attributes: variant.attributes,
          images: variant.images,
          stock: variant.stock
        } : null,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt
      };
    });

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: transformedCart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { userId, productId, variantId } = req.body;

    if (!userId || !productId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, productId, and variantId are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const initialLength = user.cart.length;
    user.cart = user.cart.filter(
      (item) => !(item.product.toString() === productId && item.variant.toString() === variantId)
    );

    if (user.cart.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Product variant not found in cart",
      });
    }

    await user.save();

    // Get updated cart with populated product details
    const updatedUser = await User.findById(userId).populate({
      path: "cart.product",
      populate: {
        path: "shop",
        select: "name logo"
      }
    });

    // Transform cart to include variant details
    const transformedCart = updatedUser.cart.map(item => {
      const product = item.product;
      const variant = product.getVariantById(item.variant);
      
      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          baseImage: product.baseImage,
          shop: product.shop
        },
        variant: variant ? {
          _id: variant._id,
          name: variant.name,
          price: variant.price,
          attributes: variant.attributes,
          images: variant.images,
          stock: variant.stock
        } : null,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt
      };
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: transformedCart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message,
    });
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, productId, quantity, variantId } = req.body;

    // Validate required fields
    if (!userId || !productId || !quantity || !variantId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: userId, productId, quantity, and variantId are required",
      });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    // Find the item in the user's cart
    const cartItemIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // Validate and calculate new price
    const unitPrice = parseFloat(product.variants[0].price);
    console.log(product, quantity);
    const qty = parseInt(quantity);
    if (isNaN(unitPrice) || isNaN(qty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price or quantity",
        error: "Invalid number format",
        data: {
          productId,
          variantId,
          quantity,
          unitPrice,
          qty,
        },
      });
    }

    // Update quantity and price
    user.cart[cartItemIndex].quantity = qty;
    user.cart[cartItemIndex].price = unitPrice * qty;

    // Save updated user
    await user.save();

    // Re-fetch cart with populated product details
    const updatedUser = await User.findById(userId).populate("cart.product");

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      data: updatedUser.cart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update cart quantity",
      error: error.message,
    });
  }
};


// Get user's cart
export const getCart = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId in request body",
      });
    }

    const user = await User.findById(userId).populate("cart.product");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user.cart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

// Clear user's cart
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.cart = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};
