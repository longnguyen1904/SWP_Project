import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import XLSX from "xlsx-js-style";

const C = {
  bg: "transparent",
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#22c55e", // Green
  error: "#ef4444",  // Red
  warning: "#f59e0b",
  info: "#38bdf8",
  border: "rgba(255,255,255,0.1)",
  drawerBg: "#0f172a",
};

const PAGE_SIZE_TX = 10;

/* ─── Helpers ─── */
const fmt = (v) => Number(v || 0).toLocaleString("vi-VN") + "₫";
const toISODate = (d) => d?.toISOString().slice(0, 10) ?? "";

/* ─── Badge Component ─── */
function TxBadge({ type }) {
  const map = {
    WITHDRAWAL: { c: C.error, t: "Withdrawal" },
    SALE_REVENUE: { c: C.accent, t: "Revenue" },
    COMMISSION_FEE: { c: C.warning, t: "Platform Fee" },
    DEPOSIT: { c: C.info, t: "Deposit" },
  };
  const item = map[type] || { c: "#94a3b8", t: type };
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
      fontWeight: "700", backgroundColor: `${item.c}22`,
      color: item.c, border: `1px solid ${item.c}44`,
    }}>{item.t}</span>
  );
}

/* ─── Main Component ─── */
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
      console.error("API Error:", err);
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

  /* ─── Export Excel ─── */
  const handleExportExcel = () => {
    if (!data.content || data.content.length === 0) return;

    const header = ["Transaction Type", "Amount", "Date", "Note"];
    const rows = data.content.map(tx => [
      tx.type === 'SALE_REVENUE' ? 'Revenue' : tx.type === 'WITHDRAWAL' ? 'Withdrawal' : tx.type,
      tx.amount,
      tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "",
      tx.description || "—"
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let Col = range.s.c; Col <= range.e.c; ++Col) {
        const cell_ref = XLSX.utils.encode_cell({ r: R, c: Col });
        if (!ws[cell_ref]) continue;

        ws[cell_ref].s = {
          font: { sz: 11, name: "Arial" },
          alignment: { vertical: "center", horizontal: "left", indent: 1 },
          border: { bottom: { style: "thin", color: { rgb: "EEEEEE" } } }
        };

        if (R === 0) {
          ws[cell_ref].s = {
            fill: { fgColor: { rgb: "22C55E" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
            alignment: { horizontal: "center", vertical: "center" },
          };
        }

        if (Col === 1 && R > 0) {
          const val = ws[cell_ref].v;
          ws[cell_ref].t = 'n';
          ws[cell_ref].z = '#,##0"₫"';
          ws[cell_ref].s.font.bold = true;
          ws[cell_ref].s.font.color = { rgb: val >= 0 ? "16A34A" : "EF4444" };
          ws[cell_ref].s.alignment.horizontal = "right";
        }
      }
    }
    ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 45 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Wallet History");
    XLSX.writeFile(wb, `Wallet_Report_${toISODate(new Date())}.xlsx`);
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 999, backdropFilter: "blur(2px)" }} />

      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(680px, 96vw)",
        backgroundColor: C.drawerBg, zIndex: 1000, display: "flex", flexDirection: "column",
        borderLeft: `1px solid ${C.border}`,
        animation: "slideIn 0.3s cubic-bezier(.4,0,.2,1)",
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
          .tx-row:hover { background: rgba(255,255,255,0.04) !important; }
        `}</style>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: C.textMain }}>Transaction History</h3>
            <span style={{ fontSize: "12px", color: C.textMuted }}>{data.totalElements} results found</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMuted, width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", fontSize: "18px" }}>×</button>
        </div>

        {/* FILTER */}
        <div style={{ display: "flex", gap: "10px", padding: "16px 24px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "130px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, display: "block", marginBottom: "4px" }}>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", colorScheme: "dark" }} />
          </div>
          <div style={{ flex: 1, minWidth: "130px" }}>
            <label style={{ fontSize: "11px", color: C.textMuted, display: "block", marginBottom: "4px" }}>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${C.border}`, backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", colorScheme: "dark" }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleFilter} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: C.accent, color: "#fff", fontWeight: "600", cursor: "pointer" }}>Filter</button>

            <button onClick={handleExportExcel} disabled={data.content?.length === 0} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.accent}`, background: `${C.accent}15`, color: C.accent, fontWeight: "600", cursor: "pointer", opacity: data.content?.length === 0 ? 0.5 : 1 }}>
              Export Excel
            </button>

            <button onClick={handleReset} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer" }}>Reset</button>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.textMuted }}>Loading data...</div>
          ) : data.content?.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.textMuted }}>No transactions found</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: C.textMuted, fontSize: "11px", textTransform: "uppercase", textAlign: "left" }}>
                  <th style={{ padding: "14px 8px" }}>Type</th>
                  <th style={{ padding: "14px 8px", textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "14px 8px" }}>Date</th>
                  <th style={{ padding: "14px 8px" }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((tx, i) => (
                  <tr key={i} className="tx-row" style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.2s" }}>
                    <td style={{ padding: "12px 8px" }}><TxBadge type={tx.type} /></td>
                    <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700", fontSize: "13px", color: tx.amount >= 0 ? C.accent : C.error }}>
                      {tx.amount >= 0 ? "+" : ""}{fmt(tx.amount)}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: "12px", color: C.textMuted, whiteSpace: "nowrap" }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td style={{ padding: "12px 8px", fontSize: "12px", color: C.textMuted }}>{tx.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {data.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: "12px", color: C.textMuted }}>Page {page + 1} / {data.totalPages}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button disabled={page === 0} onClick={() => { setPage(p => p - 1); fetchTx(page - 1, from, to); }} style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: "#fff", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.3 : 1 }}>← Prev</button>
              <button disabled={page >= data.totalPages - 1} onClick={() => { setPage(p => p + 1); fetchTx(page + 1, from, to); }} style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: "#fff", cursor: page >= data.totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= data.totalPages - 1 ? 0.3 : 1 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}