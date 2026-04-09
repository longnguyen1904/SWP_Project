import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export const orderAPI = {

  // Hàm cũ giữ nguyên không đụng tới
  getUserOrders: async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.userID || user.userId || localStorage.getItem("userId");

    if (!userId) {
      console.error("User ID not found");
      return [];
    }
    const res = await axios.get(`${BASE_URL}/api/orders/user/${userId}/download-links`);
    return res.data;    
  },

  // 🔥 Hàm MỚI để load sản phẩm tạo Ticket
  getTicketProducts: async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.userID || user.userId || localStorage.getItem("userId");

    if (!userId) return [];
    
    const res = await axios.get(`${BASE_URL}/api/orders/user/${userId}/ticket-products`);
    return res.data;    
  }

};