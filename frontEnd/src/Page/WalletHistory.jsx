import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const C = {
  bg: "transparent",
  card: "rgba(0,0,0,0.4)",
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#38bdf8",
  border: "rgba(255,255,255,0.1)",
  drawerBg: "#0f172a",
};

const PAGE_SIZE_TX = 10;

/* ─── Helpers ─── */
const fmt = (v) => Number(v || 0).toLocaleString("vi-VN") + "₫";
const toISODate = (d) => d?.toISOString().slice(0, 10) ?? "";

/* ─── Badge ─── */
function TxBadge({ type }) {
  const map = {
    WITHDRAWAL: C.error,
    SALE_REVENUE: C.accent,
    COMMISSION_FEE: C.warning,
    DEPOSIT: C.info,
  };
  const color = map[type] || "#94a3b8";
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
      fontWeight: "700", backgroundColor: `${color}22`,
      color, border: `1px solid ${color}44`,
    }}>{type}</span>
  );
}

/* ─── Pagination Button ─── */
function PagBtn({ children, disabled, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      padding: "6px 14px", borderRadius: "6px",
      border: `1px solid ${C.border}`, backgroundColor: "transparent",
      color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.3 : 1, fontSize: "12px",
    }}>{children}</button>
  );
}

const dateInputStyle = { 
    width: "100%", padding: "7px 10px", borderRadius: "7px", 
    border: `1px solid rgba(255,255,255,0.15)`, backgroundColor: "rgba(255,255,255,0.05)", 
    color: "#fff", outline: "none", fontSize: "13px", colorScheme: "dark" 
};

/* ─── Main Drawer Component ─── */
export default function WalletHistory({ open, onClose }) {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [page, setPage] = useState(0);
  const [from, setFrom] = useState(toISODate(firstOfMonth));
  const [to, setTo] = useState(toISODate(today));
  const [loading, setLoading] = useState(false);

  const fetchTx = useCallback(async (p = 0, f = from, t = to) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, size: PAGE_SIZE_TX });
      if (f) params.append("from", f);
      if (t) params.append("to", t);
      const res = await api.get(`/api/vendor/transactions?${params}`);
      if (res.data?.data) setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (open) { setPage(0); fetchTx(0, from, to); }
  }, [open, fetchTx]);

  const handleFilter = () => { setPage(0); fetchTx(0, from, to); };
  const handleReset = () => {
    const f = toISODate(firstOfMonth), t = toISODate(today);
    setFrom(f); setTo(t); setPage(0); fetchTx(0, f, t);
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 999, backdropFilter: "blur(2px)",
      }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(680px, 96vw)",
        backgroundColor: C.drawerBg, zIndex: 1000, display: "flex", flexDirection: "column",
        borderLeft: `1px solid ${C.border}`,
        animation: "slideIn 0.25s cubic-bezier(.4,0,.2,1)",
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
          .tx-row:hover { background: rgba(255,255,255,0.04) !important; }
        `}</style>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: C.textMain }}>
              Lịch sử giao dịch
            </h3>
            {data.totalElements > 0 && (
              <span style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px", display: "block" }}>
                {data.totalElements} giao dịch
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C.border}`, color: C.textMuted,
            width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer",
            fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <div style={{
          display: "flex", gap: "10px", alignItems: "flex-end",
          padding: "16px 24px", borderBottom: `1px solid ${C.border}`,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, display: "block", marginBottom: "4px" }}>
              Từ ngày
            </label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              style={dateInputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: "140px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, display: "block", marginBottom: "4px" }}>
              Đến ngày
            </label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              style={dateInputStyle} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleFilter} style={{
              padding: "8px 16px", borderRadius: "8px", border: "none",
              backgroundColor: C.accent, color: "#fff", fontWeight: "600",
              cursor: "pointer", fontSize: "13px",
            }}>Lọc</button>
            <button onClick={handleReset} style={{
              padding: "8px 14px", borderRadius: "8px",
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.textMuted, cursor: "pointer", fontSize: "13px",
            }}>Reset</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.textMuted }}>
              Đang tải...
            </div>
          ) : data.content?.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.textMuted }}>
              Không có giao dịch nào trong khoảng thời gian này
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: C.textMuted, fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 8px", textAlign: "left", fontWeight: "600" }}>Loại</th>
                  <th style={{ padding: "14px 8px", textAlign: "right", fontWeight: "600" }}>Số tiền</th>
                  <th style={{ padding: "14px 8px", textAlign: "left", fontWeight: "600" }}>Thời gian</th>
                  <th style={{ padding: "14px 8px", textAlign: "left", fontWeight: "600" }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((tx, i) => (
                  <tr key={i} className="tx-row" style={{
                    borderBottom: `1px solid ${C.border}`,
                    transition: "background 0.15s",
                  }}>
                    <td style={{ padding: "12px 8px" }}><TxBadge type={tx.type} /></td>
                    <td style={{
                      padding: "12px 8px", textAlign: "right",
                      fontWeight: "700", fontSize: "13px",
                      color: tx.amount >= 0 ? C.accent : C.error,
                    }}>
                      {tx.amount >= 0 ? "+" : ""}{fmt(tx.amount)}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: "12px", color: C.textMuted, whiteSpace: "nowrap" }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: "12px", color: C.textMuted }}>
                      {tx.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data.totalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 24px", borderTop: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: "12px", color: C.textMuted }}>
              Trang {page + 1} / {data.totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <PagBtn disabled={page === 0} onClick={() => { setPage(p => p - 1); fetchTx(page - 1, from, to); }}>
                ← Trước
              </PagBtn>
              <PagBtn disabled={page >= data.totalPages - 1} onClick={() => { setPage(p => p + 1); fetchTx(page + 1, from, to); }}>
                Sau →
              </PagBtn>
            </div>
          </div>
        )}
      </div>
    </>
  );
}