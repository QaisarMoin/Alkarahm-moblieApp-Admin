import Product from "../models/Product.js";
import Shop from "../models/Shop.js";

// Search products and shops
export const search = async (req, res) => {
  try {
    const { 
      query: searchQuery, 
      type = "all", // "products", "shops", or "all"
      page = 1, 
      limit = 20,
      // Product-specific filters
      category,
      shop,
      minPrice,
      maxPrice,
      // Shop-specific filters
      city,
      status = "Active"
    } = req.query;

    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const results = {};
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Search Products
    if (type === "products" || type === "all") {
      // First, try to find perfect matches
      const perfectProductQuery = {
        $and: [
          {
            $or: [
              { "name.en": { $regex: `^${searchQuery}$`, $options: "i" } },
              { "name.ar": { $regex: `^${searchQuery}$`, $options: "i" } },
              { tags: { $in: [new RegExp(`^${searchQuery}$`, "i")] } },
              { "specifications.brand": { $regex: `^${searchQuery}$`, $options: "i" } },
              { "specifications.model": { $regex: `^${searchQuery}$`, $options: "i" } }
            ]
          },
          { status: { $ne: "Hidden" } }
        ]
      };

      // Add additional filters to perfect match query
      if (category) {
        perfectProductQuery.$and.push({ category });
      }
      if (shop) {
        perfectProductQuery.$and.push({ shop });
      }

      const perfectProducts = await Product.find(perfectProductQuery)
        .populate("category", "name")
        .populate("shop", "name logo status")
        .select("name description baseImage variants category shop status tags featured averageRating reviewCount")
        .sort({ 
          featured: -1, 
          averageRating: -1,
          reviewCount: -1,
          createdAt: -1 
        })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 10 : limitNum);

      let productsToReturn = perfectProducts;
      let totalProductsCount = perfectProducts.length;

      // If no perfect matches found, fall back to fuzzy search
      if (perfectProducts.length === 0) {
        const fuzzyProductQuery = {
          $and: [
            {
              $or: [
                { "name.en": { $regex: searchQuery, $options: "i" } },
                { "name.ar": { $regex: searchQuery, $options: "i" } },
                { "description.en": { $regex: searchQuery, $options: "i" } },
                { "description.ar": { $regex: searchQuery, $options: "i" } },
                { tags: { $in: [new RegExp(searchQuery, "i")] } },
                { "specifications.brand": { $regex: searchQuery, $options: "i" } },
                { "specifications.model": { $regex: searchQuery, $options: "i" } }
              ]
            },
            { status: { $ne: "Hidden" } }
          ]
        };

        // Add additional filters to fuzzy query
        if (category) {
          fuzzyProductQuery.$and.push({ category });
        }
        if (shop) {
          fuzzyProductQuery.$and.push({ shop });
        }

        productsToReturn = await Product.find(fuzzyProductQuery)
          .populate("category", "name")
          .populate("shop", "name logo status")
          .select("name description baseImage variants category shop status tags featured averageRating reviewCount")
          .sort({ 
            featured: -1, 
            averageRating: -1,
            reviewCount: -1,
            createdAt: -1 
          })
          .skip(type === "all" ? 0 : skip)
          .limit(type === "all" ? 10 : limitNum);

        totalProductsCount = await Product.countDocuments(fuzzyProductQuery);
      } else {
        // Count total perfect matches for pagination
        totalProductsCount = await Product.countDocuments(perfectProductQuery);
      }

      // Filter by price range if specified
      let filteredProducts = productsToReturn;
      if (minPrice || maxPrice) {
        filteredProducts = productsToReturn.filter(product => {
          const priceRange = product.priceRange;
          if (!priceRange) return false;
          
          if (minPrice && priceRange.max < parseFloat(minPrice)) return false;
          if (maxPrice && priceRange.min > parseFloat(maxPrice)) return false;
          
          return true;
        });
      }

      // Transform products to include computed fields
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
      
      results.products = {
        data: transformedProducts,
        count: transformedProducts.length,
        total: totalProductsCount,
        isPerfectMatch: perfectProducts.length > 0,
        ...(type === "products" && {
          page: parseInt(page),
          pages: Math.ceil(totalProductsCount / limitNum)
        })
      };
    }

    // Search Shops
    if (type === "shops" || type === "all") {
      // First, try to find perfect matches for shops
      const perfectShopQuery = {
        $and: [
          {
            $or: [
              { "name.en": { $regex: `^${searchQuery}$`, $options: "i" } },
              { "name.ar": { $regex: `^${searchQuery}$`, $options: "i" } },
              { "contact.email": { $regex: `^${searchQuery}$`, $options: "i" } },
              { "address.city": { $regex: `^${searchQuery}$`, $options: "i" } },
              { "address.state": { $regex: `^${searchQuery}$`, $options: "i" } }
            ]
          },
          { status }
        ]
      };

      // Add city filter to perfect match query
      if (city) {
        perfectShopQuery.$and.push({ "address.city": { $regex: city, $options: "i" } });
      }

      const perfectShops = await Shop.find(perfectShopQuery)
        .populate("owner", "name email")
        .select("name description logo banner address contact status statistics settings")
        .sort({ 
          "statistics.rating": -1,
          "statistics.totalOrders": -1,
          createdAt: -1 
        })
        .skip(type === "all" ? 0 : skip)
        .limit(type === "all" ? 10 : limitNum);

      let shopsToReturn = perfectShops;
      let totalShopsCount = perfectShops.length;

      // If no perfect matches found, fall back to fuzzy search
      if (perfectShops.length === 0) {
        const fuzzyShopQuery = {
          $and: [
            {
              $or: [
                { "name.en": { $regex: searchQuery, $options: "i" } },
                { "name.ar": { $regex: searchQuery, $options: "i" } },
                { "description.en": { $regex: searchQuery, $options: "i" } },
                { "description.ar": { $regex: searchQuery, $options: "i" } },
                { "contact.email": { $regex: searchQuery, $options: "i" } },
                { "address.city": { $regex: searchQuery, $options: "i" } },
                { "address.state": { $regex: searchQuery, $options: "i" } }
              ]
            },
            { status }
          ]
        };

        // Add city filter to fuzzy query
        if (city) {
          fuzzyShopQuery.$and.push({ "address.city": { $regex: city, $options: "i" } });
        }

        shopsToReturn = await Shop.find(fuzzyShopQuery)
          .populate("owner", "name email")
          .select("name description logo banner address contact status statistics settings")
          .sort({ 
            "statistics.rating": -1,
            "statistics.totalOrders": -1,
            createdAt: -1 
          })
          .skip(type === "all" ? 0 : skip)
          .limit(type === "all" ? 10 : limitNum);

        totalShopsCount = await Shop.countDocuments(fuzzyShopQuery);
      } else {
        // Count total perfect matches for pagination
        totalShopsCount = await Shop.countDocuments(perfectShopQuery);
      }
      
      results.shops = {
        data: shopsToReturn,
        count: shopsToReturn.length,
        total: totalShopsCount,
        isPerfectMatch: perfectShops.length > 0,
        ...(type === "shops" && {
          page: parseInt(page),
          pages: Math.ceil(totalShopsCount / limitNum)
        })
      };
    }

    // Check if no results found
    const hasResults = (results.products?.count > 0) || (results.shops?.count > 0);
    
    if (!hasResults) {
      return res.status(404).json({
        success: false,
        message: `No ${type === "all" ? "results" : type} found for "${searchQuery}"`
      });
    }

    return res.status(200).json({
      success: true,
      query: searchQuery,
      type,
      ...results
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message
    });
  }
};

