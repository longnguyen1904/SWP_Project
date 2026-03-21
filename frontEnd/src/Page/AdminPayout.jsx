import React, { useEffect, useState, useCallback } from "react";

// --- CONSTANTS & STYLES ---
const COLORS = {
  bg: "#0f172a",
  card: "#1e293b",
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#38bdf8",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  border: "#334155",
};

const API_BASE = "http://localhost:8081/api/admin/payouts";

const AdminPayout = () => {
  const [payouts, setPayouts] = useState([]);
  const [adminBalance, setAdminBalance] = useState(0);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [processingId, setProcessingId] = useState(null); // Theo dõi ID đang xử lý

  const fetchData = useCallback(async () => {
    try {
      const [payoutsRes, balanceRes] = await Promise.all([
        fetch(`${API_BASE}/pending`),
        fetch(`${API_BASE}/admin-wallet`),
      ]);
      const payoutsData = await payoutsRes.json();
      const balanceData = await balanceRes.json();

      setPayouts(payoutsData.content || []);
      setAdminBalance(balanceData);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id, action) => {
    setProcessingId(id);

    try {
      const res = await fetch(`${API_BASE}/${id}/${action}`, {
        method: "POST",
      });

      const responseText = await res.text();

      if (!res.ok) {
        setMessage({
          text: responseText ,
          type: "error",
        });
        return;
      }


      setPayouts((prev) =>
        prev.map((p) =>
          p.payoutId === id
            ? {
              ...p,
              status: action === "approve" ? "COMPLETED" : "REJECTED",
            }
            : p
        )
      );

      setMessage({
        text: responseText ,
        type: "success",
      });


      const balanceRes = await fetch(`${API_BASE}/admin-wallet`);
      setAdminBalance(await balanceRes.json());

    } catch (err) {
      setMessage({
        text: "Admin wallet does not have enough balance for this payout",
        type: "error",
      });
    } finally {
      setProcessingId(null);

      setTimeout(() => {
        setMessage({ text: "", type: "" });
      }, 3000);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      COMPLETED: { color: COLORS.success, bg: "rgba(34, 197, 94, 0.1)" },
      REJECTED: { color: COLORS.error, bg: "rgba(239, 68, 68, 0.1)" },
      PENDING: { color: COLORS.warning, bg: "rgba(245, 158, 11, 0.1)" },
    };
    return styles[status] || styles.PENDING;
  };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Section */}
        <header style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
            Vendor Payout Management
          </h2>
          <div style={walletCardStyle}>
            <span style={{ color: COLORS.textMuted, fontSize: "14px" }}>Admin Wallet</span>
            <span style={{ color: COLORS.accent, fontSize: "20px", fontWeight: "bold" }}>
              ${adminBalance.toLocaleString()}
            </span>
          </div>
        </header>

        {/* Alert Message */}
        {message.text && (
          <div style={{ ...alertStyle, borderColor: COLORS[message.type], color: COLORS[message.type] }}>
            {message.text}
          </div>
        )}

        {/* Table Section */}
        <div style={tableWrapperStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={tableHeaderRowStyle}>
                <th style={thStyle}>Payout ID</th>
                <th style={thStyle}>Vendor Info</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Platform Fee</th>
                <th style={thStyle}>Vendor Receive</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr><td colSpan="7" style={emptyStateStyle}>No payouts available</td></tr>
              ) : (
                payouts.map((p) => {
                  const sStyle = getStatusStyle(p.status);
                  const isProcessed = p.status !== "PENDING";

                  return (
                    <tr key={p.payoutId} style={{ ...trStyle, opacity: isProcessed ? 0.6 : 1 }}>
                      <td style={tdStyle}>#{p.payoutId}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: "600" }}>{p.vendorName}</div>
                        <div style={{ fontSize: "12px", color: COLORS.textMuted }}>ID: {p.vendorId}</div>
                      </td>
                      <td style={{ ...tdStyle, color: COLORS.accent, fontWeight: "700" }}>${p.amount}</td>
                      <td style={{ ...tdStyle, color: COLORS.warning }}>${p.platformCommission}</td>
                      <td style={{ ...tdStyle, color: COLORS.success, fontWeight: "700" }}>${p.vendorReceive}</td>
                      <td style={tdStyle}>
                        <span style={{ ...badgeStyle, backgroundColor: sStyle.bg, color: sStyle.color, borderColor: sStyle.color }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {!isProcessed ? (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              disabled={processingId === p.payoutId}
                              onClick={() => handleAction(p.payoutId, "approve")}
                              style={actionBtn(COLORS.success)}
                            >
                              {processingId === p.payoutId ? "..." : "Approve"}
                            </button>
                            <button
                              disabled={processingId === p.payoutId}
                              onClick={() => handleAction(p.payoutId, "reject")}
                              style={actionBtn(COLORS.error)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: COLORS.textMuted, fontStyle: "italic" }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLES OBJECTS ---
const containerStyle = {
  padding: "40px 20px",
  backgroundColor: COLORS.bg,
  minHeight: "100vh",
  color: COLORS.textMain,
  fontFamily: "'Inter', system-ui, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "30px",
};

const walletCardStyle = {
  backgroundColor: COLORS.card,
  padding: "12px 24px",
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
};

const tableWrapperStyle = {
  backgroundColor: COLORS.card,
  borderRadius: "16px",
  overflow: "hidden",
  border: `1px solid ${COLORS.border}`,
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
};

const tableHeaderRowStyle = {
  borderBottom: `1px solid ${COLORS.border}`,
  backgroundColor: "rgba(255,255,255,0.02)",
};

const thStyle = {
  padding: "16px",
  fontSize: "12px",
  color: COLORS.textMuted,
  textTransform: "uppercase",
  fontWeight: "600",
  textAlign: "left",
};

const tdStyle = { padding: "16px", fontSize: "14px", color: "#cbd5e1" };
const trStyle = { borderBottom: `1px solid ${COLORS.border}`, transition: "all 0.3s ease" };

const badgeStyle = {
  padding: "4px 10px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: "700",
  border: "1px solid",
};

const alertStyle = {
  padding: "12px 16px",
  marginBottom: "20px",
  borderRadius: "8px",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  border: "1px solid",
  transition: "all 0.3s",
};

const emptyStateStyle = { padding: "40px", textAlign: "center", color: COLORS.textMuted };

const actionBtn = (color) => ({
  background: "transparent",
  border: `1px solid ${color}`,
  color: color,
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  transition: "all 0.2s",
  opacity: 1,
  ":disabled": { opacity: 0.5, cursor: "not-allowed" }
});

export default AdminPayout;