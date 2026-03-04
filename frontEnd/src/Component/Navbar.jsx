import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../public/logo_no_bg.png";
import Register from "./Register";
import "../Style/Navbar.css";

import { isAuthenticated, logOut } from "../services/authService";

function getRole() {
  return localStorage.getItem("role");
}
function isAdmin() {
  return getRole() === "ADMIN";
}
function isVendor() {
  return getRole() === "VENDOR";
}

export default function Navbar() {
  const dialog = useRef(null);

  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [admin, setAdmin] = useState(isAdmin());
  const [vendor, setVendor] = useState(isVendor());

  function handleClick() {
    dialog.current?.showModal();
  }

  function handleLogout() {
    logOut();
    setLoggedIn(false);
    setAdmin(false);
    setVendor(false);
  }

  useEffect(() => {
    const updateAuth = () => {
      const currentRole = getRole();
      setLoggedIn(isAuthenticated());
      setAdmin(currentRole === "ADMIN");
      setVendor(currentRole === "VENDOR");
    };

    window.addEventListener("authChanged", updateAuth);
    return () => window.removeEventListener("authChanged", updateAuth);
  }, []);

  const canRegisterVendor = loggedIn && !admin && !vendor;
  const isCustomer = loggedIn && !admin && !vendor;

  return (
    <>
      <nav className="navbar">
        <Register ref={dialog} />

        <h1 className="logo">
          <img src={logo} alt="logo" />
        </h1>

        <ul>
          <li>
            <Link to="/" id="router-link">
              Home
            </Link>
          </li>
          <li>
            <Link to="/Page/About" id="router-link">
              About
            </Link>
          </li>
          <li>
            <Link to="/Page/Event" id="router-link">
              Events
            </Link>
          </li>
          <li>
            <Link to="/Page/Tradition" id="router-link">
              Traditions
            </Link>
          </li>

          {admin && (
            <li className="nav-section">
              <span className="nav-title">Admin ▾</span>
              <ul className="nav-submenu">
                <li>
                  <Link to="/Page/AdminDashboard" id="router-link">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/Page/AdminDashboard/vendor-management" id="router-link">
                    Admin Vendor Management
                  </Link>
                </li>
                <li>
                  <Link to="/Page/AdminDashboard/review-management" id="router-link">
                    Admin Review
                  </Link>
                </li>
                <li>
                  <Link to="/Page/AdminDashboard/revenue" id="router-link">
                    Revenue Dashboard
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {loggedIn && vendor && (
            <li className="nav-section">
              <span className="nav-title">Vendor ▾</span>
              <ul className="nav-submenu">
                <li>
                  <Link to="/vendor/dashboard" id="router-link">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/vendor/products" id="router-link">
                    My Products
                  </Link>
                </li>
                <li>
                  <Link to="/vendor/revenue" id="router-link">
                    Revenue
                  </Link>
                </li>
                <li>
                  <Link to="/vendor/products/upload" id="router-link">
                    Upload Product
                  </Link>
                </li>
              </ul>
            </li>
          )}

          {canRegisterVendor && (
            <li>
              <Link to="/vendor/register" id="router-link">
                Register Vendor
              </Link>
            </li>
          )}

          {isCustomer && (
            <li>
              <Link to="/Page/CustomerDashboard" id="router-link">
                Customer Dashboard
              </Link>
            </li>
          )}

          {loggedIn && (
            <li>
              <Link to="/Page/PurchasedProducts" id="router-link">
                Purchased Products
              </Link>
            </li>
          )}
        </ul>

        {loggedIn ? (
          <button className="Register" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <button className="Register" onClick={handleClick}>
            Login / SignUp
          </button>
        )}

        <div className="menu-dropdown">
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="dropdown-content">
            {admin && (
              <>
                <Link to="/Page/AdminDashboard" id="router-link">
                  Admin Dashboard
                </Link>
                <Link to="/Page/AdminDashboard/revenue" id="router-link">
                  RevenueDashboard
                </Link>
                <Link to="/Page/AdminDashboard/vendor-management" id="router-link">
                  Admin Vendor Management
                </Link>
                <Link to="/Page/AdminDashboard/review-management" id="router-link">
                  Admin Review
                </Link>
              </>
            )}

            {loggedIn && (
              <Link to="/Page/PurchasedProducts" id="router-link">
                Purchased Products
              </Link>
            )}

            {canRegisterVendor && (
              <Link to="/vendor/register" id="router-link">
                Register Vendor
              </Link>
            )}

            {isCustomer && (
              <Link to="/Page/CustomerDashboard" id="router-link">
                Customer Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
