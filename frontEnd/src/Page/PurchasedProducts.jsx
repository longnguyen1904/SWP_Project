import React, { useEffect, useState } from "react";
import { orderAPI } from "../services/orderApi.js";
import { licenseAPI } from "../services/api.js";

function PurchasedProducts() {

  const [orders, setOrders] = useState([]);
  const [hoveredLicense, setHoveredLicense] = useState(null);
  const [sessionsCache, setSessionsCache] = useState({});

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

  const handleMouseEnter = async (licenseKey) => {
    if (!licenseKey) return;
    setHoveredLicense(licenseKey);
    if (!sessionsCache[licenseKey]) {
      try {
        const res = await licenseAPI.getSessions(licenseKey);
        setSessionsCache(prev => ({ ...prev, [licenseKey]: res.data.sessions }));
      } catch (error) {
        console.error("Failed to fetch sessions for license:", error);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredLicense(null);
  };

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

                <td style={tdStyle}>${order.totalAmount}</td>

                <td style={tdStyle}>{formatDate(order.createdAt)}</td>
                <td style={tdStyle}>{order.license ? formatDate(order.license.activatedAt) : "N/A"}</td>
                <td style={tdStyle}>{order.license?.expireAt ? formatDate(order.license.expireAt) : (order.license?.activatedAt ? "Lifetime" : "Not Activated")}</td>

                <td style={{ ...tdStyle, position: "relative" }}>
                  <span
                    onMouseEnter={() => handleMouseEnter(order.license?.licenseKey)}
                    onMouseLeave={handleMouseLeave}
                    style={{ 
                      cursor: "pointer", 
                      textDecoration: "underline", 
                      textUnderlineOffset: "4px",
                      color: "#b0e0e6" 
                    }}
                  >
                    {order.license?.licenseKey || "Generating..."}
                  </span>
                  
                  {hoveredLicense === order.license?.licenseKey && sessionsCache[order.license?.licenseKey] && (
                    <div style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginBottom: "10px",
                      background: "rgba(20, 20, 30, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      padding: "15px",
                      minWidth: "400px",
                      zIndex: 1000,
                      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                      backdropFilter: "blur(10px)"
                    }}>
                      <h4 style={{ margin: "0 0 10px 0", color: "#ff7a18", textAlign: "left", fontSize: "14px" }}>Device Login History</h4>
                      {sessionsCache[order.license?.licenseKey].length === 0 ? (
                        <p style={{ margin: 0, fontSize: "13px", color: "#aaa" }}>No logged in devices.</p>
                      ) : (
                        <table style={{ width: "100%", fontSize: "12px", textAlign: "left", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ color: "#aaa", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                              <th style={{ padding: "5px" }}>Device Name</th>
                              <th style={{ padding: "5px" }}>IP Address</th>
                              <th style={{ padding: "5px" }}>Last Active</th>
                              <th style={{ padding: "5px" }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionsCache[order.license.licenseKey].map(session => (
                              <tr key={session.sessionID} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "5px" }}>{session.deviceName || session.deviceIdentifier || "Unknown"}</td>
                                <td style={{ padding: "5px", color: "#4CAF50" }}>{session.ipAddress || "N/A"}</td>
                                <td style={{ padding: "5px" }}>{formatDate(session.lastActive)}</td>
                                <td style={{ padding: "5px" }}>
                                  <span style={{ color: session.isActive ? "#4CAF50" : "#F44336" }}>
                                    {session.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
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
              <td style={tdStyle}>${totalPrice}</td> {/* Giờ số tiền sẽ nằm dưới cột Price */}
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