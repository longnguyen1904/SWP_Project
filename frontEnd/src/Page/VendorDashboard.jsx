import React, { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { vendorAPI, uploadAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";

const VS = {
  APPROVED: "APPROVED",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
};

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const [vendorStatus, setVendorStatus] = useState(null); // null = loading
  const [statusNote, setStatusNote] = useState(""); // reason for suspension or rejection

  // Upload / resubmit state — shared for SUSPENDED and REJECTED
  const [identificationUrl, setIdentificationUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await vendorAPI.getMyVendorStatus();
        const data = unwrapResponse(res);

        if (!data.registered) {
          navigate("/");
          return;
        }

        setVendorStatus(data.status);

        if (data.status === VS.SUSPENDED || data.status === VS.REJECTED) {
          setStatusNote(data.rejectionNote || "");
        }
      } catch (err) {
        const vs = localStorage.getItem("vendorStatus");
        setVendorStatus(vs || null);
        if (vs === VS.SUSPENDED || vs === VS.REJECTED) {
          setStatusNote(
            localStorage.getItem("suspendReason") ||
              localStorage.getItem("rejectionNote") ||
              "",
          );
        }
      }
    };
    checkStatus();
  }, [navigate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setSubmitError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadAPI.uploadImage(formData);
      const data = unwrapResponse(res);
      setIdentificationUrl(data.url || data);
    } catch (err) {
      setSubmitError(
        "Upload failed: " + getApiErrorMessage(err, "Cannot upload file"),
      );
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = async () => {
    if (!identificationUrl.trim()) {
      setSubmitError("Please upload or enter a verification document URL.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");
    try {
      await vendorAPI.resubmitIdentification({
        identificationUrl: identificationUrl.trim(),
      });
      setSubmitMessage(
        "Verification documents resubmitted successfully! Please wait for Admin approval.",
      );

      localStorage.setItem("vendorStatus", VS.PENDING);
      localStorage.removeItem("suspendReason");
      localStorage.removeItem("rejectionNote");

      setTimeout(() => {
        setVendorStatus(VS.PENDING);
      }, 1500);
    } catch (err) {
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resubmit documents.";
      setSubmitError(`[${err?.response?.status ?? "ERR"}] ${detail}`);
      console.error("resubmitIdentification error:", err?.response ?? err);
    } finally {
      setSubmitting(false);
    }
  };

  // ===================== LOADING =====================
  if (vendorStatus === null) {
    return (
      <div style={overlayStyle}>
        <p style={{ color: "#94a3b8", fontSize: "16px" }}>
          ⏳ Checking account status...
        </p>
      </div>
    );
  }

  // ===================== PENDING: WAITING FOR APPROVAL =====================
  if (vendorStatus === VS.PENDING) {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div
            style={{
              ...iconWrapStyle,
              borderColor: "rgba(56,189,248,0.3)",
              backgroundColor: "rgba(56,189,248,0.15)",
            }}
          >
            <span style={{ fontSize: "36px" }}>⏳</span>
          </div>
          <h2
            style={{
              color: "#38bdf8",
              marginBottom: "12px",
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            Pending Admin Approval
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              lineHeight: "1.6",
              marginBottom: "24px",
            }}
          >
            Your application has been submitted successfully. Please wait while
            our Admin team reviews and activates your Vendor account. You will
            be notified once a decision is made.
          </p>
          <div style={infoBannerStyle}>
            <p style={{ color: "#7dd3fc", fontSize: "13px", margin: 0 }}>
              💡 While waiting, you can still browse products as a customer.
            </p>
          </div>
          <Link to="/" style={primaryBtnStyle}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ===================== SUSPENDED or REJECTED: RESUBMIT FORM =====================
  if (vendorStatus === VS.SUSPENDED || vendorStatus === VS.REJECTED) {
    const isSuspended = vendorStatus === VS.SUSPENDED;

    const accentColor = isSuspended ? "#f59e0b" : "#ef4444";
    const iconBg = isSuspended
      ? "rgba(245,158,11,0.15)"
      : "rgba(239,68,68,0.15)";
    const iconBorder = isSuspended
      ? "rgba(245,158,11,0.3)"
      : "rgba(239,68,68,0.3)";
    const icon = isSuspended ? "⚠️" : "❌";
    const title = isSuspended
      ? "Vendor Account Suspended"
      : "Vendor Application Rejected";
    const description = isSuspended
      ? "Your vendor account has been suspended by an administrator. Please provide updated verification documents to be considered for reactivation."
      : "Unfortunately, your Vendor application was rejected. Please provide valid verification documents to be reviewed again.";
    const noteLabel = isSuspended
      ? "Reason for suspension:"
      : "Reason for rejection:";

    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div
            style={{
              ...iconWrapStyle,
              borderColor: iconBorder,
              backgroundColor: iconBg,
            }}
          >
            <span style={{ fontSize: "36px" }}>{icon}</span>
          </div>

          <h2
            style={{
              color: accentColor,
              marginBottom: "12px",
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "15px",
              lineHeight: "1.6",
              marginBottom: "8px",
            }}
          >
            {description}
          </p>

          {statusNote && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "12px",
                padding: "14px 18px",
                marginBottom: "24px",
                textAlign: "left",
              }}
            >
              <strong style={{ color: "#ef4444", fontSize: "13px" }}>
                {noteLabel}
              </strong>
              <p
                style={{
                  color: "#fca5a5",
                  fontSize: "14px",
                  margin: "6px 0 0",
                }}
              >
                {statusNote}
              </p>
            </div>
          )}

          <div style={{ textAlign: "left", marginBottom: "16px" }}>
            <label
              style={{
                color: "#e2e8f0",
                fontSize: "14px",
                fontWeight: "600",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Verification Documents (ID Card/Business License){" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={uploading || submitting}
              style={{
                width: "100%",
                backgroundColor: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "14px",
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              Or paste direct URL:
            </div>
            <input
              type="text"
              placeholder="https://example.com/identification.jpg"
              value={identificationUrl}
              onChange={(e) => setIdentificationUrl(e.target.value)}
              disabled={uploading || submitting}
              style={{
                width: "100%",
                backgroundColor: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #334155",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {uploading && (
            <p
              style={{
                color: "#38bdf8",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              ⏳ Uploading...
            </p>
          )}
          {submitError && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "12px",
                color: "#ef4444",
                fontSize: "14px",
              }}
            >
              {submitError}
            </div>
          )}
          {submitMessage && (
            <div
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
                marginBottom: "12px",
                color: "#22c55e",
                fontSize: "14px",
              }}
            >
              ✅ {submitMessage}
            </div>
          )}

          <button
            onClick={handleResubmit}
            disabled={submitting || uploading || !identificationUrl.trim()}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor:
                submitting || uploading || !identificationUrl.trim()
                  ? "#334155"
                  : accentColor,
              color:
                submitting || uploading || !identificationUrl.trim()
                  ? "#64748b"
                  : isSuspended
                    ? "#0f172a"
                    : "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor:
                submitting || uploading || !identificationUrl.trim()
                  ? "not-allowed"
                  : "pointer",
              marginBottom: "12px",
              transition: "all 0.2s",
            }}
          >
            {submitting ? "Sending..." : "Resubmit Verification Documents"}
          </button>

          <Link
            to="/"
            style={{
              display: "block",
              color: "#94a3b8",
              fontSize: "14px",
              textDecoration: "none",
              marginTop: "8px",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ===================== APPROVED: NORMAL DASHBOARD =====================
  return (
    <div
      className="d-flex"
      style={{ minHeight: "100vh", backgroundColor: "transparent" }}
    >
      <div
        className="text-white border-end border-secondary p-3 shadow-lg"
        style={{
          width: "280px",
          backgroundColor: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(15px)",
          zIndex: 10,
        }}
      >
        <div className="d-flex align-items-center mb-4 px-2 pt-2">
          <div className="bg-success rounded-3 p-2 me-2 shadow-sm">
            <i className="bi bi-shop-window text-white"></i>
          </div>
          <h5
            className="fw-bold mb-0 text-white"
            style={{ letterSpacing: "1px" }}
          >
            VENDOR HUB
          </h5>
        </div>

        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/RevenueDashboard"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-graph-up me-3"></i>
              Revenue Dashboard
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/QualityAnalyticsDashboard"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-graph-up me-3"></i>
              Quality Analytics Dashboard
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/VendorTicketManagement"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-box-seam me-3"></i>
              Vendor Ticket Management
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/MyProducts"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-box-seam me-3"></i>
              My Products
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/ProductUpload"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-cloud-upload me-3"></i>
              Upload Product
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/VersionControl"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-clock-history me-3"></i>
              Version Control
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/LicenseTiers"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-layers me-3"></i>
              License Tiers
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/CouponManagement"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-ticket-perforated me-3"></i>
              Coupons
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/Wallet"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-wallet2 me-3"></i>
              Wallet & Payouts
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/FollowedVendors"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-people me-3"></i>
              Followed Vendors
            </NavLink>
          </li>
          <li className="nav-item mb-2">
            <NavLink
              to="/Page/Vendor/Profile"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive
                    ? "bg-success text-white shadow"
                    : "text-light opacity-75"
                }`
              }
            >
              <i className="bi bi-person-gear me-3"></i>
              Profile Settings
            </NavLink>
          </li>
          {[
            {
              to: "/Page/Vendor/RevenueDashboard",
              icon: "bi-graph-up",
              label: "Revenue Dashboard",
            },
            {
              to: "/Page/Vendor/QualityAnalyticsDashboard",
              icon: "bi-graph-up",
              label: "Quality Analytics",
            },
            {
              to: "/Page/Vendor/VendorTicketManagement",
              icon: "bi-box-seam",
              label: "Ticket Management",
            },
            {
              to: "/Page/Vendor/MyProducts",
              icon: "bi-box-seam",
              label: "My Products",
            },
            {
              to: "/Page/Vendor/VersionControl",
              icon: "bi-clock-history",
              label: "Version Control",
            },
            {
              to: "/Page/Vendor/LicenseTiers",
              icon: "bi-layers",
              label: "License Tiers",
            },
            {
              to: "/Page/Vendor/CouponManagement",
              icon: "bi-ticket-perforated",
              label: "Coupons",
            },
            {
              to: "/Page/Vendor/Wallet",
              icon: "bi-wallet2",
              label: "Wallet & Payouts",
            },
            {
              to: "/Page/Vendor/Profile",
              icon: "bi-person-gear",
              label: "Profile Settings",
            },
          ].map(({ to, icon, label }) => (
            <li key={to} className="nav-item mb-2">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? "bg-success text-white shadow" : "text-light opacity-75"}`
                }
              >
                <i className={`bi ${icon} me-3`}></i>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <hr className="border-secondary opacity-50" />

        <div className="px-2 mt-auto pb-3">
          <Link
            to="/"
            className="nav-link text-danger p-2 small d-flex align-items-center fw-bold bg-danger bg-opacity-10 rounded"
          >
            <i className="bi bi-arrow-left-circle me-2"></i> Return to Store
          </Link>
        </div>
      </div>

      <div className="flex-grow-1 d-flex flex-column">
        <div
          className="container-fluid p-4"
          style={{ flex: 1, overflowY: "auto" }}
        >
          <Outlet context={{ searchTerm }} />
        </div>
      </div>
    </div>
  );
}

// ===================== SHARED STYLES =====================
const overlayStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(15,23,42,0.97)",
  backdropFilter: "blur(20px)",
  padding: "20px",
};

const cardStyle = {
  backgroundColor: "#1e293b",
  borderRadius: "24px",
  padding: "48px 40px",
  maxWidth: "520px",
  width: "100%",
  border: "1px solid #334155",
  boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
  textAlign: "center",
};

const iconWrapStyle = {
  width: "72px",
  height: "72px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 24px",
  border: "2px solid",
};

const infoBannerStyle = {
  backgroundColor: "rgba(56,189,248,0.08)",
  border: "1px solid rgba(56,189,248,0.2)",
  borderRadius: "12px",
  padding: "14px 18px",
  marginBottom: "28px",
  textAlign: "left",
};

const primaryBtnStyle = {
  display: "inline-block",
  backgroundColor: "#0ea5e9",
  color: "#fff",
  padding: "12px 32px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "15px",
};
