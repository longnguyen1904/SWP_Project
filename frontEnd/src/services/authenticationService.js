import { removeToken } from "./localStorageService";
import { getToken } from "./localStorageService";
export const logOut = () => {
  removeToken();
};



// services/authService.js


export const isAuthenticated = () => {
  return !!getToken();
};