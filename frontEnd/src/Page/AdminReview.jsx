import React, { useEffect, useState } from "react";

function AdminReview() {
  // 1. STATES & CONFIG

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Pagination & Filter States
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  const colors = {
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


  // 2. FETCH DATA LOGIC (PAGEABLE)

  const fetchProducts = async (targetPage = page) => {
    setLoading(true);
    try {
      let url = `http://localhost:8081/api/admin/review?page=${targetPage}&size=${size}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      
      const data = await res.json();
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage(targetPage); // Cập nhật state page hiện tại
    } catch (err) {
      console.error(err);
      setMessage("Error loading data from server");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

 
  useEffect(() => {
    fetchProducts(page);
  }, [page]);


  // 3. HANDLERS

  const handleApplyFilter = () => {
    fetchProducts(0); // Luôn về trang 0 khi lọc mới
  };

  const handleReset = () => {
    setStatusFilter("");
    setKeyword("");
    fetchProducts(0);
  };

  const handleApprove = async (productId) => {
    setLoadingId(productId);
    setMessage("System scanning in progress...");
    setMessageType("loading");

    try {
      const res = await fetch(`http://localhost:8081/api/admin/review/${productId}`, { 
        method: "POST" 
      });
      const text = await res.text();
      
      if (!res.ok) throw new Error(text);

      // Reload 
      await fetchProducts(page);

      const isApproved = text.includes("approved");
      setMessage(isApproved ? "Product approved successfully!" : "Product rejected (Security Risk)!");
      setMessageType(isApproved ? "success" : "error");

    } catch (err) {
      setMessage("Error: " + err.message);
      setMessageType("error");
    } finally {
      setLoadingId(null);
      setTimeout(() => { setMessage(""); setMessageType(""); }, 4000);
    }
  };

  const getStatusLabel = (scanStatus) => {
    switch (scanStatus) {
      case "CLEAN": return "APPROVED";
      case "MALICIOUS": return "REJECTED";
      default: return "DRAFT";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED": return { color: colors.success, bg: "rgba(34,197,94,0.1)" };
      case "REJECTED": return { color: colors.error, bg: "rgba(239,68,68,0.1)" };
      default: return { color: colors.warning, bg: "rgba(245,158,11,0.1)" };
    }
  };

 
  // 4. RENDER UI

  return (
    <div style={{ padding: "40px 20px", backgroundColor: colors.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: colors.textMain }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <header style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>Product Review Management</h2>
          <p style={{ color: colors.textMuted, marginTop: "8px" }}>Automated security scanning and product validation</p>
        </header>

        {/* CONTROL BAR (SYNCED STYLE) */}
        <div style={controlBarStyle(colors)}>
          <select 
            style={selectStyle} 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button onClick={handleApplyFilter} style={btnPrimary}>Apply Filter</button>
          
          <div style={{ flexGrow: 1 }}></div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search product..."
              style={inputStyle}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
            />
            <button onClick={handleApplyFilter} style={btnSecondary}>Search</button>
            <button onClick={handleReset} style={{...btnSecondary, color: colors.error}}>Reset</button>
          </div>
        </div>

        {/* NOTIFICATION */}
        {message && (
          <div style={notifStyle(messageType, colors)}>
            {messageType === "success" ? "✅ " : messageType === "loading" ? "⏳ " : "❌ "} {message}
          </div>
        )}

        {/* TABLE */}
        <div style={tableCardStyle(colors)}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Product Name</th>
                <th style={thStyle}>Vendor</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Rejection Note</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const status = getStatusLabel(p.scanStatus);
                const sStyle = getStatusColor(status);
                return (
                  <tr key={p.productID} style={trStyle(colors)}>
                    <td style={tdStyle}>#{p.productID}</td>
                    <td style={{ ...tdStyle, fontWeight: "600", color: colors.textMain }}>{p.productName}</td>
                    <td style={tdStyle}>ID: {p.vendorID}</td>
                    <td style={tdStyle}>${p.basePrice}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(sStyle)}>{status}</span>
                    </td>
                    <td style={{...tdStyle, fontSize: "12px", color: colors.textMuted}}>
                      {status === "REJECTED" ? p.rejectionNote : "—"}
                    </td>
                    <td style={tdStyle}>
                      {status === "DRAFT" ? (
                        <button 
                          disabled={loadingId === p.productID}
                          onClick={() => handleApprove(p.productID)} 
                          style={actionBtnStyle(colors.accent, loadingId === p.productID)}
                        >
                          {loadingId === p.productID ? "Scanning..." : "Scan & Review"}
                        </button>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: "13px", fontStyle: "italic" }}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {loading && <div style={loadingOverlay(colors)}>⏳ Loading data...</div>}
          {!loading && products.length === 0 && (
            <div style={{ padding: "60px", textAlign: "center", color: colors.textMuted }}>No records found.</div>
          )}
        </div>

        {/* PAGINATION (SYNCED LOGIC) */}
        {!loading && totalPages > 1 && (
          <div style={paginationStyle}>
            <button 
              disabled={page === 0} 
              onClick={() => setPage(page - 1)} 
              style={page === 0 ? btnDisabled : btnSecondary}
            >
              Previous
            </button>
            <div style={{ color: colors.textMuted, fontSize: "14px" }}>
              Page <span style={{ color: colors.textMain, fontWeight: "bold" }}>{page + 1}</span> of {totalPages}
            </div>
            <button 
              disabled={page + 1 >= totalPages} 
              onClick={() => setPage(page + 1)} 
              style={page + 1 >= totalPages ? btnDisabled : btnSecondary}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// STYLES OBJECTS 

const controlBarStyle = (colors) => ({
  display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "25px",
  backgroundColor: colors.card, padding: "20px", borderRadius: "12px",
  border: `1px solid ${colors.border}`, alignItems: "center"
});

const tableCardStyle = (colors) => ({
  backgroundColor: colors.card, borderRadius: "16px", overflow: "hidden",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)", border: `1px solid ${colors.border}`, position: "relative"
});

const notifStyle = (type, colors) => ({
  padding: "16px 20px", borderRadius: "12px", marginBottom: "25px", fontSize: "14px", fontWeight: "500",
  border: `1px solid ${type === "success" ? colors.success : type === "loading" ? colors.accent : colors.error}`,
  backgroundColor: type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
  color: type === "success" ? colors.success : type === "loading" ? colors.accent : colors.error
});

const badgeStyle = (s) => ({
  padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
  backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}`
});

const actionBtnStyle = (color, isLoading) => ({
  backgroundColor: isLoading ? "transparent" : "transparent", color: color,
  border: `1px solid ${color}`, padding: "6px 14px", borderRadius: "6px",
  fontSize: "12px", fontWeight: "700", cursor: isLoading ? "not-allowed" : "pointer",
  opacity: isLoading ? 0.5 : 1, textTransform: "uppercase"
});

const thStyle = { padding: "16px 20px", fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", letterSpacing: "1px", fontWeight: "600" };
const tdStyle = { padding: "16px 20px", fontSize: "14px", color: "#cbd5e1" };
const trStyle = (colors) => ({ borderBottom: `1px solid ${colors.border}`, transition: "background 0.2s" });
const selectStyle = { backgroundColor: "#1e293b", color: "#f8fafc", border: "1px solid #334155", padding: "10px 14px", borderRadius: "8px", outline: "none", fontSize: "14px" };
const inputStyle = { ...selectStyle, width: "220px", backgroundColor: "#0f172a" };
const btnPrimary = { backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" };
const btnSecondary = { backgroundColor: "transparent", color: "#f8fafc", border: "1px solid #334155", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" };
const btnDisabled = { ...btnSecondary, opacity: 0.3, cursor: "not-allowed" };
const paginationStyle = { marginTop: "30px", display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" };
const loadingOverlay = (colors) => ({ padding: "40px", textAlign: "center", color: colors.accent, fontWeight: "600" });

export default AdminReview;