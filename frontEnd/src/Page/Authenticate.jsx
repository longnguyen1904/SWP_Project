import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { setToken } from "../services/localStorageService";
import { Box, CircularProgress, Typography } from "@mui/material";



export default function Authenticate() {
  const navigate = useNavigate();
  const [isLoggedin, setIsLoggedin] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", ""));
    const accessToken = params.get("access_token");

    if (accessToken) {
      console.log("Google Token received, verifying with Backend...");

      fetch("http://localhost:8081/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken })
      })
      .then(res => res.json())
      .then(response => {
        // ApiResponse structure has 'data'
        if (response.code === 200 || response.data) {
          const authData = response.data || response;
          setToken(authData.token);
          if (authData.roleName) localStorage.setItem("role", authData.roleName);
          if (authData.userID != null) localStorage.setItem("userId", String(authData.userID));
          localStorage.setItem("user", JSON.stringify(authData));
          
          window.dispatchEvent(new Event("authChanged"));
          window.history.replaceState({}, document.title, "/");
          setIsLoggedin(true);
        } else {
          console.error("Backend auth failed:", response.message);
          alert("Google login failed: " + response.message);
          navigate("/");
        }
      })
      .catch(err => {
        console.error("Error communicating with backend:", err);
        alert("Cannot connect to server for Google Login");
        navigate("/");
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (isLoggedin) {
      navigate("/");     
    }
  }, [isLoggedin, navigate]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection : "column",
          gap: "30px",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress></CircularProgress>
        <Typography>Authenticating...</Typography>
      </Box>
      
    </>
    
  );
}