// Get search suggestions (autocomplete)
export const getSearchSuggestions = async (req, res) => {
  try {
    const { query: searchQuery, limit = 10 } = req.query;

    if (!searchQuery || searchQuery.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const suggestions = {
      products: [],
      shops: [],
      categories: []
    };

    // Product suggestions - prioritize perfect matches
    const perfectProductSuggestions = await Product.find({
      $and: [
        {
          $or: [
            { "name.en": { $regex: `^${searchQuery}$`, $options: "i" } },
            { "name.ar": { $regex: `^${searchQuery}$`, $options: "i" } },
            { tags: { $in: [new RegExp(`^${searchQuery}$`, "i")] } }
          ]
        },
        { status: { $ne: "Hidden" } }
      ]
    })
    .select("name")
    .limit(parseInt(limit))
    .sort({ featured: -1, averageRating: -1 });

    if (perfectProductSuggestions.length > 0) {
      suggestions.products = perfectProductSuggestions.map(product => ({
        id: product._id,
        name: product.name,
        type: "product",
        isPerfectMatch: true
      }));
    } else {
      // Fall back to fuzzy search for suggestions
      const fuzzyProductSuggestions = await Product.find({
        $and: [
          {
            $or: [
              { "name.en": { $regex: searchQuery, $options: "i" } },
              { "name.ar": { $regex: searchQuery, $options: "i" } },
              { tags: { $in: [new RegExp(searchQuery, "i")] } }
            ]
          },
          { status: { $ne: "Hidden" } }
        ]
      })
      .select("name")
      .limit(parseInt(limit))
      .sort({ featured: -1, averageRating: -1 });

      suggestions.products = fuzzyProductSuggestions.map(product => ({
        id: product._id,
        name: product.name,
        type: "product",
        isPerfectMatch: false
      }));
    }

    // Shop suggestions - prioritize perfect matches
    const perfectShopSuggestions = await Shop.find({
      $and: [
        {
          $or: [
            { "name.en": { $regex: `^${searchQuery}$`, $options: "i" } },
            { "name.ar": { $regex: `^${searchQuery}$`, $options: "i" } }
          ]
        },
        { status: "Active" }
      ]
    })
    .select("name")
    .limit(parseInt(limit))
    .sort({ "statistics.rating": -1 });

    if (perfectShopSuggestions.length > 0) {
      suggestions.shops = perfectShopSuggestions.map(shop => ({
        id: shop._id,
        name: shop.name,
        type: "shop",
        isPerfectMatch: true
      }));
    } else {
      // Fall back to fuzzy search for suggestions
      const fuzzyShopSuggestions = await Shop.find({
        $and: [
          {
            $or: [
              { "name.en": { $regex: searchQuery, $options: "i" } },
              { "name.ar": { $regex: searchQuery, $options: "i" } }
            ]
          },
          { status: "Active" }
        ]
      })
      .select("name")
      .limit(parseInt(limit))
      .sort({ "statistics.rating": -1 });

      suggestions.shops = fuzzyShopSuggestions.map(shop => ({
        id: shop._id,
        name: shop.name,
        type: "shop",
        isPerfectMatch: false
      }));
    }

    // Popular search terms (you can implement this based on search history)
    const popularTerms = [
      "electronics", "clothing", "food", "books", "home", "beauty",
      "sports", "toys", "automotive", "health"
    ];

    suggestions.popular = popularTerms
      .filter(term => term.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 5)
      .map(term => ({ term, type: "popular" }));

    return res.status(200).json({
      success: true,
      query: searchQuery,
      suggestions
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get suggestions",
      error: error.message
    });
  }
};

// Advanced search with filters
export const advancedSearch = async (req, res) => {
  try {
    const {
      query: searchQuery,
      type = "products",
      page = 1,
      limit = 20,
      sortBy = "relevance", // relevance, price_asc, price_desc, rating, newest
      // Product filters
      category,
      shop,
      minPrice,
      maxPrice,
      inStock = true,
      featured,
      minRating,
      // Shop filters
      city,
      deliveryRadius,
      minOrderAmount
    } = req.query;

    const results = {};
    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    if (type === "products") {
      let productQuery = {
        status: { $ne: "Hidden" }
      };
      let isPerfectMatch = false;

      // Add search query if provided
      if (searchQuery && searchQuery.trim() !== "") {
        // First try perfect match
        const perfectMatchQuery = {
          ...productQuery,
          $or: [
            { "name.en": { $regex: `^${searchQuery}$`, $options: "i" } },
            { "name.ar": { $regex: `^${searchQuery}$`, $options: "i" } },
            { tags: { $in: [new RegExp(`^${searchQuery}$`, "i")] } }
          ]
        };

        const perfectMatchCount = await Product.countDocuments(perfectMatchQuery);
        
        if (perfectMatchCount > 0) {
          productQuery = perfectMatchQuery;
          isPerfectMatch = true;
        } else {
          // Fall back to fuzzy search
          productQuery.$or = [
            { "name.en": { $regex: searchQuery, $options: "i" } },
            { "name.ar": { $regex: searchQuery, $options: "i" } },
            { "description.en": { $regex: searchQuery, $options: "i" } },
            { "description.ar": { $regex: searchQuery, $options: "i" } },
            { tags: { $in: [new RegExp(searchQuery, "i")] } }
          ];
        }
      }

      // Add filters
      if (category) productQuery.category = category;
      if (shop) productQuery.shop = shop;
      if (featured !== undefined) productQuery.featured = featured === "true";
      if (minRating) productQuery.averageRating = { $gte: parseFloat(minRating) };

      // Build sort criteria
      let sortCriteria = {};
      switch (sortBy) {
        case "price_asc":
          sortCriteria = { "variants.price": 1 };
          break;
        case "price_desc":
          sortCriteria = { "variants.price": -1 };
          break;
        case "rating":
          sortCriteria = { averageRating: -1, reviewCount: -1 };
          break;
        case "newest":
          sortCriteria = { createdAt: -1 };
          break;
        default: // relevance
          sortCriteria = { featured: -1, averageRating: -1, reviewCount: -1 };
      }

      const products = await Product.find(productQuery)
        .populate("category", "name")
        .populate("shop", "name logo")
        .select("name description baseImage variants category shop status tags featured averageRating reviewCount")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum);

      // Filter by price range and stock
      let filteredProducts = products.filter(product => {
        // Stock filter
        if (inStock === "true" && product.totalStock === 0) return false;
        
        // Price filter
        if (minPrice || maxPrice) {
          const priceRange = product.priceRange;
          if (!priceRange) return false;
          
          if (minPrice && priceRange.max < parseFloat(minPrice)) return false;
          if (maxPrice && priceRange.min > parseFloat(maxPrice)) return false;
        }
        
        return true;
      });

      // Transform products
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

      const totalProducts = await Product.countDocuments(productQuery);
      
      results.products = {
        data: transformedProducts,
        count: transformedProducts.length,
        total: totalProducts,
        page: parseInt(page),
        pages: Math.ceil(totalProducts / limitNum),
        sortBy,
        isPerfectMatch
      };
    }

    if (type === "shops") {
      let shopQuery = {
        status: "Active"
      };
      let isPerfectMatch = false;

      // Add search query if provided
      if (searchQuery && searchQuery.trim() !== "") {
        // First try perfect match
        const perfectMatchQuery = {
          ...shopQuery,
          $or: [
            { "name.en": { $regex: `^${searchQuery}$`, $options: "i" } },
            { "name.ar": { $regex: `^${searchQuery}$`, $options: "i" } }
          ]
        };

        const perfectMatchCount = await Shop.countDocuments(perfectMatchQuery);
        
        if (perfectMatchCount > 0) {
          shopQuery = perfectMatchQuery;
          isPerfectMatch = true;
        } else {
          // Fall back to fuzzy search
          shopQuery.$or = [
            { "name.en": { $regex: searchQuery, $options: "i" } },
            { "name.ar": { $regex: searchQuery, $options: "i" } },
            { "description.en": { $regex: searchQuery, $options: "i" } },
            { "description.ar": { $regex: searchQuery, $options: "i" } }
          ];
        }
      }

      // Add filters
      if (city) shopQuery["address.city"] = { $regex: city, $options: "i" };
      if (deliveryRadius) shopQuery["settings.deliveryRadius"] = { $gte: parseFloat(deliveryRadius) };
      if (minOrderAmount) shopQuery["settings.minimumOrderAmount"] = { $lte: parseFloat(minOrderAmount) };

      const shops = await Shop.find(shopQuery)
        .populate("owner", "name")
        .select("name description logo address contact statistics settings")
        .sort({ "statistics.rating": -1, "statistics.totalOrders": -1 })
        .skip(skip)
        .limit(limitNum);

      const totalShops = await Shop.countDocuments(shopQuery);
      
      results.shops = {
        data: shops,
        count: shops.length,
        total: totalShops,
        page: parseInt(page),
        pages: Math.ceil(totalShops / limitNum),
        isPerfectMatch
      };
    }

    return res.status(200).json({
      success: true,
      query: searchQuery,
      type,
      filters: {
        category,
        shop,
        minPrice,
        maxPrice,
        inStock,
        featured,
        minRating,
        city,
        deliveryRadius,
        minOrderAmount
      },
      ...results
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Advanced search failed",
      error: error.message
    });
  }
};