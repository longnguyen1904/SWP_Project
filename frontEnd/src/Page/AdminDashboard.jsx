import React, { useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";

export default function AdminDashboard() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "transparent" }}>

            {/* ================= SIDEBAR (DARK GLASS) ================= */}
            <div
                className="text-white border-end border-secondary p-3 shadow-lg"
                style={{
                    width: "280px",
                    backgroundColor: "rgba(0, 0, 0, 0.8)", // Đen mờ để thấy tuyết phía sau
                    backdropFilter: "blur(15px)",
                    zIndex: 10
                }}
            >
                <div className="d-flex align-items-center mb-4 px-2 pt-2">
                    <div className="bg-primary rounded-3 p-2 me-2 shadow-sm">
                        <i className="bi bi-grid-fill text-white"></i>
                    </div>
                    <h5 className="fw-bold mb-0 text-white" style={{ letterSpacing: "1px" }}>ADMIN PANEL</h5>
                </div>

                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item mb-2">
                        <NavLink
                            to="/Page/Admin/AdminVendorManagement"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-primary text-white shadow' : 'text-light opacity-75 hover-opacity-100'
                                }`
                            }
                            style={({ isActive }) => ({
                                color: isActive ? "#ffffff" : "#cfd8dc",
                                fontWeight: isActive ? "600" : "400"
                            })}
                        >
                            <i className="bi bi-shop me-3"></i>
                            Vendor Management
                        </NavLink>
                    </li>

                    <li className="nav-item mb-2">
                        <NavLink
                            to="/Page/Admin/AdminReview"
                            className={({ isActive }) =>
                                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${isActive ? 'bg-primary text-white shadow' : 'text-light opacity-75 hover-opacity-100'
                                }`
                            }
                            style={({ isActive }) => ({
                                color: isActive ? "#ffffff" : "#cfd8dc",
                                fontWeight: isActive ? "600" : "400"
                            })}
                        >
                            <i className="bi bi-chat-dots me-3"></i>
                            Review Management
                        </NavLink>
                    </li>
                </ul>

                <hr className="border-secondary opacity-50" />

                <div className="px-2 mt-auto pb-3">
                    <div className="text-secondary small fw-bold mb-3 text-uppercase" style={{ fontSize: '0.7rem' }}>Hệ thống</div>
                    <Link to="/" className="nav-link text-danger p-2 small d-flex align-items-center fw-bold bg-danger bg-opacity-10 rounded">
                        <i className="bi bi-box-arrow-left me-2"></i> Exit Dashboard
                    </Link>
                </div>
            </div>

            {/* ================= MAIN AREA ================= */}
            <div className="flex-grow-1 d-flex flex-column">

                {/* ========== TOPBAR (MODERN GLASS) ========== */}
                <nav className="navbar navbar-expand px-4 py-3" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>

                    <div className="d-flex position-relative" style={{ width: "400px" }}>
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

                {/* ========== CONTENT AREA ========== */}
                <div className="container-fluid p-4 overflow-auto" style={{ flex: 1 }}>
                    <div className="text-white">
                        {/* Truyền searchTerm xuống các trang con để lọc dữ liệu */}
                        <Outlet context={{ searchTerm }} />
                    </div>
                </div>

            </div>
        </div>
    );
}
