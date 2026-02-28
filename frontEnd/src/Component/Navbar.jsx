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
                <li><Link to="../" id="router-link">Home</Link></li>
                <li><Link to="../Page/About" id="router-link">About</Link></li>
                <li><Link to="../Page/Event" id="router-link">Events</Link></li>
                <li><Link to="../Page/Tradition" id="router-link">Traditons</Link></li>
                <li><Link to="../Page/RevenueDashboard" id="router-link">RevenueDashboard</Link></li>
                <li><Link to="../Page/ProfilePage" id="router-link">ProfileChange</Link></li>
                <li><Link to="../Page/AdminReview" id="router-link">Admin Review</Link></li>
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


