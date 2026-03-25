import React, { useState, useEffect } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { vendorAPI, uploadAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";

export default function VendorDashboard() {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Suspend state
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspendReason, setSuspendReason] = useState("");
    const [identificationUrl, setIdentificationUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState("");
    const [submitError, setSubmitError] = useState("");

    // Check vendor status on mount
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await vendorAPI.getMyVendorStatus();
                const data = unwrapResponse(res);
                if (data.status === "SUSPENDED") {
                    setIsSuspended(true);
                    setSuspendReason(data.rejectionNote || "");
                }
            } catch (err) {
                // If not a vendor or error, check localStorage fallback
                const vs = localStorage.getItem("vendorStatus");
                if (vs === "SUSPENDED") {
                    setIsSuspended(true);
                    setSuspendReason(localStorage.getItem("suspendReason") || "");
                }
            }
        };
        checkStatus();
    }, []);

    // Handle file upload for identification doc
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
            setSubmitError("Upload failed: " + getApiErrorMessage(err, "Cannot upload file"));
        } finally {
            setUploading(false);
        }
    };

    // Submit resubmit identification
    const handleResubmit = async () => {
        if (!identificationUrl.trim()) {
            setSubmitError("Vui lòng upload hoặc nhập URL giấy tờ xác minh.");
            return;
        }
        setSubmitting(true);
        setSubmitError("");
        setSubmitMessage("");
        try {
            await vendorAPI.resubmitIdentification({ identificationUrl: identificationUrl.trim() });
            setSubmitMessage("Đã gửi lại giấy tờ xác minh thành công! Vui lòng chờ Admin duyệt.");
            // Clear suspend info from localStorage
            localStorage.removeItem("vendorStatus");
            localStorage.removeItem("suspendReason");
            setTimeout(() => {
                navigate("/");
            }, 2500);
        } catch (err) {
            setSubmitError(getApiErrorMessage(err, "Không thể gửi lại giấy tờ xác minh."));
        } finally {
            setSubmitting(false);
        }
    };

    // ===================== SUSPEND OVERLAY =====================
    if (isSuspended) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(15, 23, 42, 0.97)",
                backdropFilter: "blur(20px)",
                padding: "20px"
            }}>
                <div style={{
                    backgroundColor: "#1e293b",
                    borderRadius: "24px",
                    padding: "48px 40px",
                    maxWidth: "520px",
                    width: "100%",
                    border: "1px solid #334155",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                    textAlign: "center"
                }}>
                    {/* Warning Icon */}
                    <div style={{
                        width: "72px", height: "72px", borderRadius: "50%",
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 24px", border: "2px solid rgba(245, 158, 11, 0.3)"
                    }}>
                        <span style={{ fontSize: "36px" }}>⚠️</span>
                    </div>

                    <h2 style={{ color: "#f59e0b", marginBottom: "12px", fontSize: "24px", fontWeight: "700" }}>
                        Tài khoản Vendor đã bị tạm ngưng
                    </h2>
                    <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: "1.6", marginBottom: "8px" }}>
                        Tài khoản vendor của bạn đã bị quản trị viên tạm ngưng hoạt động.
                        Vui lòng cung cấp lại giấy tờ xác minh để được xem xét kích hoạt lại.
                    </p>

                    {suspendReason && (
                        <div style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "12px", padding: "14px 18px",
                            marginBottom: "24px", textAlign: "left"
                        }}>
                            <strong style={{ color: "#ef4444", fontSize: "13px" }}>Lý do:</strong>
                            <p style={{ color: "#fca5a5", fontSize: "14px", margin: "6px 0 0" }}>{suspendReason}</p>
                        </div>
                    )}

                    {/* Upload or paste URL */}
                    <div style={{ textAlign: "left", marginBottom: "16px" }}>
                        <label style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                            Giấy tờ xác minh (CCCD/Giấy phép kinh doanh) <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileUpload}
                            disabled={uploading || submitting}
                            style={{
                                width: "100%", backgroundColor: "#0f172a", color: "#f8fafc",
                                border: "1px solid #334155", borderRadius: "10px", padding: "10px 14px",
                                fontSize: "14px", marginBottom: "10px", boxSizing: "border-box"
                            }}
                        />
                        <div style={{ color: "#64748b", fontSize: "12px", marginBottom: "8px" }}>
                            Hoặc dán trực tiếp URL:
                        </div>
                        <input
                            type="text"
                            placeholder="https://example.com/identification.jpg"
                            value={identificationUrl}
                            onChange={(e) => setIdentificationUrl(e.target.value)}
                            disabled={uploading || submitting}
                            style={{
                                width: "100%", backgroundColor: "#0f172a", color: "#f8fafc",
                                border: "1px solid #334155", borderRadius: "10px", padding: "12px 14px",
                                fontSize: "14px", outline: "none", boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {uploading && (
                        <p style={{ color: "#38bdf8", fontSize: "14px", marginBottom: "12px" }}>
                            ⏳ Đang tải lên...
                        </p>
                    )}

                    {submitError && (
                        <div style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
                            color: "#ef4444", fontSize: "14px"
                        }}>
                            {submitError}
                        </div>
                    )}

                    {submitMessage && (
                        <div style={{
                            backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)",
                            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
                            color: "#22c55e", fontSize: "14px"
                        }}>
                            ✅ {submitMessage}
                        </div>
                    )}

                    <button
                        onClick={handleResubmit}
                        disabled={submitting || uploading || !identificationUrl.trim()}
                        style={{
                            width: "100%", padding: "14px",
                            backgroundColor: submitting || uploading || !identificationUrl.trim() ? "#334155" : "#f59e0b",
                            color: submitting || uploading || !identificationUrl.trim() ? "#64748b" : "#0f172a",
                            border: "none", borderRadius: "12px",
                            fontSize: "16px", fontWeight: "700",
                            cursor: submitting || uploading || !identificationUrl.trim() ? "not-allowed" : "pointer",
                            marginBottom: "12px",
                            transition: "all 0.2s"
                        }}
                    >
                        {submitting ? "Đang gửi..." : "Gửi lại giấy tờ xác minh"}
                    </button>

                    <Link to="/" style={{
                        display: "block", color: "#94a3b8", fontSize: "14px",
                        textDecoration: "none", marginTop: "8px"
                    }}>
                        ← Trở về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    // ===================== NORMAL DASHBOARD =====================
    return (
        <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "transparent" }}>

            {/* ================= SIDEBAR (VENDOR STYLE) ================= */}
            <div
                className="text-white border-end border-secondary p-3 shadow-lg"
                style={{
                    width: "280px",
                    backgroundColor: "rgba(0, 0, 0, 0.85)",
                    backdropFilter: "blur(15px)",
                    zIndex: 10
                }}
            >
                <div className="d-flex align-items-center mb-4 px-2 pt-2">
                    <div className="bg-success rounded-3 p-2 me-2 shadow-sm">
                        <i className="bi bi-shop-window text-white"></i>
                    </div>
                    <h5 className="fw-bold mb-0 text-white" style={{ letterSpacing: "1px" }}>VENDOR HUB</h5>
                </div>

                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item mb-2">
                        <NavLink
                            to="/Page/Vendor/RevenueDashboard"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
                                }`
                            }
                        >
                            <i className="bi bi-ticket-perforated me-3"></i>
                            Mã giảm giá
                        </NavLink>
                    </li>
                    <li className="nav-item mb-2">
                        <NavLink
                            to="/Page/Vendor/Wallet"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
                                }`
                            }
                        >
                            <i className="bi bi-wallet2 me-3"></i>
                            Ví & Rút tiền
                        </NavLink>
                    </li>
                    <li className="nav-item mb-2">
                        <NavLink
                            to="/Page/Vendor/Profile"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
                                }`
                            }
                        >
                            <i className="bi bi-person-gear me-3"></i>
                            Profile Settings
                        </NavLink>
                    </li>
                </ul>

                <hr className="border-secondary opacity-50" />

                <div className="px-2 mt-auto pb-3">
                    <Link to="/" className="nav-link text-danger p-2 small d-flex align-items-center fw-bold bg-danger bg-opacity-10 rounded">
                        <i className="bi bi-arrow-left-circle me-2"></i> Trở về cửa hàng
                    </Link>
                </div>
            </div>

            {/* ================= MAIN CONTENT AREA ================= */}
            <div className="flex-grow-1 d-flex flex-column">

                {/* ========== TOPBAR ========== */}
  

                {/* ========== CHI TIẾT NỘI DUNG (DỮ LIỆU SẼ HIỆN Ở ĐÂY) ========== */}
                <div className="container-fluid p-4" style={{ flex: 1, overflowY: "auto" }}>
                    <Outlet context={{ searchTerm }} />
                </div>

            </div>
        </div>
    );
} 
