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

  // ================= FETCH =================
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

  // ================= SEARCH =================
  const handleSearchById = async () => {
    if (!searchId) return;
    setLoading(true);
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

  const handleReset = () => {
    setStatus("");
    setType("");
    setSortBy("vendorID");
    setDirection("asc");
    setSearchId("");
    fetchVendors(0);
  };

  // ================= UPDATE STATUS =================
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

  return (
    <div style={{
      padding: "40px 20px",
      backgroundColor: colors.bg,
      minHeight: "100vh",
      color: colors.textMain
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <h2 style={{ marginBottom: "20px" }}>Vendor Management</h2>

        {/* FILTER BAR */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
          backgroundColor: colors.card,
          padding: "15px",
          borderRadius: "12px",
          border: `1px solid ${colors.border}`
        }}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
            <option value="">All Type</option>
            <option value="INDIVIDUAL">INDIVIDUAL</option>
            <option value="COMPANY">COMPANY</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="vendorID">Sort by ID</option>
            <option value="status">Sort by Status</option>
            <option value="type">Sort by Type</option>
          </select>

          <select value={direction} onChange={e => setDirection(e.target.value)} style={selectStyle}>
            <option value="asc">ASC</option>
            <option value="desc">DESC</option>
          </select>

          <button onClick={() => fetchVendors(0)} style={btnPrimary}>
            Apply
          </button>

          <div style={{ flexGrow: 1 }}></div>

          <input
            type="number"
            placeholder="Search ID..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            style={{ ...selectStyle, width: "120px" }}
          />

          <button onClick={handleSearchById} style={btnSecondary}>
            Search
          </button>

          <button onClick={handleReset} style={{ ...btnSecondary, color: colors.error }}>
            Reset
          </button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={{
            padding: "12px 16px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: `1px solid ${messageType === "success" ? colors.success : colors.error}`,
            color: messageType === "success" ? colors.success : colors.error
          }}>
            {message}
          </div>
        )}

        {/* TABLE */}
        <div style={{
          backgroundColor: colors.card,
          borderRadius: "16px",
          overflow: "hidden",
          border: `1px solid ${colors.border}`
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Full Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>User ID</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Identification Doc</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {vendors.map(vendor => {
                const style = statusStyle(vendor.status);
                return (
                  <tr key={vendor.vendorID}
                    style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>{vendor.vendorID}</td>
                    <td style={tdStyle}>{vendor.companyName || "—"}</td>
                    <td style={tdStyle}>{vendor.user?.fullName || "N/A"}</td>
                    <td style={tdStyle}>{vendor.type}</td>
                    <td style={tdStyle}>{vendor.user?.userID}</td>

                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 10px",
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
                      {vendor.identificationDoc ? (
                        <a
                          href={vendor.identificationDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: colors.accent,
                            textDecoration: "underline",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          View here
                        </a>
                      ) : "—"}
                    </td>

                    <td style={tdStyle}>
                      {vendor.status === "PENDING" ? (
                        <>
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
                        </>
                      ) : (
                        <span style={{ color: colors.textMuted }}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              ⏳ Loading...
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              disabled={page === 0}
              onClick={() => fetchVendors(page - 1)}
              style={btnSecondary}
            >
              Previous
            </button>

            <span style={{ margin: "0 15px" }}>
              Page {page + 1} / {totalPages}
            </span>

            <button
              disabled={page + 1 === totalPages}
              onClick={() => fetchVendors(page + 1)}
              style={btnSecondary}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "14px 16px",
  fontSize: "12px",
  color: "#94a3b8",
  textTransform: "uppercase",
  fontWeight: "600"
};

const tdStyle = {
  padding: "14px 16px",
  fontSize: "14px",
  color: "#cbd5e1"
};

const selectStyle = {
  backgroundColor: "#1e293b",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "13px"
};

const btnPrimary = {
  backgroundColor: "#38bdf8",
  color: "#0f172a",
  border: "none",
  padding: "8px 18px",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "13px",
  cursor: "pointer"
};

const btnSecondary = {
  backgroundColor: "transparent",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  cursor: "pointer"
};

const actionBtn = (color) => ({
  marginRight: "6px",
  background: "transparent",
  border: `1px solid ${color}`,
  color: color,
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "12px"
});

export default AdminVendorManagement;