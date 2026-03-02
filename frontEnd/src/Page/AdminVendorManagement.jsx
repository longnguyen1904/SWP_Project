import React, { useEffect, useState } from "react";

function AdminVendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(0);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [sortBy, setSortBy] = useState("vendorID");
  const [direction, setDirection] = useState("asc");

  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // ===============================
  // COLORS & STYLES
  // ===============================
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
    hover: "#1e293b",
  };

  const statusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return { color: colors.success, bg: "rgba(34, 197, 94, 0.1)" };
      case "REJECTED":
        return { color: colors.error, bg: "rgba(239, 68, 68, 0.1)" };
      default:
        return { color: colors.warning, bg: "rgba(245, 158, 11, 0.1)" };
    }
  };

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchVendors = async (customPage = page) => {
    setLoading(true);
    setMessage("");

    try {
      let url = `http://localhost:8081/api/admin/vendors?page=${customPage}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
      if (status) url += `&status=${status}`;
      if (type) url += `&type=${type}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch vendors");

      const data = await res.json();
      setVendors(data.content);
      setTotalPages(data.totalPages);
      setPage(customPage);
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(0);
  }, []);

  // ===============================
  // ACTIONS
  // ===============================
  const handleSearchById = async () => {
    if (!searchId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`http://localhost:8081/api/admin/vendors/${searchId}`);
      if (!res.ok) throw new Error("Vendor not found");
      const data = await res.json();
      setVendors([data]);
      setTotalPages(1);
      setPage(0);
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (vendorID, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:8081/api/admin/vendors/${vendorID}/status?status=${newStatus}`,
        { method: "PUT" }
      );
      if (!res.ok) throw new Error("Update failed");
      
      setMessage(`Vendor ${newStatus.toLowerCase()} successfully!`);
      setMessageType("success");
      fetchVendors(page);
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
    } finally {
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const handleReset = () => {
    setStatus("");
    setType("");
    setSortBy("vendorID");
    setDirection("asc");
    setSearchId("");
    fetchVendors(0);
  };

  return (
    <div style={{
      padding: "40px 20px",
      backgroundColor: colors.bg,
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif",
      color: colors.textMain
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <header style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>Vendor Management</h2>
          <p style={{ color: colors.textMuted, marginTop: "8px" }}>Monitor and review vendor applications</p>
        </header>

        {/* FILTERS & SEARCH */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "12px", 
          marginBottom: "25px",
          backgroundColor: colors.card,
          padding: "20px",
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          alignItems: "center"
        }}>
          <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select style={selectStyle} value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Type</option>
            <option value="INDIVIDUAL">INDIVIDUAL</option>
            <option value="COMPANY">COMPANY</option>
          </select>

          <select style={selectStyle} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="vendorID">ID</option>
            <option value="status">Status</option>
            <option value="type">Type</option>
          </select>

          <select style={selectStyle} value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="asc">ASC</option>
            <option value="desc">DESC</option>
          </select>

          <button onClick={() => fetchVendors(0)} style={btnPrimary}>Apply</button>
          
          <div style={{ flexGrow: 1 }}></div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="number"
              placeholder="Search ID..."
              style={inputStyle}
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
            />
            <button onClick={handleSearchById} style={btnSecondary}>Search</button>
            <button onClick={handleReset} style={{...btnSecondary, color: colors.error}}>Reset</button>
          </div>
        </div>

        {/* NOTIFICATION */}
        {message && (
          <div style={{
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "25px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.3s ease",
            border: `1px solid ${messageType === "success" ? colors.success : colors.error}`,
            backgroundColor: messageType === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: messageType === "success" ? colors.success : colors.error,
          }}>
            {messageType === "success" ? "✅ " : "❌ "} {message}
          </div>
        )}

        {/* TABLE */}
        <div style={{
          backgroundColor: colors.card,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
          border: `1px solid ${colors.border}`
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "rgba(255,255,255,0.02)" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Company Name</th>
                <th style={thStyle}>Full Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>User ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => {
                const style = statusStyle(vendor.status);
                return (
                  <tr 
                    key={vendor.vendorID} 
                    style={{ borderBottom: `1px solid ${colors.border}`, transition: "background 0.2s" }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={tdStyle}>{vendor.vendorID}</td>
                    <td style={{ ...tdStyle, fontWeight: "600", color: colors.textMain }}>
                      {vendor.companyName || "—"}
                    </td>
                    <td style={tdStyle}>
                      {vendor.user?.fullName || "N/A"}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: colors.textMuted }}>{vendor.type}</span>
                    </td>
                    <td style={tdStyle}>{vendor.user?.userID}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.color}`
                      }}>
                        {vendor.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {vendor.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button 
                            onClick={() => handleUpdateStatus(vendor.vendorID, "APPROVED")} 
                            style={actionBtn(colors.success)}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(vendor.vendorID, "REJECTED")} 
                            style={actionBtn(colors.error)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: "13px", fontStyle: "italic" }}>
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: colors.accent }}>
              <span style={{ display: "inline-block", animation: "pulse 1.5s infinite" }}>⏳ Loading vendors...</span>
            </div>
          )}
          {!loading && vendors.length === 0 && (
            <div style={{ padding: "60px", textAlign: "center", color: colors.textMuted }}>
              No data found for the current filter.
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
            <button 
              disabled={page === 0} 
              onClick={() => fetchVendors(page - 1)}
              style={page === 0 ? btnDisabled : btnSecondary}
            >
              Previous
            </button>
            <div style={{ color: colors.textMuted, fontSize: "14px" }}>
              Page <span style={{ color: colors.textMain, fontWeight: "bold" }}>{page + 1}</span> of {totalPages}
            </div>
            <button 
              disabled={page + 1 === totalPages} 
              onClick={() => fetchVendors(page + 1)}
              style={page + 1 === totalPages ? btnDisabled : btnSecondary}
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      {/* Mini CSS for animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ===============================
// STYLES OBJECTS
// ===============================
const thStyle = { 
  padding: "16px 20px", 
  fontSize: "12px", 
  textTransform: "uppercase", 
  color: "#94a3b8", 
  letterSpacing: "1px",
  fontWeight: "600" 
};

const tdStyle = { 
  padding: "16px 20px", 
  fontSize: "14px", 
  color: "#cbd5e1",
  verticalAlign: "middle"
};

const selectStyle = {
  backgroundColor: "#1e293b",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "10px 14px",
  borderRadius: "8px",
  outline: "none",
  fontSize: "14px",
  cursor: "pointer"
};

const inputStyle = {
  ...selectStyle,
  width: "140px",
  backgroundColor: "#0f172a"
};

const btnPrimary = {
  backgroundColor: "#38bdf8",
  color: "#0f172a",
  border: "none",
  padding: "10px 24px",
  borderRadius: "8px",
  fontWeight: "700",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.2s"
};

const btnSecondary = {
  backgroundColor: "transparent",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "10px 20px",
  borderRadius: "8px",
  fontWeight: "500",
  fontSize: "14px",
  cursor: "pointer"
};

const btnDisabled = {
  ...btnSecondary,
  opacity: 0.3,
  cursor: "not-allowed"
};

const actionBtn = (color) => ({
  backgroundColor: "transparent",
  color: color,
  border: `1px solid ${color}`,
  padding: "6px 14px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.2s",
  textTransform: "uppercase"
});

export default AdminVendorManagement;