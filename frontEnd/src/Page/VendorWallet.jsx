import React, { useEffect, useState, useCallback, useMemo } from "react";
import api from "../services/api";
import WalletHistory from "./WalletHistory";

const C = {
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#38bdf8",
  border: "rgba(255,255,255,0.1)",
  card: "rgba(0,0,0,0.4)",
};

const TAX_RATE = 5;
const PAGE_SIZE_WALLET = 5;
const MIN_AMOUNT = 5000;
const MAX_AMOUNT = 1_000_000_000;

const fmt = (v) => Number(v || 0).toLocaleString("vi-VN") + "₫";

export default function VendorWallet() {
  const [wallet, setWallet] = useState({ balance: 0, available: 0 });
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [commission, setCommission] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const commissionFee = useMemo(() => (numAmount * commission) / 100, [numAmount, commission]);
  const taxFee = useMemo(() => (numAmount * TAX_RATE) / 100, [numAmount]);
  const netAmount = useMemo(() => numAmount - commissionFee - taxFee, [numAmount, commissionFee, taxFee]);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await api.get(`/api/vendor/wallet?page=0&size=${PAGE_SIZE_WALLET}`);
      if (res.data?.data) setWallet(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchCommission = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/commission");
      const rate = res.data?.data !== undefined ? Number(res.data.data) : Number(res.data);
      setCommission(isNaN(rate) ? 0 : rate);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchWallet(); fetchCommission(); }, [fetchWallet, fetchCommission]);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) return setMessage({ text: "Vui lòng nhập số tiền hợp lệ", type: "error" });
    if (numAmount < MIN_AMOUNT) return setMessage({ text: "Số tiền tối thiểu là 5.000₫", type: "error" });
    if (numAmount > MAX_AMOUNT) return setMessage({ text: "Số tiền tối đa là 1.000.000.000₫", type: "error" });
    if (numAmount > wallet.available) return setMessage({ text: "Số tiền vượt quá số có thể rút", type: "error" });

    setLoading(true);
    try {
      const res = await api.post("/api/vendor/payouts", { amount: numAmount });
      setMessage({ text: `Yêu cầu #${res.data?.data?.payoutId || ""} thành công. Chờ duyệt.`, type: "success" });
      setAmount("");
      fetchWallet();
    } catch (err) {
      setMessage({ text: String(err.response?.data?.message || "Lỗi hệ thống"), type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    }
  };

  return (
    <div style={{ color: C.textMain, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>Quản lý Ví</h2>
        <button onClick={() => setDrawerOpen(true)} style={historyBtnStyle}>
          <span style={{ fontSize: "16px" }}>📋</span> Lịch sử giao dịch
        </button>
      </div>

      {message.text && (
        <div style={{
          padding: "12px", marginBottom: "20px", borderRadius: "8px", fontSize: "14px",
          backgroundColor: message.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: message.type === "error" ? C.error : C.accent,
          border: `1px solid ${message.type === "error" ? C.error : C.accent}`,
        }}>{message.text}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Số dư hiện tại</div>
          <div style={{ ...valueStyle, color: C.accent }}>{fmt(wallet.balance)}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Khả dụng</div>
          <div style={{ ...valueStyle, color: C.info }}>{fmt(wallet.available)}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Rút tiền</div>
          <form onSubmit={handleRequestPayout} style={{ display: "flex", gap: "8px" }}>
            <input type="number" placeholder="Số tiền..." value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? "..." : "Rút"}</button>
          </form>
          {numAmount > 0 && (
            <div style={feeBoxStyle}>
              <div style={feeRow}><span>Phí hệ thống ({commission}%):</span><span style={{ color: C.warning }}>-{fmt(commissionFee)}</span></div>
              <div style={feeRow}><span>Thuế (5%):</span><span style={{ color: C.warning }}>-{fmt(taxFee)}</span></div>
              <div style={{ ...feeRow, fontWeight: "700", color: C.accent, borderTop: `1px solid ${C.border}`, paddingTop: "6px", marginTop: "4px" }}>
                <span>Thực nhận dự kiến:</span><span>{fmt(netAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <WalletHistory open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

/* ─── Styles ─── */
const cardStyle = { backgroundColor: C.card, borderRadius: "12px", padding: "16px 20px", border: `1px solid ${C.border}` };
const labelStyle = { color: C.textMuted, fontSize: "12px", marginBottom: "6px" };
const valueStyle = { fontSize: "22px", fontWeight: "800" };
const inputStyle = { flex: 1, padding: "8px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", outline: "none", fontSize: "14px" };
const btnStyle = { padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: "600", cursor: "pointer" };
const feeBoxStyle = { marginTop: "12px", padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", border: `1px dashed ${C.border}` };
const feeRow = { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "2px" };
const historyBtnStyle = { display: "flex", alignItems: "center", gap: "8px", padding: "9px 18px", borderRadius: "10px", border: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.05)", color: C.textMain, cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "background 0.15s" };