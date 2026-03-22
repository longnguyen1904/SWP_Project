import React, { useEffect, useState, useCallback } from "react";
import api from "../services/api";

const COLORS = {
  bg: "transparent",
  card: "rgba(0,0,0,0.4)",
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  border: "rgba(255,255,255,0.1)",
};

export default function VendorWallet() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchWallet = useCallback(async () => {
    try {
      const res = await api.get("/api/vendor/wallet");
      setWallet(res.data.data || { balance: 0, transactions: [] });
    } catch (err) {
      console.error("Fetch wallet error:", err);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setMessage({ text: "Vui lòng nhập số tiền hợp lệ", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/vendor/payouts", { amount: numAmount });
      const data = res.data.data;
      setMessage({
        text: `Yêu cầu rút tiền #${data.payoutId} đã được gửi (${numAmount.toLocaleString()}₫). Chờ Admin duyệt.`,
        type: "success",
      });
      setAmount("");
      fetchWallet();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Lỗi khi gửi yêu cầu";
      setMessage({ text: String(errorMsg), type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const formatVND = (value) => {
    return Number(value || 0).toLocaleString("vi-VN") + "₫";
  };

  return (
    <div
      style={{
        color: COLORS.textMain,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "24px" }}>
        Ví & Rút tiền
      </h2>

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "10px",
            backgroundColor:
              message.type === "error"
                ? "rgba(239,68,68,0.15)"
                : "rgba(34,197,94,0.15)",
            color: message.type === "error" ? COLORS.error : COLORS.accent,
            border: `1px solid ${message.type === "error" ? COLORS.error : COLORS.accent}`,
            fontSize: "14px",
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        {/* Ví hiện tại */}
        <div style={cardStyle}>
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: "13px",
              marginBottom: "8px",
            }}
          >
            Số dư ví
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: COLORS.accent,
            }}
          >
            {formatVND(wallet.balance)}
          </div>
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: "12px",
              marginTop: "6px",
            }}
          >
            Tiền thực nhận sau khi Admin duyệt yêu cầu rút
          </div>
        </div>

        {/* Form rút tiền */}
        <div style={cardStyle}>
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            Yêu cầu rút tiền mới
          </div>
          <form
            onSubmit={handleRequestPayout}
            style={{ display: "flex", gap: "10px" }}
          >
            <input
              type="number"
              placeholder="Nhập số tiền (VND)..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? "Đang gửi..." : "Rút tiền"}
            </button>
          </form>
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: "11px",
              marginTop: "8px",
            }}
          >
            Hệ thống sẽ trừ phí nền tảng + thuế khi Admin duyệt
          </div>
        </div>
      </div>

      {/* Lịch sử giao dịch */}
      <div style={cardStyle}>
        <h3
          style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}
        >
          Lịch sử giao dịch
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <th style={thStyle}>Loại</th>
              <th style={thStyle}>Số tiền</th>
              <th style={thStyle}>Mô tả</th>
              <th style={thStyle}>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {wallet.transactions.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: COLORS.textMuted,
                  }}
                >
                  Chưa có giao dịch nào
                </td>
              </tr>
            ) : (
              wallet.transactions.map((tx, idx) => (
                <tr
                  key={idx}
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td style={tdStyle}>
                    <span style={typeBadge(tx.type)}>{tx.type}</span>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: "700",
                      color: tx.amount >= 0 ? COLORS.accent : COLORS.error,
                    }}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {formatVND(tx.amount)}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: "300px" }}>
                    {tx.description}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: COLORS.textMuted,
                      fontSize: "12px",
                    }}
                  >
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString("vi-VN")
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: COLORS.card,
  borderRadius: "14px",
  padding: "20px 24px",
  border: `1px solid ${COLORS.border}`,
};

const inputStyle = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};

const btnStyle = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#22c55e",
  color: "#fff",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const thStyle = {
  padding: "12px 16px",
  fontSize: "11px",
  color: "#94a3b8",
  textTransform: "uppercase",
  fontWeight: "600",
  textAlign: "left",
};

const tdStyle = { padding: "12px 16px", fontSize: "13px", color: "#cbd5e1" };

const typeBadge = (type) => {
  const colors = {
    DEPOSIT: { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    WITHDRAWAL: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    SALE_REVENUE: { bg: "rgba(56,189,248,0.15)", color: "#38bdf8" },
    COMMISSION_FEE: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  };
  const c = colors[type] || colors.DEPOSIT;
  return {
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    backgroundColor: c.bg,
    color: c.color,
  };
};
