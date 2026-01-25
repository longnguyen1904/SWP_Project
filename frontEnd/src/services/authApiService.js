/**
 * Authentication API Service
 * 
 * Service này cung cấp các functions để gọi Authentication APIs
 * và xử lý response theo chuẩn ApiResponse<T>
 */

import apiClient, { handleApiResponse } from './apiService';
import { setToken } from './localStorageService';

/**
 * Đăng nhập
 * @param {Object} credentials - { identifier: string, password: string }
 * @returns {Promise<Object>} { success: boolean, data: LoginResponse, message: string }
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    const result = handleApiResponse(response);
    
    if (result.success) {
      // Lưu token vào localStorage
      if (result.data?.token) {
        setToken(result.data.token);
      }
      // Lưu user info vào localStorage (optional)
      if (result.data?.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }
    
    return result;
  } catch (error) {
    return handleApiResponse(error);
  }
};

/**
 * Đăng ký
 * @param {Object} userData - { email, username, password, fullName, roleID? }
 * @returns {Promise<Object>} { success: boolean, data: User, message: string, errors?: Object }
 */
export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    return handleApiResponse(response);
  } catch (error) {
    return handleApiResponse(error);
  }
};

/**
 * Đăng xuất (clear token và user info)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Lấy thông tin user hiện tại từ localStorage
 * @returns {Object|null} User object hoặc null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};
