import { getToken, removeToken } from "./localStorageService";


export const isAuthenticated = () => {
  const token = getToken();
  // Nâng cao: Có thể kiểm tra thêm xem token đã hết hạn (expired) chưa ở đây
  return !!token;
};


export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Đăng xuất: Xóa sạch dấu vết
 */
export const logOut = () => {
  removeToken();
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("vendorStatus");
  localStorage.removeItem("suspendReason");

  window.dispatchEvent(new Event("authChanged"));
};

/**
 * Kiểm tra xem User có quyền cụ thể nào đó không
 * Ví dụ: hasRole("ADMIN")
 */
export const hasRole = (roleName) => {
  const user = getCurrentUser();
  return user?.roleName === roleName;
};