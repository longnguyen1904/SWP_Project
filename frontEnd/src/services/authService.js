import { getToken, removeToken } from "./localStorageService";

export const isAuthenticated = () => {
  return !!getToken();
};

export const logOut = () => {
  removeToken();
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("vendorId");
  window.dispatchEvent(new Event("authChanged"));
};
