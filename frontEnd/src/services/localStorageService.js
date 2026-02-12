// Key dùng để lưu JWT Token trong localStorage (phải khớp với Backend trả về)
export const KEY_TOKEN = "accessToken";

/**
 * Lưu JWT Token vào localStorage với key "accessToken"
 * @param {string} token - Chuỗi JWT từ API login
 */
export const setToken = (token) => {
  localStorage.setItem(KEY_TOKEN, token);
};

/**
 * Lấy JWT Token từ localStorage
 * @returns {string|null} Token hoặc null nếu chưa đăng nhập
 */
export const getToken = () => {
  return localStorage.getItem(KEY_TOKEN);
};

/**
 * Xóa Token khi đăng xuất
 */
export const removeToken = () => {
  localStorage.removeItem(KEY_TOKEN);
};
