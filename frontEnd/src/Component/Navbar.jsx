import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../public/logo_no_bg.png";
import Register from "./Register";
import "../Style/Navbar.css";

import { isAuthenticated, logOut } from "../services/authService";

function getRole() {
  const role = localStorage.getItem("role");
  if (role) return role.toUpperCase().replace("ROLE_", "");
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const r = user.roleName || user.role;
    return r ? String(r).toUpperCase().replace("ROLE_", "") : null;
  } catch {
    return null;
  }
}
function isAdmin() {
  return getRole() === "ADMIN";
}
function isVendor() {
  return getRole() === "VENDOR";
}
function isCustomer() {
  return getRole() === "CUSTOMER";
}
export default function Navbar() {
  const dialog = useRef();
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [role, setRole] = useState(getRole());

  function handleClick() {
    dialog.current.showModal();
  }

  function handleLogout() {
    logOut();
    setLoggedIn(false);
    setRole(null);
  }

  useEffect(() => {
    const updateAuth = () => {
      setLoggedIn(isAuthenticated());
      setRole(getRole());
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


        <ul>
          <li><Link to="../" id="router-link">Home</Link></li>
          <li><Link to="/marketplace" id="router-link">Marketplace</Link></li>
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


          {loggedIn ? (
            <div className="menu-dropdown">
              <div className="hamburger">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="dropdown-content">
                <Link to="/Page/ProfilePage" id="router-link">ProfileChange</Link>
                {role === "CUSTOMER" && (
                  <>
                  <Link to="/Page/VendorRegistration" id="router-link">Become a Vendor</Link>
                    <Link to="/Page/Customer" id="router-link">CustomerDashboard</Link>
                    
                  </>
                )}
                {role === "VENDOR" && (
                  <>
                    <Link to="/Page/Vendor" id="router-link">Vendor Dashboard</Link>
                    <Link to="/Page/Vendor/ProductUpload" id="router-link">Upload Product</Link>
                   
                  </>
                )}
                {role === "ADMIN" && (
                  <Link to="/Page/Admin" id="router-link">Admin Dashboard</Link>
                )}
              </div>
            </div>
          ) : (
            < >

            </>
          )}



        </div>
      </nav>
    </>
  );
}