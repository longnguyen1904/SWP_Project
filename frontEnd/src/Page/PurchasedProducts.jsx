import React, { useEffect, useState } from "react";
import { orderAPI } from "../services/orderApi.js";

function PurchasedProducts() {

  const [orders, setOrders] = useState([]);

  useEffect(() => {

    const loadOrders = async () => {

      try {

        const data = await orderAPI.getUserOrders();

        setOrders(data);

      } catch (error) {
        console.error("Failed to load orders:", error);
      }

    };

    loadOrders();

  }, []);

  const totalPrice = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );

  const formatDate = (dateData) => {
    if (!dateData) return "N/A";
    if (Array.isArray(dateData)) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(dateData[2])}/${pad(dateData[1])}/${dateData[0]} ${pad(dateData[3] || 0)}:${pad(dateData[4] || 0)}`;
    }
    const d = new Date(dateData);
    return !isNaN(d) ? d.toLocaleString('vi-VN') : String(dateData);
  };

  return (
    <div style={{
      padding: "40px",
      minHeight: "100vh",
      background: "linear-gradient(135deg,#1e1e2f,#2c2c3a)",
      color: "white"
    }}>

      <h2 style={{ marginBottom: "20px" }}>Purchased Products</h2>

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (

        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(8px)"
        }}>

          <thead>
            <tr style={{ background: "rgba(255,255,255,0.1)" }}>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Tier</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Purchase Date</th>
              <th style={thStyle}>Activation Date</th>
              <th style={thStyle}>Expiration Date</th>
              <th style={thStyle}>License Key</th>
              <th style={thStyle}>Key Status</th>
              <th style={thStyle}>Payment Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>

            {orders.map(order => (

              <tr key={order.orderID} style={{ textAlign: "center" }}>

                <td style={tdStyle}>{order.product?.productName}</td>

                <td style={tdStyle}>{order.tier?.tierName}</td>

                <td style={tdStyle}>{order.quantity}</td>

                <td style={tdStyle}>{Number(order.totalAmount).toLocaleString("vi-VN")} VND</td>

                <td style={tdStyle}>{formatDate(order.createdAt)}</td>
                <td style={tdStyle}>{order.license ? formatDate(order.license.activatedAt) : "N/A"}</td>
                <td style={tdStyle}>{order.license?.expireAt ? formatDate(order.license.expireAt) : (order.license?.activatedAt ? "Lifetime" : "Not Activated")}</td>

                <td style={tdStyle}>
                  {order.license?.licenseKey || "Generating..."}
                </td>

                <td style={tdStyle}>
                  <span style={{
                    padding: "3px 8px", borderRadius: "4px", fontSize: "0.85em",
                    background: order.license?.isActivated ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
                    color: order.license?.isActivated ? "#4CAF50" : "#F44336"
                  }}>
                    {order.license ? (order.license.isActivated ? "Activated" : "Unused") : "N/A"}
                  </span>
                </td>

                <td style={tdStyle}>{order.paymentStatus}</td>

                <td style={tdStyle}>
                  <button style={{
                    padding: "6px 14px",
                    background: "#ff7a18",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }} >
                    <a href={order.fileUrl}>Download</a>
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

          <tfoot>
            <tr style={{ background: "rgba(255,255,255,0.1)", fontWeight: "bold" }}>
              <td colSpan="3" style={tdStyle}>Total</td> {/* Sửa từ 4 thành 3 */}
              <td style={tdStyle}>{Number(totalPrice).toLocaleString("vi-VN")} VND</td> {/* Giờ số tiền sẽ nằm dưới cột Price */}
              <td colSpan="6"></td>
            </tr>
          </tfoot>

        </table>
      )}

    </div>
  );
}

const thStyle = {
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,0.2)"
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.1)"
};

export default PurchasedProducts;