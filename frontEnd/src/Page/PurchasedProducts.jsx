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
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>

            {orders.map(order => (

              <tr key={order.orderID} style={{ textAlign: "center" }}>

                <td style={tdStyle}>{order.product?.productName}</td>

                <td style={tdStyle}>{order.tier?.tierName}</td>

                <td style={tdStyle}>{order.quantity}</td>

                <td style={tdStyle}>${order.totalAmount}</td>

                <td style={tdStyle}>{order.paymentStatus}</td>

                <td style={tdStyle}>
                  <button style={{
                    padding: "6px 14px",
                    background: "#ff7a18",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}>
                    Download
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

          <tfoot>
            <tr style={{
              background: "rgba(255,255,255,0.1)",
              fontWeight: "bold"
            }}>
              <td colSpan="3" style={tdStyle}>Total</td>

              <td style={tdStyle}>${totalPrice}</td>

              <td colSpan="2"></td>
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