import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../public/logo_no_bg.png";
import Register from "./Register";
import "../Style/Navbar.css";

import { isAuthenticated, logOut } from "../services/authService";

// Giả sử có hàm kiểm tra quyền admin, ví dụ:
function isAdmin() {
  // TODO: Thay bằng logic thực tế lấy từ localStorage hoặc context
  return localStorage.getItem("role") === "ADMIN";
}

export default function Navbar() {
  const dialog = useRef();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [admin, setAdmin] = useState(isAdmin());

  function handleClick() {
    dialog.current.showModal();
  }

  function handleLogout() {
    logOut();
    setLoggedIn(false);
  }

  useEffect(() => {
    const updateAuth = () => {
      setLoggedIn(isAuthenticated());
      setAdmin(isAdmin());
    };
    window.addEventListener("authChanged", updateAuth);
    return () => window.removeEventListener("authChanged", updateAuth);
  }, []);

  return (
    <>
      <nav className="navbar">
        <Register ref={dialog}></Register>

        <h1 className="logo">
          <img src={logo} alt="logo" />
        </h1>

        {/* ===== MAIN MENU (4 items) ===== */}
        <ul>
          <li><Link to="../" id="router-link">Home</Link></li>
          <li><Link to="../Page/About" id="router-link">About</Link></li>
          <li><Link to="../Page/Event" id="router-link">Events</Link></li>
          <li><Link to="../Page/Tradition" id="router-link">Traditons</Link></li>
        </ul>

        {/* ===== RIGHT AREA ===== */}
        <div className="navbar-right">

          {loggedIn ? (
            <button className="Register" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="Register" onClick={handleClick}>
              Login / SignUp
            </button>
          )}

          {/* ===== HAMBURGER MENU ===== */}
          <div className="menu-dropdown">
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="dropdown-content">
              <Link to="../Page/ProfilePage" id="router-link">ProfileChange</Link>
              <Link to="../Page/Customer" id="router-link">CustomerDashboard</Link>
              <Link to="../Page/Vendor" id="router-link">Vendor Dashboard</Link>
              <Link to="../Page/Admin" id="router-link">Admin Dashboard</Link>
            </div>
          </div>

        </div>
      </nav>
    </>
  );
}