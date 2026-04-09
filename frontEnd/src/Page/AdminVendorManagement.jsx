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

  // States cho Modal nhập lý do
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [tempStatus, setTempStatus] = useState("");
  const [reason, setReason] = useState("");

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
    modalOverlay: "rgba(0, 0, 0, 0.75)",
  };

  const statusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return { color: colors.success, bg: "rgba(34, 197, 94, 0.1)" };
      case "REJECTED":
        return { color: colors.error, bg: "rgba(239, 68, 68, 0.1)" };
      case "SUSPENDED":
        return { color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)" };
      default:
        return { color: colors.warning, bg: "rgba(245, 158, 11, 0.1)" };
    }
  };

  // FETCH VENDORS
  const fetchVendors = async (customPage = page) => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/admin/vendors?page=${customPage}&size=${size}&sortBy=${sortBy}&direction=${direction}`;
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

  // SEARCH BY ID
  const handleSearchById = async () => {
    if (!searchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/vendors/${searchId}`);
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

  // MODAL LOGIC
  const openReasonModal = (vendorID, nextStatus) => {
    setSelectedVendor(vendorID);
    setTempStatus(nextStatus);
    setReason("");
    setShowModal(true);
  };

  const handleConfirmStatus = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason.");
      return;
    }
    await executeUpdateStatus(selectedVendor, tempStatus, reason);
    setShowModal(false);
  };

  // EXECUTE API CALL
  const executeUpdateStatus = async (vendorID, newStatus, note = "") => {
    try {
      const url = note
        ? `${import.meta.env.VITE_API_URL}/api/admin/vendors/${vendorID}/status?status=${newStatus}&rejectionNote=${encodeURIComponent(note)}`
        : `${import.meta.env.VITE_API_URL}/api/admin/vendors/${vendorID}/status?status=${newStatus}`;

      const res = await fetch(url, { method: "PUT" });
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
      color: colors.textMain,
      position: "relative"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "20px" }}>Vendor Management</h2>

        {/* FILTER BAR */}
        <div style={filterBarStyle(colors)}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SUSPENDED">SUSPENDED</option>
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

          <button onClick={() => fetchVendors(0)} style={btnPrimary}>Apply</button>

          <div style={{ flexGrow: 1 }}></div>

          <input
            type="number"
            placeholder="Search ID..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            style={{ ...selectStyle, width: "120px" }}
          />
          <button onClick={handleSearchById} style={btnSecondary}>Search</button>
          <button onClick={handleReset} style={{ ...btnSecondary, color: colors.error }}>Reset</button>
        </div>

        {/* MESSAGE */}
        {message && (
          <div style={messageStyle(messageType, colors)}>{message}</div>
        )}

        {/* TABLE */}
        <div style={tableContainerStyle(colors)}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Full Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Docs</th>
                <th style={thStyle}>Note</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => {
                const sStyle = statusStyle(vendor.status);
                return (
                  <tr key={vendor.vendorID} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={tdStyle}>{vendor.vendorID}</td>
                    <td style={tdStyle}>{vendor.companyName || "—"}</td>
                    <td style={tdStyle}>{vendor.user?.fullName || "N/A"}</td>
                    <td style={tdStyle}>{vendor.type}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(sStyle)}>{vendor.status}</span>
                    </td>
                    <td style={tdStyle}>
                      {vendor.identificationDoc ? (
                        <a href={vendor.identificationDoc} target="_blank" rel="noreferrer" style={{ color: colors.accent }}>View</a>
                      ) : "—"}
                    </td>
                    <td style={tdStyle}>{vendor.rejectionNote || "—"}</td>
                    <td style={tdStyle}>
                      {vendor.status === "PENDING" && (
                        <>
                          <button onClick={() => executeUpdateStatus(vendor.vendorID, "APPROVED")} style={actionBtn(colors.success)}>Approve</button>
                          <button onClick={() => openReasonModal(vendor.vendorID, "REJECTED")} style={actionBtn(colors.error)}>Reject</button>
                        </>
                      )}
                      {vendor.status === "APPROVED" && (
                        <button onClick={() => openReasonModal(vendor.vendorID, "SUSPENDED")} style={actionBtn(colors.warning)}>Suspend</button>
                      )}
                      {vendor.status === "SUSPENDED" && <span style={{ color: colors.textMuted }}>Suspended</span>}
                      {vendor.status === "REJECTED" && <span style={{ color: colors.textMuted }}>Rejected</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button disabled={page === 0} onClick={() => fetchVendors(page - 1)} style={btnSecondary}>Prev</button>
            <span style={{ margin: "0 15px" }}>{page + 1} / {totalPages}</span>
            <button disabled={page + 1 === totalPages} onClick={() => fetchVendors(page + 1)} style={btnSecondary}>Next</button>
          </div>
        )}
      </div>

      {/* REASON MODAL */}
      {showModal && (
        <div style={modalOverlayStyle(colors)}>
          <div style={modalContentStyle(colors)}>
            <h3 style={{ marginBottom: "10px" }}>Confirm Action</h3>
            <p style={{ color: colors.textMuted, fontSize: "14px", marginBottom: "15px" }}>
              Please provide a reason for setting status to <strong>{tempStatus}</strong>:
            </p>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Invalid business license / Violation of terms..."
              style={textAreaStyle(colors)}
              rows="4"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowModal(false)} style={btnSecondary}>Cancel</button>
              <button
                onClick={handleConfirmStatus}
                style={{
                  ...btnPrimary,
                  backgroundColor: tempStatus === "REJECTED" ? colors.error : colors.warning,
                  color: "#fff"
                }}
              >
                Confirm {tempStatus}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const filterBarStyle = (colors) => ({
  display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px",
  backgroundColor: colors.card, padding: "15px", borderRadius: "12px", border: `1px solid ${colors.border}`
});

const tableContainerStyle = (colors) => ({
  backgroundColor: colors.card, borderRadius: "16px", overflow: "hidden", border: `1px solid ${colors.border}`
});

const messageStyle = (type, colors) => ({
  padding: "12px 16px", marginBottom: "15px", borderRadius: "8px",
  border: `1px solid ${type === "success" ? colors.success : colors.error}`,
  color: type === "success" ? colors.success : colors.error
});

const badgeStyle = (sStyle) => ({
  padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
  backgroundColor: sStyle.bg, color: sStyle.color, border: `1px solid ${sStyle.color}`
});

const modalOverlayStyle = (colors) => ({
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: colors.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, backdropFilter: "blur(4px)"
});

const modalContentStyle = (colors) => ({
  backgroundColor: colors.card, padding: "30px", borderRadius: "20px",
  width: "450px", border: `1px solid ${colors.border}`, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
});

const textAreaStyle = (colors) => ({
  width: "100%", backgroundColor: colors.bg, color: colors.textMain,
  border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "12px",
  fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box"
});

const thStyle = { padding: "14px 16px", fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", textAlign: "left" };
const tdStyle = { padding: "14px 16px", fontSize: "14px", color: "#cbd5e1" };
const selectStyle = { backgroundColor: "#1e293b", color: "#f8fafc", border: "1px solid #334155", padding: "8px 12px", borderRadius: "6px", fontSize: "13px" };
const btnPrimary = { backgroundColor: "#38bdf8", color: "#0f172a", border: "none", padding: "8px 18px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" };
const btnSecondary = { backgroundColor: "transparent", color: "#f8fafc", border: "1px solid #334155", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" };
const actionBtn = (color) => ({ marginRight: "6px", background: "transparent", border: `1px solid ${color}`, color: color, padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" });

export default AdminVendorManagement;