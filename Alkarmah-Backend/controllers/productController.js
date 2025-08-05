import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  console.log(req.body);
  try {
    const product = new Product(req.body);
    await product.save();
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { shop, category, search, status, page = 1, limit = 20, minPrice, maxPrice  } = req.query;

    // Build query
    const query = {};
    
    if (shop) query.shop = shop;
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (search) {
      // Create a case-insensitive regex pattern for search
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
        { 'variants.name': { $regex: searchRegex } }
      ];
    }
    
    // Find products
    let productsQuery = Product.find(query)
      .populate("category", "name")
      .populate("shop", "name logo")
      .select("name description baseImage variants category shop status tags featured averageRating reviewCount createdBy")
      .sort({ featured: -1, createdAt: -1 });
    
    // Add pagination
    const skip = (page - 1) * limit;
    productsQuery = productsQuery.skip(skip).limit(parseInt(limit));
    
    const products = await productsQuery;

    if (!products || products.length === 0) {
    let notFoundReason = "No products found.";
    if (search) {
      notFoundReason = `No products found matching search term "${search}".`;
    } else if (shop) {
      notFoundReason = `No products found for the selected shop.`;
    } else if (category) {
      notFoundReason = `No products found in this category.`;
    }

    return res.status(404).json({
      success: false,
      message: notFoundReason
    });
  }

    // Filter by price range if specified
    let filteredProducts = products;
    if (minPrice || maxPrice) {
      filteredProducts = products.filter(product => {
        const priceRange = product.priceRange;
        if (!priceRange) return false;
        
        if (minPrice && priceRange.max < parseFloat(minPrice)) return false;
        if (maxPrice && priceRange.min > parseFloat(maxPrice)) return false;
        
        return true;
      });
    }
    
    // Transform products to include price range and default variant
    const transformedProducts = filteredProducts.map(product => {
      const productObj = product.toObject({ virtuals: true });
      const defaultVariant = product.getDefaultVariant();
      
      return {
        ...productObj,
        priceRange: product.priceRange,
        totalStock: product.totalStock,
        defaultVariant: defaultVariant ? {
          _id: defaultVariant._id,
          name: defaultVariant.name,
          price: defaultVariant.price,
          originalPrice: defaultVariant.originalPrice,
          stock: defaultVariant.stock,
          attributes: defaultVariant.attributes
        } : null
      };
    });

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: transformedProducts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transformedProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name description")
      .populate("shop", "name description logo contact")
      .populate("createdBy", "name email");
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // Transform product to include computed fields
    const productObj = product.toObject({ virtuals: true });
    const defaultVariant = product.getDefaultVariant();

    const transformedProduct = {
      ...productObj,
      priceRange: product.priceRange,
      totalStock: product.totalStock,
      defaultVariant: defaultVariant ? {
        _id: defaultVariant._id,
        name: defaultVariant.name,
        price: defaultVariant.price,
        originalPrice: defaultVariant.originalPrice,
        stock: defaultVariant.stock,
        attributes: defaultVariant.attributes,
        images: defaultVariant.images,
        sku: defaultVariant.sku
      } : null,
      allVariants: product.variants.filter(v => v.status === 'Active').map(variant => ({
        _id: variant._id,
        name: variant.name,
        price: variant.price,
        originalPrice: variant.originalPrice,
        stock: variant.stock,
        attributes: variant.attributes,
        images: variant.images,
        sku: variant.sku,
        isDefault: variant.isDefault
      }))
    };
    
    return res.status(200).json({
      success: true,
      data: transformedProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Add variant to existing product
export const addProductVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const variantData = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Generate unique SKU if not provided
    if (!variantData.sku) {
      variantData.sku = `${product.shop}-${productId}-${Date.now()}`;
    }

    // Add variant to product
    product.variants.push(variantData);
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Variant added successfully",
      data: product.variants[product.variants.length - 1]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add variant",
      error: error.message
    });
  }
};

// Update product variant
export const updateProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const updateData = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }

    // Update variant fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id') {
        variant[key] = updateData[key];
      }
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Variant updated successfully",
      data: variant
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update variant",
      error: error.message
    });
  }
};

// Delete product variant
export const deleteProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Check if this is the last variant
    if (product.variants.length <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the last variant. Product must have at least one variant."
      });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }

    // If deleting default variant, make another variant default
    if (variant.isDefault) {
      const otherVariant = product.variants.find(v => v._id.toString() !== variantId && v.status === 'Active');
      if (otherVariant) {
        otherVariant.isDefault = true;
      }
    }

    // Remove variant
    product.variants.pull(variantId);
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete variant",
      error: error.message
    });
  }
};

// Get specific variant details
export const getProductVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const variant = product.getVariantById(variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        product: {
          _id: product._id,
          name: product.name,
          description: product.description,
          baseImage: product.baseImage
        },
        variant: {
          _id: variant._id,
          name: variant.name,
          price: variant.price,
          originalPrice: variant.originalPrice,
          stock: variant.stock,
          attributes: variant.attributes,
          images: variant.images,
          sku: variant.sku,
          status: variant.status,
          isDefault: variant.isDefault
        }
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch variant",
      error: error.message
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { shop, category, search, status, page = 1, limit = 20, minPrice, maxPrice } = req.query;
    
    // Build query
    const query = {};
    
    if (shop) query.shop = shop;
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (search) {
      // Create a case-insensitive regex pattern for search
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
        { 'variants.name': { $regex: searchRegex } }
      ];
    }
    
    // Find products
    let productsQuery = Product.find(query)
      .populate("category", "name")
      .populate("shop", "name logo")
      .select("name baseImage category shop status averageRating reviewCount createdBy featured")
      .sort({ featured: -1, createdAt: -1 });
    
    // Add pagination
    const skip = (page - 1) * limit;
    productsQuery = productsQuery.skip(skip).limit(parseInt(limit));
    
    const products = await productsQuery;

    if (!products || products.length === 0) {
    let notFoundReason = "No products found.";
    if (search) {
      notFoundReason = `No products found matching search term "${search}".`;
    } else if (shop) {
      notFoundReason = `No products found for the selected shop.`;
    } else if (category) {
      notFoundReason = `No products found in this category.`;
    }

    return res.status(404).json({
      success: false,
      message: notFoundReason
    });
  }

    // Filter by price range if specified
    let filteredProducts = products;
    if (minPrice || maxPrice) {
      filteredProducts = products.filter(product => {
        const priceRange = product.priceRange;
        if (!priceRange) return false;
        
        if (minPrice && priceRange.max < parseFloat(minPrice)) return false;
        if (maxPrice && priceRange.min > parseFloat(maxPrice)) return false;
        
        return true;
      });
    }
    
    // Transform products to include price range and default variant
    const transformedProducts = filteredProducts.map(product => {
      const productObj = product.toObject({ virtuals: true });
      const defaultVariant = product.getDefaultVariant();
      
      return {
        ...productObj,
        priceRange: product.priceRange,
        totalStock: product.totalStock,
        defaultVariant: defaultVariant ? {
          _id: defaultVariant._id,
          name: defaultVariant.name,
          price: defaultVariant.price,
          originalPrice: defaultVariant.originalPrice,
          stock: defaultVariant.stock,
          attributes: defaultVariant.attributes
        } : null
      };
    });

    const total = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: transformedProducts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transformedProducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};