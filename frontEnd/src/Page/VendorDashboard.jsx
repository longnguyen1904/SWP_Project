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
                            to="/Page/Vendor/VendorTicketManagement"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-success text-white shadow' : 'text-light opacity-75'
                                }`
                            }
                        >
                            <i className="bi bi-box-seam me-3"></i>
                            VendorTicketManagement
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
                <nav className="navbar navbar-expand px-4 py-3" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="d-flex position-relative" style={{ width: "350px" }}>
                        <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-white-50">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            className="form-control ps-5 border-0 text-white shadow-none custom-placeholder"
                            type="search"
                            placeholder="Tìm kiếm nhanh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.12)", // Tăng độ sáng nền một chút
                                borderRadius: "12px",
                                color: "white" // Chữ người dùng nhập
                            }}
                        />

                        {/* Thêm thẻ style này ngay trong component nếu bạn không muốn mở file CSS */}
                        <style>
                            {`
    .custom-placeholder::placeholder {
      color: white !important;
      opacity: 0.8;
    }
  `}
                        </style>
                    </div>


                </nav>

                {/* ========== CHI TIẾT NỘI DUNG (DỮ LIỆU SẼ HIỆN Ở ĐÂY) ========== */}
                <div className="container-fluid p-4 overflow-auto" style={{ flex: 1 }}>
                    <Outlet context={{ searchTerm }} />
                </div>

            </div>
        </div>
    );
} 

