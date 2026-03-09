import axios from "axios";
import { APIConfig } from "../configurations/configuration";

const api = axios.create({
  baseURL: APIConfig.baseURL,
  timeout: APIConfig.timeout || 10000,
  headers: APIConfig.headers || { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    const userId = user.userID ?? user.userId ?? localStorage.getItem("userId");
    if (userId) {
      config.headers["X-User-Id"] = String(userId);
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
  registerVendor: (data) => api.post("/api/vendors/register", data),
  getMe: () => api.get("/api/vendor/me"),
  createProduct: (productData) => api.post("/api/vendor/products", productData),
  getVendorProducts: (params = {}) => api.get("/api/vendor/products", { params }),
  getProduct: (productId) => api.get(`/api/vendor/products/${productId}`),
  updateProduct: (productId, data) => api.put(`/api/vendor/products/${productId}`, data),
  deleteProduct: (productId) => api.delete(`/api/vendor/products/${productId}`),
  uploadProductImage: (productId, imageData) =>
    api.post(`/api/vendor/products/${productId}/images`, imageData),
  deleteProductImage: (productId, imageId) =>
    api.delete(`/api/vendor/products/${productId}/images/${imageId}`),
  createProductVersion: (productId, versionData) =>
    api.post(`/api/vendor/products/${productId}/versions`, versionData),
  createLicenseTier: (productId, tierData) =>
    api.post(`/api/vendor/products/${productId}/license-tiers`, tierData),
  submitProduct: (productId) => api.post(`/api/vendor/products/${productId}/submit`),
  getDailyRevenue: (params) => api.get("/api/vendor/revenue/daily", { params }),
  exportRevenueCSV: (params) =>
    api.get("/api/vendor/revenue/export", { params, responseType: "blob" }),
};

function buildProductsQueryString(params) {
  const parts = [];
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  const qs = parts.join("&");
  return qs ? `?${qs}` : "";
}

export const customerAPI = {
  getProducts: (params = {}) => {
    const adapted = { ...params };
    if (Array.isArray(params.categoryIds) && params.categoryIds.length > 0) {
      adapted.categoryId = params.categoryIds[0];
    }
    if (Array.isArray(params.tags) && params.tags.length > 0) {
      adapted.tag = params.tags[0];
    }
    const queryString = buildProductsQueryString(adapted);
    return api.get(`/api/products${queryString}`);
  },
  getProductDetails: (productId) => api.get(`/api/products/${productId}`),
  getProductReviews: (productId, params = {}) =>
    api.get(`/api/products/${productId}/reviews`, { params }),
  getProductPurchased: (productId) => api.get(`/api/products/${productId}/purchased`),
  addProductReview: (productId, data) =>
    api.post(`/api/products/${productId}/reviews`, data),
  updateProductReview: (reviewId, data) => api.put(`/api/reviews/${reviewId}`, data),
  deleteProductReview: (reviewId) => api.delete(`/api/reviews/${reviewId}`),
  getCategories: () => api.get("/api/categories"),
  getTags: () => api.get("/api/tags"),
  createCheckout: (data) => api.post("/api/checkout/create", data),
};

export const uploadAPI = {
  uploadImage: (formData) =>
    api.post("/api/upload/image", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadDocument: (formData) =>
    api.post("/api/upload/document", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadInstaller: (formData) =>
    api.post("/api/upload/installer", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

export default api;
