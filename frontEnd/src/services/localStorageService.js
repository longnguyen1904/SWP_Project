export const KEY_TOKEN = "accessToken";
export const KEY_USER = "user_info"; // Lưu thêm thông tin user

// --- QUẢN LÝ TOKEN ---
export const setToken = (token) => {
  localStorage.setItem(KEY_TOKEN, token);
};

export const getToken = () => {
  return localStorage.getItem(KEY_TOKEN);
};

export const removeToken = () => {
  localStorage.removeItem(KEY_TOKEN);
};

// --- QUẢN LÝ USER INFO (Mới) ---
// BE trả về Object, nhưng localStorage chỉ lưu String, nên phải dùng JSON.stringify
export const setUserInfo = (user) => {
  localStorage.setItem(KEY_USER, JSON.stringify(user));
};

export const getUserInfo = () => {
  const user = localStorage.getItem(KEY_USER);
  return user ? JSON.parse(user) : null;
};

// --- CLEAR TẤT CẢ (Khi Logout) ---
export const clearAll = () => {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
};