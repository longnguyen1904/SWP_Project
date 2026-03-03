import React, { useState } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";

export default function CustomerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "transparent" }}>
      
      {/* ================= CUSTOMER SIDEBAR ================= */}
      <div
        className="text-white border-end border-secondary p-3 shadow-lg"
        style={{ 
          width: "280px", 
          backgroundColor: "rgba(0, 0, 0, 0.8)", 
          backdropFilter: "blur(15px)", 
          zIndex: 10 
        }}
      >
        <div className="d-flex align-items-center mb-4 px-2 pt-2">
          <div className="bg-info rounded-3 p-2 me-2 shadow-sm">
             <i className="bi bi-person-badge-fill text-dark"></i>
          </div>
          <h5 className="fw-bold mb-0 text-white" style={{ letterSpacing: "1px" }}>MY ACCOUNT</h5>
        </div>

        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <NavLink 
              to="purchased" 
              className={({ isActive }) => 
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive ? 'bg-info text-dark shadow fw-bold' : 'text-light opacity-75'
                }`
              }
            >
              <i className="bi bi-bag-check me-3"></i>
              Đã mua (Purchased)
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink 
              to="profile" 
              className={({ isActive }) => 
                `nav-link d-flex align-items-center py-2.5 px-3 rounded-3 transition-all ${
                  isActive ? 'bg-info text-dark shadow fw-bold' : 'text-light opacity-75'
                }`
              }
            >
              <i className="bi bi-person-gear me-3"></i>
              Hồ sơ cá nhân
            </NavLink>
          </li>
        </ul>

        <hr className="border-secondary opacity-50" />

        <div className="px-2 mt-auto pb-3">
          <Link to="/" className="nav-link text-white-50 p-2 small d-flex align-items-center">
            <i className="bi bi-house-door me-2"></i> Quay lại trang chủ
          </Link>
        </div>
      </div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-grow-1 d-flex flex-column">

        {/* ========== TOPBAR (SEARCH CHỮ TRẮNG) ========== */}
        <nav className="navbar navbar-expand px-4 py-3" style={{ backgroundColor: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="d-flex position-relative" style={{ width: "350px" }}>
            <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-white-50">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control ps-5 border-0 text-white shadow-none custom-placeholder"
              type="search"
              placeholder="Tìm kiếm đơn hàng của bạn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "10px" }}
            />
          </div>


        </nav>

        {/* ========== CONTENT ========== */}
        <div className="container-fluid p-4 overflow-auto" style={{ flex: 1 }}>
           <div className="text-white">
              <Outlet context={{ searchTerm }} />
           </div>
        </div>

      </div>

      <style>
        {`
          .custom-placeholder::placeholder {
            color: white !important;
            opacity: 0.7;
          }
        `}
      </style>
    </div>
  );
}
