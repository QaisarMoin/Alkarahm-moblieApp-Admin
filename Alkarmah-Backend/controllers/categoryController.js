import Category from "../models/Categories.js";
import Product from "../models/Product.js";

export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().select(
      "_id name description image status shop createdBy"
    );
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};

export const getProductsByCategorys = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required in request body",
      });
    }

    // First check if category exists
    const categoryExists = await Category.findOne({
      $or: [{ "name.en": category }, { "name.ar": category }],
    });
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    console.log("yes")
    // Get all products with this category
    const products = await Product.find({ category }).select(
      "_id name description price image stock category status"
    );
    console.log(products);
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
      error: error.message,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.body;
  
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required in request body",
      });
    }
    
    // First check if category exists (searching in both English and Arabic names)
    const categoryExists = await Category.findOne({
      $or: [{ "name.en": category }, { "name.ar": category }],
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Use the ObjectId of the matched category
    const products = await Product.find({ category: categoryExists._id }).select(
      "_id name description averageRating baseImage stock category status isOnSale variants.price originalPrice"
    );

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
      error: error.message,
    });
  }
};

export const getProductsByShopCategory = async (req, res) => {
  try {
    const { category, shopId } = req.body;
    if (!category || !shopId) {
      return res.status(400).json({
        success: false,
        message: "Category and shopId are required in request body",
      });
    }
    
    // First check if category exists (searching in both English and Arabic names)
    const categoryExists = await Category.findOne({
      $or: [{ "name.en": category }, { "name.ar": category }],
    });

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Use the ObjectId of the matched category
    const products = await Product.find({ category: categoryExists._id, shop: shopId }).select(
      "_id name description averageRating baseImage stock category status isOnSale variants.price originalPrice"
    );
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
      error: error.message,
    });
  }
};
