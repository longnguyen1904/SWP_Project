/**
 * API Service - Centralized Axios configuration và error handling
 * 
 * Service này cung cấp:
 * 1. Axios instance với base URL và interceptors
 * 2. Helper functions để xử lý ApiResponse<T> từ Backend
 * 3. Error handling chuẩn cho toàn bộ ứng dụng
 */

import axios from 'axios';
import { getToken, removeToken } from './localStorageService';

// Base URL cho API
const API_BASE_URL = 'http://localhost:8080/api';

// Tạo Axios instance với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request Interceptor: Thêm token vào header nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý response và errors
apiClient.interceptors.response.use(
  (response) => {
    // Backend luôn trả về ApiResponse<T> trong response.data
    return response.data;
  },
  (error) => {
    // Xử lý lỗi từ Backend
    if (error.response) {
      // Backend trả về error với ApiResponse format
      const apiResponse = error.response.data;
      
      // Nếu là lỗi 401 Unauthorized, xóa token và redirect
      if (error.response.status === 401) {
        removeToken();
        // Có thể redirect đến login page ở đây
        // window.location.href = '/login';
      }
      
      // Trả về ApiResponse để component có thể xử lý
      return Promise.reject(apiResponse);
    } else if (error.request) {
      // Request được gửi nhưng không nhận được response (network error)
      return Promise.reject({
        code: 0,
        message: 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng.',
        result: null,
      });
    } else {
      // Lỗi khi setup request
      return Promise.reject({
        code: 500,
        message: 'Lỗi không xác định. Vui lòng thử lại sau.',
        result: null,
      });
    }
  }
);

/**
 * Helper function để xử lý ApiResponse
 * @param {Object} apiResponse - Response từ Backend (ApiResponse<T>)
 * @returns {Object} { success: boolean, data: T, message: string, errors: Object }
 */
export const handleApiResponse = (apiResponse) => {
  // Success code từ ErrorCode.SUCCESS = 2000
  if (apiResponse.code === 2000) {
    return {
      success: true,
      data: apiResponse.result,
      message: apiResponse.message,
      errors: null,
    };
  } else {
    // Kiểm tra nếu là validation errors (code 2001 và result là object với field errors)
    const isValidationError = 
      apiResponse.code === 2001 && 
      apiResponse.result && 
      typeof apiResponse.result === 'object' &&
      !Array.isArray(apiResponse.result);

    return {
      success: false,
      data: null,
      message: apiResponse.message,
      errors: isValidationError ? apiResponse.result : null,
      code: apiResponse.code,
    };
  }
};

/**
 * Helper function để extract error message
 * @param {Object} error - Error object từ catch block
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (error?.message) {
    return error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
};

/**
 * Helper function để extract validation errors
 * @param {Object} error - Error object từ catch block
 * @returns {Object|null} Object với field errors hoặc null
 */
export const getValidationErrors = (error) => {
  if (error?.result && typeof error.result === 'object' && !Array.isArray(error.result)) {
    return error.result;
  }
  return null;
};

export default apiClient;
