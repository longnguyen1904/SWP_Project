import { removeToken } from "./localStorageService";
import { getToken } from "./localStorageService";
export const logOut = () => {
  removeToken();
}


export const isAuthenticated = () => {
  return !!getToken();
};