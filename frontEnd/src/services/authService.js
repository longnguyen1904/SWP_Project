import { getToken, removeToken } from "./localStorageService";

export const isAuthenticated = () => {
  return !!getToken();
};

export const logOut = () => {
  removeToken();
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("authChanged"));
};