import axios from "axios";
import { APIConfig } from "../configurations/configuration";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: APIConfig.baseURL,
  timeout: APIConfig.timeout,
  headers: APIConfig.headers,
});

// Request interceptor to add X-User-Id header
api.interceptors.request.use(
  (config) => {
    // Get user ID from localStorage or context
    const userId = localStorage.getItem("userId") || "1"; // Default to 1 for demo
    if (userId) {
      config.headers["X-User-Id"] = userId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication API endpoints (Phase 1)
export const authAPI = {
  register: (userData) => {
    return api.post("/api/auth/register", userData);
  },

  login: (credentials) => {
    return api.post("/api/auth/login", credentials);
  },
};

// Vendor API endpoints
export const vendorAPI = {
  // Vendor Registration (UC01)
  registerVendor: (vendorData) => {
    return api.post("/api/vendors/register", vendorData);
  },

  // Get vendor status
  getVendorStatus: (vendorId) => {
    return api.get(`/api/vendors/${vendorId}/status`);
  },

  // Upload vendor documents
  uploadDocuments: (vendorId, formData) => {
    return api.post(`/api/vendors/${vendorId}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Product Management (UC02, UC03)
  createProduct: (productData) => {
    return api.post("/api/vendor/products", productData);
  },

  getVendorProducts: (params = {}) => {
    return api.get("/api/vendor/products", { params });
  },

  getProduct: (productId) => {
    return api.get(`/api/products/${productId}`);
  },

  updateProduct: (productId, productData) => {
    return api.put(`/api/products/${productId}`, productData);
  },

  deleteProduct: (productId) => {
    return api.delete(`/api/products/${productId}`);
  },

  // Product Images
  uploadProductImage: (productId, imageData) => {
    return api.post(`/api/vendor/products/${productId}/images`, imageData);
  },

  // Product Versions
  createProductVersion: (productId, versionData) => {
    return api.post(`/api/vendor/products/${productId}/versions`, versionData);
  },

  // License Tiers
  createLicenseTier: (productId, tierData) => {
    return api.post(`/api/vendor/products/${productId}/license-tiers`, tierData);
  },

  // Submit product for approval
  submitProduct: (productId) => {
    return api.post(`/api/vendor/products/${productId}/submit`);
  },
};

// Admin API endpoints
export const adminAPI = {
  // Vendor Management (Phase 3)
  getVendors: (status) => {
    const url = status ? `/api/admin/vendors?status=${status}` : "/api/admin/vendors";
    return api.get(url);
  },

  getVendorById: (vendorId) => {
    return api.get(`/api/admin/vendors/${vendorId}`);
  },

  verifyVendor: (vendorId, verificationData) => {
    return api.put(`/api/admin/vendors/${vendorId}/verify`, verificationData);
  },

  // Product Management (UC13)
  approveProduct: (productId) => {
    return api.put(`/api/admin/products/${productId}/approve`);
  },

  rejectProduct: (productId, reason) => {
    return api.put(`/api/admin/products/${productId}/reject`, { reason });
  },

  // User Management
  getAllUsers: () => {
    return api.get("/api/admin/users");
  },

  getUserById: (userId) => {
    return api.get(`/api/admin/users/${userId}`);
  },
};

// Customer API endpoints
export const customerAPI = {
  // Get products (UC11)
  getProducts: (params = {}) => {
    return api.get("/api/products", { params });
  },

  // Get product details (UC12)
  getProductDetails: (productId, params = {}) => {
    return api.get(`/api/products/${productId}`, { params });
  },

  // Get product reviews
  getProductReviews: (productId, params = {}) => {
    return api.get(`/api/products/${productId}/reviews`, { params });
  },

  // Add product review
  addProductReview: (productId, reviewData) => {
    return api.post(`/api/products/${productId}/reviews`, reviewData);
  },

  // Start free trial (UC15)
  startFreeTrial: (productId) => {
    return api.post("/api/trials/start", { productId });
  },

  // Checkout (UC14)
  createCheckout: (checkoutData) => {
    return api.post("/api/checkout", checkoutData);
  },

  confirmPayment: (paymentData) => {
    return api.post("/api/checkout/confirm", paymentData);
  },

  // Additional customer methods for marketplace
  searchProducts: (searchParams) => {
    return api.get("/api/products/search", { params: searchParams });
  },

  getProductById: (productId) => {
    return api.get(`/api/products/${productId}`);
  },

  purchaseProduct: (purchaseData) => {
    return api.post("/api/purchases", purchaseData);
  },

  requestTrial: (productId) => {
    return api.post(`/api/products/${productId}/trial`);
  },

  submitReview: (reviewData) => {
    return api.post("/api/reviews", reviewData);
  },

  addToWishlist: (productId) => {
    return api.post(`/api/wishlist/${productId}`);
  },

  getProductReviews: (productId) => {
    return api.get(`/api/products/${productId}/reviews`);
  },
};

export default api;
