import axios from "axios";
// 1. Nhập hàm getToken từ file localStorage của ông
import { getToken } from "./localStorageService"; 

const apiClient = axios.create({
  baseURL: "http://localhost:8081/api", // Địa chỉ Back-End của ông
  timeout: 10000,
});

/**
 * AXIOS INTERCEPTOR (Người gác cổng)
 * Trước khi bất kỳ request nào được gửi đi, nó sẽ chạy qua hàm này
 */
apiClient.interceptors.request.use(
  (config) => {
    // 2. Lấy token từ localStorage thông qua hàm tiện ích
    const token = getToken();

    // 3. Nếu có token, thì "dán" nó vào Header Authorization
    if (token) {
      // Chuẩn là: Bearer <chuỗi_token>
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Xử lý lỗi nếu request gặp vấn đề trước khi gửi
    return Promise.reject(error);
  }
);

/**
 * Xử lý dữ liệu trả về (Optional)
 * Giúp ông không cần phải .data mỗi khi gọi API
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Nếu BE báo lỗi 401 (Token hết hạn hoặc sai), có thể tự động logout
    if (error.response && error.response.status === 401) {
        // removeToken(); 
        // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;