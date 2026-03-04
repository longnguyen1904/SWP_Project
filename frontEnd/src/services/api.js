import axios from "axios";
import { APIConfig } from "../configurations/configuration";

const api = axios.create({
  baseURL: APIConfig.baseURL,
  timeout: APIConfig.timeout,
  headers: APIConfig.headers,
});

api.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      config.headers["X-User-Id"] = userId;
    } else if (config.headers && config.headers["X-User-Id"]) {
      delete config.headers["X-User-Id"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post("/api/auth/register", userData),
  login: (credentials) => api.post("/api/auth/login", credentials),
};

export const vendorAPI = {
  registerVendor: (vendorData) => api.post("/api/vendors/register", vendorData),
  getVendorStatus: (vendorId) => api.get(`/api/vendors/${vendorId}/status`),
  uploadDocuments: (vendorId, formData) =>
    api.post(`/api/vendors/${vendorId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  createProduct: (productData) => api.post("/api/vendor/products", productData),
  getVendorProducts: (params = {}) => api.get("/api/vendor/products", { params }),
  getProduct: (productId) => api.get(`/api/products/${productId}`),
  updateProduct: (productId, productData) => api.put(`/api/products/${productId}`, productData),
  deleteProduct: (productId) => api.delete(`/api/products/${productId}`),

  uploadProductImage: (productId, imageData) => api.post(`/api/vendor/products/${productId}/images`, imageData),
  createProductVersion: (productId, versionData) => api.post(`/api/vendor/products/${productId}/versions`, versionData),
  createLicenseTier: (productId, tierData) => api.post(`/api/vendor/products/${productId}/license-tiers`, tierData),
  submitProduct: (productId) => api.post(`/api/vendor/products/${productId}/submit`),

  getProductVersions: (productId, params = {}) => api.get(`/api/vendor/products/${productId}/versions`, { params }),
  getProductLicenseTiers: (productId) => api.get(`/api/vendor/products/${productId}/license-tiers`),
  updateLicenseTier: (productId, tierId, tierData) =>
    api.put(`/api/vendor/products/${productId}/license-tiers/${tierId}`, tierData),
  deleteLicenseTier: (productId, tierId) =>
    api.delete(`/api/vendor/products/${productId}/license-tiers/${tierId}`),

  getWalletInfo: () => api.get("/api/vendor/wallet"),
  requestPayout: (payoutData) => api.post("/api/vendor/wallet/payout", payoutData),
};

export const adminAPI = {
  getVendors: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/admin/vendors?${queryString}` : "/api/admin/vendors";
    return api.get(url);
  },

  getVendorById: (vendorId) => api.get(`/api/admin/vendors/${vendorId}`),
  verifyVendor: (vendorId, verificationData) => api.put(`/api/admin/vendors/${vendorId}/verify`, verificationData),

  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/api/admin/products?${queryString}` : "/api/admin/products";
    return api.get(url);
  },

  reviewProduct: (productId, reviewData) => api.put(`/api/admin/products/${productId}/review`, reviewData),
  getAllUsers: () => api.get("/api/admin/users"),
  getUserById: (userId) => api.get(`/api/admin/users/${userId}`),
};

export const customerAPI = {};

export const uploadAPI = {
  uploadImage: (formData) =>
    api.post("/api/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadImages: (formData) =>
    api.post("/api/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadDocument: (formData) =>
    api.post("/api/upload/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
