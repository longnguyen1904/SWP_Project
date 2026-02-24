import React, { useEffect, useState } from "react";

function AdminReview() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8081/api/admin/review")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  const handleApprove = async (productId) => {
    setLoadingId(productId);
    setMessage("System scanning in progress...");
    setMessageType("loading");

    try {
      const res = await fetch(
        `http://localhost:8081/api/admin/review/${productId}`,
        { method: "POST" }
      );
      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const updated = await fetch("http://localhost:8081/api/admin/review").then(
        (res) => res.json()
      );
      setProducts(updated);

      setMessage(text.includes("approved") ? "Product approved successfully!" : "Product rejected due to security risks!");
      setMessageType(text.includes("approved") ? "success" : "error");
    } catch (error) {
      setMessage("Error reviewing product!");
      setMessageType("error");
    } finally {
      setLoadingId(null);
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 4000);
    }
  };

  const getStatus = (scanStatus) => {
    switch (scanStatus) {
      case "CLEAN": return "APPROVED";
      case "MALICIOUS": return "REJECTED";
      default: return "PENDING";
    }
  };

  // Màu sắc hiện đại hơn
  const colors = {
    bg: "#0f172a",
    card: "#1e293b",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    accent: "#38bdf8",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
  };

  const statusStyle = (status) => {
    switch (status) {
      case "APPROVED": return { color: colors.success, bg: "rgba(34, 197, 94, 0.1)" };
      case "REJECTED": return { color: colors.error, bg: "rgba(239, 68, 68, 0.1)" };
      default: return { color: colors.warning, bg: "rgba(245, 158, 11, 0.1)" };
    }
  };

  return (
    <div style={{ 
      padding: "40px 20px", 
      backgroundColor: colors.bg, 
      minHeight: "100vh", 
      fontFamily: "'Inter', sans-serif",
      color: colors.textMain 
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>Product Review</h2>
          <p style={{ color: colors.textMuted, marginTop: "8px" }}>Security scan and manual approval dashboard</p>
        </header>

        {/* Thông báo (Toast-like) */}
        {message && (
          <div style={{
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "25px",
            fontSize: "14px",
            fontWeight: "500",
            border: `1px solid ${statusStyle(messageType === "error" ? "REJECTED" : messageType === "success" ? "APPROVED" : "PENDING").color}`,
            backgroundColor: statusStyle(messageType === "error" ? "REJECTED" : messageType === "success" ? "APPROVED" : "PENDING").bg,
            color: statusStyle(messageType === "error" ? "REJECTED" : messageType === "success" ? "APPROVED" : "PENDING").color,
            transition: "all 0.3s ease"
          }}>
            {messageType === "loading" && "⏳ "} {message}
          </div>
        )}

        <div style={{ 
          backgroundColor: colors.card, 
          borderRadius: "16px", 
          overflow: "hidden", 
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          border: "1px solid #334155"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Product Name</th>
                <th style={thStyle}>Vendor ID</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Security Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const status = getStatus(p.scanStatus);
                const style = statusStyle(status);

                return (
                  <tr key={p.productID} style={{ borderBottom: "1px solid #334155", transition: "0.2s" }} className="table-row">
                    <td style={tdStyle}>#{p.productID}</td>
                    <td style={{ ...tdStyle, fontWeight: "600" }}>{p.productName}</td>
                    <td style={tdStyle}>{p.vendorID}</td>
                    <td style={tdStyle}>${p.basePrice}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.color}`
                      }}>
                        {status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {status === "PENDING" ? (
                        <button
                          disabled={loadingId === p.productID}
                          onClick={() => handleApprove(p.productID)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: loadingId === p.productID ? "#475569" : colors.accent,
                            color: "#000",
                            fontWeight: "bold",
                            cursor: loadingId === p.productID ? "not-allowed" : "pointer",
                            transition: "transform 0.2s",
                          }}
                        >
                          {loadingId === p.productID ? "Scanning..." : "Scan & Review"}
                        </button>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: "13px" }}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
              No products pending review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "16px 20px",
  fontSize: "13px",
  textTransform: "uppercase",
  color: "#94a3b8",
  letterSpacing: "1px"
};

const tdStyle = {
  padding: "16px 20px",
  fontSize: "14px",
  color: "#cbd5e1"
};

export default AdminReview;