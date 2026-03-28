import React, { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const API_BASE = "http://localhost:8081/api/admin/review";
const PAGE_SIZE = 5;

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

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Xác định xem product có cần scan không.
 *
 * FIX: Trước đây check thêm (APPROVED/REJECTED && scanStatus === PENDING)
 * nhưng sau khi backend đã fix, scanStatus luôn phản ánh version mới nhất.
 * Logic đơn giản hơn: cần scan khi scanStatus của version mới nhất là PENDING.
 */
const needsScan = (p) => p.scanStatus === "PENDING"&& p.status !== "REJECTED";

const getScanBadgeStatus = (scanStatus) => {
  if (scanStatus === "CLEAN") return "APPROVED";
  if (scanStatus === "MALICIOUS") return "REJECTED";
  return "PENDING";
};

const getStatusColor = (status) => {
  switch (status) {
    case "APPROVED": return { color: colors.success, bg: "rgba(34,197,94,0.1)" };
    case "REJECTED": return { color: colors.error, bg: "rgba(239,68,68,0.1)" };
    default: return { color: colors.warning, bg: "rgba(245,158,11,0.1)" };
  }
};

const buildUrl = (page, statusFilter, keyword) => {
  let url = `${API_BASE}?page=${page}&size=${PAGE_SIZE}`;
  if (statusFilter) url += `&status=${statusFilter}`;
  if (keyword?.trim()) url += `&keyword=${encodeURIComponent(keyword.trim())}`;
  return url;
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
function AdminReview() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [notification, setNotification] = useState(null); // { message, type }

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state — tách riêng "đang nhập" vs "đang áp dụng"
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");

  // ── Fetch data ──
  const fetchProducts = useCallback(async (targetPage, status, kw) => {
    setLoading(true);
    try {
      const url = buildUrl(targetPage, status, kw);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      setProducts(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
      showNotification("Error loading data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lần đầu
  useEffect(() => {
    fetchProducts(0, "", "");
  }, [fetchProducts]);

  // ── Helpers UI ──
  const showNotification = (message, type) => {
    setNotification({ message, type });
    if (type !== "loading") {
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // ── Handlers ──

  /**
   * Apply filter: cập nhật applied state rồi fetch trang 0.
   */
  const handleApplyFilter = () => {
    setAppliedStatus(statusFilter);
    setAppliedKeyword(keyword);
    fetchProducts(0, statusFilter, keyword);
  };

  /**
   * Reset: xóa hết filter, fetch lại trang 0.
   * FIX: Truyền trực tiếp giá trị rỗng vào fetch thay vì đọc state
   * (state update không đồng bộ trong cùng một render cycle).
   */
  const handleReset = () => {
    setStatusFilter("");
    setKeyword("");
    setAppliedStatus("");
    setAppliedKeyword("");
    fetchProducts(0, "", "");
  };

  /**
   * Chuyển trang: dùng appliedStatus/appliedKeyword để giữ filter hiện tại.
   */
  const handlePageChange = (newPage) => {
    fetchProducts(newPage, appliedStatus, appliedKeyword);
  };

  /**
   * Scan & Review một product.
   */
  const handleScanAndReview = async (productId) => {
    setLoadingId(productId);
    showNotification("System scanning in progress...", "loading");

    try {
      const res = await fetch(`${API_BASE}/${productId}`, { method: "POST" });
      const text = await res.text();
      if (!res.ok) throw new Error(text);

      await fetchProducts(page, appliedStatus, appliedKeyword);

      const isApproved = text.toLowerCase().includes("approved");
      showNotification(
        isApproved ? "✅ Product approved successfully!" : "❌ Product rejected (Security Risk detected)!",
        isApproved ? "success" : "error"
      );
    } catch (err) {
      showNotification("Error: " + err.message, "error");
    } finally {
      setLoadingId(null);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <header style={{ marginBottom: "30px" }}>
          <h2 style={styles.heading}>Product Review Management</h2>
          <p style={{ color: colors.textMuted, marginTop: "8px" }}>
            Automated security scanning and product validation
          </p>
        </header>

        {/* Control Bar */}
        <div style={styles.controlBar}>
          <select
            style={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>

          </select>

          <button onClick={handleApplyFilter} style={styles.btnPrimary}>
            Apply Filter
          </button>

          <div style={{ flexGrow: 1 }} />

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search product..."
              style={styles.input}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
            />
            <button onClick={handleApplyFilter} style={styles.btnSecondary}>
              Search
            </button>
            <button
              onClick={handleReset}
              style={{ ...styles.btnSecondary, color: colors.error }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div style={notifStyle(notification.type)}>
            {notification.message}
          </div>
        )}

        {/* Table */}
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Product Name</th>
                <th style={styles.th}>Vendor</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Rejection Note</th>
                <th style={styles.th}>Latest Version</th>
                <th style={styles.th}>Download</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const statusStyle = getStatusColor(p.status);
                const scanStyle = getStatusColor(getScanBadgeStatus(p.scanStatus));
                const canScan = needsScan(p);

                return (
                  <tr key={p.productID} style={styles.tr}>
                    <td style={styles.td}>#{p.productID}</td>
                    <td style={{ ...styles.td, fontWeight: "600", color: colors.textMain }}>
                      {p.productName}
                    </td>
                    <td style={styles.td}>ID: {p.vendorID}</td>
                    <td style={styles.td}>
                      {Number(p.basePrice).toLocaleString("vi-VN")} VND
                    </td>

                    {/* Product Status */}
                    <td style={styles.td}>
                      <span style={badgeStyle(statusStyle)}>{p.status}</span>
                    </td>

                    {/* Rejection Note */}
                    <td style={{ ...styles.td, fontSize: "12px", color: colors.textMuted }}>
                      {p.status === "REJECTED" ? p.rejectionNote : "—"}
                    </td>

                    {/* Scan Status (version mới nhất) */}
                    <td style={styles.td}>
                      <span style={badgeStyle(scanStyle)}>
                        {p.scanStatus === "CLEAN"
                          ? "CLEAN"
                          : p.scanStatus === "MALICIOUS"
                          ? "MALICIOUS"
                          : "PENDING"}
                      </span>
                    </td>

                    {/* Download */}
                    <td style={styles.td}>
                      {p.scanStatus === "CLEAN" && p.fileUrl && p.status === "APPROVED" ? (
                        <a
                          href={p.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.downloadLink}
                        >
                          Download File
                        </a>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: "12px" }}>
                          Not Available
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      {canScan ? (
                        <button
                          disabled={loadingId === p.productID}
                          onClick={() => handleScanAndReview(p.productID)}
                          style={actionBtnStyle(colors.accent, loadingId === p.productID)}
                        >
                          {loadingId === p.productID ? "Scanning..." : "Scan & Review"}
                        </button>
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
            <div style={styles.loadingOverlay}>⏳ Loading data...</div>
          )}
          {!loading && products.length === 0 && (
            <div style={styles.emptyState}>No records found.</div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              disabled={page === 0}
              onClick={() => handlePageChange(page - 1)}
              style={page === 0 ? styles.btnDisabled : styles.btnSecondary}
            >
              Previous
            </button>
            <div style={{ color: colors.textMuted, fontSize: "14px" }}>
              Page{" "}
              <span style={{ color: colors.textMain, fontWeight: "bold" }}>
                {page + 1}
              </span>{" "}
              of {totalPages}
            </div>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              style={page + 1 >= totalPages ? styles.btnDisabled : styles.btnSecondary}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const notifStyle = (type) => ({
  padding: "16px 20px",
  borderRadius: "12px",
  marginBottom: "25px",
  fontSize: "14px",
  fontWeight: "500",
  border: `1px solid ${type === "success" ? colors.success : type === "loading" ? colors.accent : colors.error}`,
  backgroundColor:
    type === "success"
      ? "rgba(34,197,94,0.1)"
      : type === "loading"
      ? "rgba(56,189,248,0.1)"
      : "rgba(239,68,68,0.1)",
  color:
    type === "success"
      ? colors.success
      : type === "loading"
      ? colors.accent
      : colors.error,
});

const badgeStyle = (s) => ({
  padding: "4px 12px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: "700",
  backgroundColor: s.bg,
  color: s.color,
  border: `1px solid ${s.color}`,
});

const actionBtnStyle = (color, isLoading) => ({
  backgroundColor: "transparent",
  color,
  border: `1px solid ${color}`,
  padding: "6px 14px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: isLoading ? "not-allowed" : "pointer",
  opacity: isLoading ? 0.5 : 1,
  textTransform: "uppercase",
});

const styles = {
  page: {
    padding: "40px 20px",
    backgroundColor: colors.bg,
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    color: colors.textMain,
  },
  container: { maxWidth: "1200px", margin: "0 auto" },
  heading: { fontSize: "28px", fontWeight: "700", margin: 0 },
  controlBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "25px",
    backgroundColor: colors.card,
    padding: "20px",
    borderRadius: "12px",
    border: `1px solid ${colors.border}`,
    alignItems: "center",
  },
  tableCard: {
    backgroundColor: colors.card,
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
    border: `1px solid ${colors.border}`,
    position: "relative",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thead: {
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  th: {
    padding: "16px 20px",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#94a3b8",
    letterSpacing: "1px",
    fontWeight: "600",
  },
  td: { padding: "16px 20px", fontSize: "14px", color: "#cbd5e1" },
  tr: { borderBottom: `1px solid ${colors.border}` },
  select: {
    backgroundColor: "#1e293b",
    color: "#f8fafc",
    border: "1px solid #334155",
    padding: "10px 14px",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
  },
  input: {
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    border: "1px solid #334155",
    padding: "10px 14px",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
    width: "220px",
  },
  btnPrimary: {
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    border: "none",
    padding: "10px 24px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    color: "#f8fafc",
    border: "1px solid #334155",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  btnDisabled: {
    backgroundColor: "transparent",
    color: "#f8fafc",
    border: "1px solid #334155",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "not-allowed",
    opacity: 0.3,
  },
  downloadLink: {
    backgroundColor: "transparent",
    color: colors.success,
    border: `1px solid ${colors.success}`,
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    textDecoration: "none",
    display: "inline-block",
    textTransform: "uppercase",
  },
  pagination: {
    marginTop: "30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
  },
  loadingOverlay: {
    padding: "40px",
    textAlign: "center",
    color: colors.accent,
    fontWeight: "600",
  },
  emptyState: {
    padding: "60px",
    textAlign: "center",
    color: colors.textMuted,
  },
};

export default AdminReview;