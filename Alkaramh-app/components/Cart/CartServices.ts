// cartService.ts
import { API_URL } from "../../api.json";

export const fetchCartItemsService = async (userId) => {
  const response = await fetch(`${API_URL}/cart/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  return response.json();
};

export const addToCartService = async (token, userId, productId, quantity, variantId) => {
  const response = await fetch(`${API_URL}/cart/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, productId, quantity, variantId }),
  });
  return response.json();
};

export const removeFromCartService = async (userId, productId, variantId) => {
  const response = await fetch(`${API_URL}/cart/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, variantId }),
  });
  return response;
};

export const updateCartQuantityService = async (userId, productId, quantity, variantId) => {
  const response = await fetch(`${API_URL}/cart/update-quantity`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, quantity, variantId }),
  });
  return response;
};
