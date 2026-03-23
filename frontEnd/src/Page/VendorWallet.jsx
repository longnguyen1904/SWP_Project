import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  const [wallet, setWallet] = useState({
    balance: 0,
    available: 0,
    transactions: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [commission, setCommission] = useState(0);
  const TAX_RATE = 5; // Thuế cố định 5%
  const pageSize = 5;

  // --- Logic tính toán tối ưu ---
  const numAmount = parseFloat(amount) || 0;
  const commissionFee = useMemo(() => (numAmount * commission) / 100, [numAmount, commission]);
  const taxFee = useMemo(() => (numAmount * TAX_RATE) / 100, [numAmount]);
  const netAmount = useMemo(() => numAmount - commissionFee - taxFee, [numAmount, commissionFee, taxFee]);

  const fetchWallet = useCallback(async (page = 0) => {
    try {
      const res = await api.get(`/api/vendor/wallet?page=${page}&size=${pageSize}`);
      if (res.data?.data) setWallet(res.data.data);
    } catch (err) {
      console.error("Fetch wallet error:", err);
    }
  }, []);

  const fetchCommission = useCallback(async () => {
  try {
    // Sửa đúng path /admin/commission (hoặc path mới bạn vừa đặt)
    const res = await api.get("/api/admin/commission"); 
    
    // Tùy vào Backend trả về trực tiếp hay bọc trong object 'data'
    const rate = res.data?.data !== undefined ? Number(res.data.data) : Number(res.data);
    
    setCommission(isNaN(rate) ? 0 : rate);
  } catch (err) {
    console.error("Fetch commission error:", err);
  }
}, []);

  useEffect(() => {
    fetchWallet(currentPage);
    fetchCommission();
  }, [fetchWallet, fetchCommission, currentPage]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setMessage({ text: "Vui lòng nhập số tiền hợp lệ", type: "error" });
      return;
    }
    if (numAmount > wallet.available) {
      setMessage({ text: "Số tiền vượt quá số có thể rút", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/vendor/payouts", { amount: numAmount });
      setMessage({
        text: `Yêu cầu #${res.data?.data?.payoutId || ""} thành công. Chờ duyệt.`,
        type: "success",
      });
      setAmount("");
      setCurrentPage(0);
      fetchWallet(0);
    } catch (err) {
      setMessage({ text: String(err.response?.data?.message || "Lỗi hệ thống"), type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  const formatVND = (v) => Number(v || 0).toLocaleString("vi-VN") + "₫";

  return (
    <div style={{ color: COLORS.textMain, fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "20px" }}>Quản lý Ví</h2>

      {message.text && (
        <div style={{
          padding: "12px", marginBottom: "20px", borderRadius: "8px", fontSize: "14px",
          backgroundColor: message.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: message.type === "error" ? COLORS.error : COLORS.accent,
          border: `1px solid ${message.type === "error" ? COLORS.error : COLORS.accent}`,
        }}>{message.text}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "16px", marginBottom: "24px" }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Số dư hiện tại</div>
          <div style={{ ...valueStyle, color: COLORS.accent }}>{formatVND(wallet.balance)}</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Khả dụng</div>
          <div style={{ ...valueStyle, color: "#38bdf8" }}>{formatVND(wallet.available)}</div>
        </div>

        <div style={cardStyle}>
          <div style={labelStyle}>Rút tiền</div>
          <form onSubmit={handleRequestPayout} style={{ display: "flex", gap: "8px" }}>
            <input
              type="number"
              placeholder="Số tiền..."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? "..." : "Rút"}</button>
          </form>

          {/* Hiển thị chi tiết Phí & Thuế */}
          {numAmount > 0 && (
            <div style={feeBoxStyle}>
              <div style={feeRow}>
                <span>Phí hệ thống ({commission}%):</span>
                <span style={{ color: COLORS.warning }}>-{formatVND(commissionFee)}</span>
              </div>
              <div style={feeRow}>
                <span>Thuế  (5%):</span>
                <span style={{ color: COLORS.warning }}>-{formatVND(taxFee)}</span>
              </div>
              <div style={{ ...feeRow, fontWeight: "700", color: COLORS.accent, borderTop: `1px solid ${COLORS.border}`, paddingTop: "6px", marginTop: "4px" }}>
                <span>Thực nhận dự kiến:</span>
                <span>{formatVND(netAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Lịch sử giao dịch</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: "12px" }}>
              <th style={thStyle}>Loại</th>
              <th style={thStyle}>Số tiền</th>
              <th style={thStyle}>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {wallet.transactions.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: "20px", textAlign: "center", color: COLORS.textMuted }}>Chưa có dữ liệu</td></tr>
            ) : (
              wallet.transactions.map((tx, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={tdStyle}><span style={badgeStyle(tx.type)}>{tx.type}</span></td>
                  <td style={{ ...tdStyle, fontWeight: "600", color: tx.amount >= 0 ? COLORS.accent : COLORS.error }}>
                    {tx.amount >= 0 ? "+" : ""}{formatVND(tx.amount)}
                  </td>
                  <td style={{ ...tdStyle, fontSize: "12px", color: COLORS.textMuted }}>
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Phân trang */}
        {wallet.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", marginTop: "16px" }}>
            <span style={{ fontSize: "12px", color: COLORS.textMuted }}>Trang {wallet.page + 1}/{wallet.totalPages}</span>
            <button disabled={wallet.page === 0} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle(wallet.page === 0)}>Trước</button>
            <button disabled={wallet.page >= wallet.totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle(wallet.page >= wallet.totalPages - 1)}>Sau</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Styles tối giản ===== */
const cardStyle = { backgroundColor: COLORS.card, borderRadius: "12px", padding: "16px 20px", border: `1px solid ${COLORS.border}` };
const labelStyle = { color: COLORS.textMuted, fontSize: "12px", marginBottom: "6px" };
const valueStyle = { fontSize: "22px", fontWeight: "800" };
const inputStyle = { flex: 1, padding: "8px 12px", borderRadius: "8px", border: `1px solid ${COLORS.border}`, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", outline: "none", fontSize: "14px" };
const btnStyle = { padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: COLORS.accent, color: "#fff", fontWeight: "600", cursor: "pointer" };
const thStyle = { padding: "10px", textAlign: "left" };
const tdStyle = { padding: "12px 10px", fontSize: "13px" };
const feeBoxStyle = { marginTop: "12px", padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", border: `1px dashed ${COLORS.border}` };
const feeRow = { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "2px" };
const pageBtnStyle = (d) => ({ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${COLORS.border}`, backgroundColor: "transparent", color: "#fff", cursor: d ? "not-allowed" : "pointer", opacity: d ? 0.3 : 1, fontSize: "12px" });
const badgeStyle = (t) => {
  const map = { WITHDRAWAL: COLORS.error, SALE_REVENUE: COLORS.accent, COMMISSION_FEE: COLORS.warning };
  const color = map[t] || "#94a3b8";
  return { padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", backgroundColor: `${color}22`, color: color, border: `1px solid ${color}44` };
};