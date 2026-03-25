import React, { useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";

export default function VendorDashboard() {
    const [searchTerm, setSearchTerm] = useState("");

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
                            to="/Page/Vendor/FollowedVendors"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
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

