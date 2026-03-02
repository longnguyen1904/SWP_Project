import { useRef, useState, useEffect } from "react";

import { Link } from "react-router-dom";
import logo from "../public/logo_no_bg.png";
import Register from "./Register";
import "../Style/Navbar.css";
import { isAuthenticated, logOut } from "../services/authService";

export default function Navbar() {
  const dialog = useRef();
  
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  function handleClick() {
    dialog.current.showModal();
  }

  function handleLogout() {
    logOut();
    setLoggedIn(false);
    
  }

  useEffect(() => {
    const updateAuth = () => setLoggedIn(isAuthenticated());
    window.addEventListener("authChanged", updateAuth);
    return () => window.removeEventListener("authChanged", updateAuth);
  }, []);

  return (
    <>
      <nav className="navbar">
        <Register ref={dialog}></Register>

        <h1 className="logo">
          <img src={logo}></img>
        </h1>

        <ul>
                <li><Link to="/" id="router-link">Home</Link></li>
                <li><Link to="/Page/About" id="router-link">About</Link></li>
                <li><Link to="/Page/Event" id="router-link">Events</Link></li>
                <li><Link to="/Page/Tradition" id="router-link">Traditions</Link></li>
                
                {/* Admin Section */}
                <li className="nav-section">
                    <span className="nav-title">Admin</span>
                    <ul className="nav-submenu">
                        <li><Link to="/admin/dashboard" id="router-link">Dashboard</Link></li>
                        <li><Link to="/admin/register" id="router-link">Register Users</Link></li>
                        <li><Link to="/Page/RevenueDashboard" id="router-link">Revenue Dashboard</Link></li>
                        <li><Link to="/Page/ProfilePage" id="router-link">Profile</Link></li>
                        <li><Link to="/Page/AdminReview" id="router-link">Admin Review</Link></li>
                    </ul>
                </li>
                
                {/* Vendor Section */}
                <li className="nav-section">
                    <span className="nav-title">Vendor</span>
                    <ul className="nav-submenu">
                        <li><Link to="/vendor/dashboard" id="router-link">Dashboard</Link></li>
                        <li><Link to="/vendor/register" id="router-link">Register Vendor</Link></li>
                        <li><Link to="/vendor/products" id="router-link">My Products</Link></li>
                        <li><Link to="/vendor/products/upload" id="router-link">Upload Product</Link></li>
                    </ul>
                </li>
                
                {/* Customer Section */}
                <li className="nav-section">
                    <span className="nav-title">Customer</span>
                    <ul className="nav-submenu">
                        <li><Link to="/marketplace" id="router-link">Marketplace</Link></li>
                    </ul>
                </li>

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
      </nav>
    </>
  );
}


