# Alkarahm Backend API

E-commerce platform backend with multi-vendor shop support and comprehensive product management.

## Table of Contents
- [Authentication](#authentication)
- [Product APIs](#product-apis)
- [Shop APIs](#shop-apis)
- [Recent Updates](#recent-updates)

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

Some endpoints support optional authentication using the `optionalAuth` middleware, providing enhanced features for authenticated users while remaining accessible to public users.

## Product APIs

### Get All Products
**Endpoint:** `GET /api/products`

Enhanced search and filtering capabilities for product discovery.

#### Query Parameters:
- `search` - Search across product name, description, tags, and variant names (case-insensitive)
- `shop` - Filter by shop ID
- `category` - Filter by category ID
- `status` - Filter by product status (default excludes "Hidden" products)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

#### Example Requests:
```bash
# Search for products containing "wheat"
GET /api/products?search=wheat

# Search with price range
GET /api/products?search=organic&minPrice=10&maxPrice=50

# Filter by shop and category
GET /api/products?shop=64a1b2c3d4e5f6789&category=64a1b2c3d4e5f6790

# Combined search and filters
GET /api/products?search=premium&minPrice=20&shop=64a1b2c3d4e5f6789
```

#### Response Format:
```json
{
  "success": true,
  "count": 15,
  "total": 150,
  "page": 1,
  "pages": 8,
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "baseImage": "image_url",
      "priceRange": {
        "min": 10.99,
        "max": 25.99
      },
      "totalStock": 100,
      "defaultVariant": {
        "_id": "variant_id",
        "name": "Default Variant",
        "price": 15.99,
        "stock": 50
      },
      "category": {
        "_id": "category_id",
        "name": "Category Name"
      },
      "shop": {
        "_id": "shop_id",
        "name": "Shop Name",
        "logo": "shop_logo_url"
      }
    }
  ]
}
```

## Shop APIs

### Get All Shops
**Endpoint:** `GET /api/shops`

**Authentication:** Optional (uses `optionalAuth` middleware)

Enhanced filtering with user-specific features when authenticated.

#### Query Parameters:
- `search` - Search shop names (English/Arabic) and contact email
- `status` - Filter by shop status
- `previouslyOrdered` - Filter shops by user's order history (requires authentication)
  - `true` - Only shops where user has ordered before
  - `false` - Only shops where user has never ordered
- `minRating` - Minimum shop rating filter
- `maxRating` - Maximum shop rating filter
- `sortBy` - Sort field: `rating`, `name`, `orders`, `createdAt` (default)
- `sortOrder` - Sort direction: `asc` or `desc` (default)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

#### Example Requests:
```bash
# Public request (no authentication)
GET /api/shops?minRating=4.0&sortBy=rating&sortOrder=desc

# Authenticated request with user-specific filters
GET /api/shops?previouslyOrdered=true&minRating=3.5
Headers: { Authorization: "Bearer <jwt_token>" }

# Search shops with rating filter
GET /api/shops?search=grocery&minRating=4.0

# Get new shops (never ordered from)
GET /api/shops?previouslyOrdered=false&sortBy=rating
Headers: { Authorization: "Bearer <jwt_token>" }
```

#### Response Format:

**Unauthenticated Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "shop_id",
      "name": {
        "en": "Shop Name",
        "ar": "اسم المتجر"
      },
      "statistics": {
        "rating": 4.5,
        "totalOrders": 150,
        "totalRevenue": 5000
      }
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 48
  },
  "filters": {
    "minRating": "4.0",
    "sortBy": "rating",
    "sortOrder": "desc"
  },
  "authenticated": false
}
```

**Authenticated Response (includes user order history):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "shop_id",
      "name": {
        "en": "Shop Name", 
        "ar": "اسم المتجر"
      },
      "statistics": {
        "rating": 4.5,
        "totalOrders": 150,
        "totalRevenue": 5000
      },
      "userOrderHistory": {
        "orderCount": 3,
        "lastOrderDate": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 25
  },
  "filters": {
    "previouslyOrdered": "true",
    "minRating": "4.0",
    "sortBy": "rating",
    "sortOrder": "desc"
  },
  "authenticated": true
}
```

### Get Shop by ID
**Endpoint:** `GET /api/shops/:id`

**Authentication:** Optional

#### Response Format:
```json
{
  "success": true,
  "data": {
    "_id": "shop_id",
    "name": {
      "en": "Shop Name",
      "ar": "اسم المتجر"
    },
    "description": {
      "en": "Shop description",
      "ar": "وصف المتجر"
    },
    "owner": {
      "_id": "user_id",
      "name": "Owner Name",
      "email": "owner@example.com"
    },
    "statistics": {
      "rating": 4.5,
      "totalOrders": 150,
      "totalRevenue": 5000
    }
  }
}
```

## Recent Updates

### 🔍 Enhanced Product Search (Latest)
- **Multi-field search**: Search across product names, descriptions, tags, and variant names
- **Case-insensitive**: Works with any text case
- **Partial matching**: Find products with partial keywords
- **Regex-based**: No MongoDB text index required
- **Example**: Searching "whe" finds "wheat", "whole wheat", etc.

### 🏪 Enhanced Shop Filtering (Latest)
- **Token-based authentication**: Secure user identification via JWT tokens
- **Previously ordered filter**: Find shops based on user's order history
- **Rating filters**: Filter shops by minimum/maximum ratings
- **Advanced sorting**: Sort by rating, name, order count, or creation date
- **User order history**: Authenticated users see their order history with each shop
- **Optional authentication**: Public access maintained for non-authenticated users

### 🔐 Security Improvements
- **Removed userId from query params**: Prevents unauthorized data access
- **Token-based user identification**: Uses `req.user._id` from JWT
- **Optional authentication**: Enhanced features for authenticated users without breaking public access

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
