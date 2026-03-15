import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { setToken } from "../services/localStorageService";
import { Box, CircularProgress, Typography } from "@mui/material";

import HomePage from "./Home";

export default function Authenticate() {
  const navigate = useNavigate();
  const [isLoggedin, setIsLoggedin] = useState(false);

  useEffect(() => {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.replace("#", ""));
  const accessToken = params.get("access_token");

  if (accessToken) {
    console.log("Token:", accessToken);

    setToken(accessToken);
    window.dispatchEvent(new Event("authChanged"));
    window.history.replaceState({}, document.title, "/");
    setIsLoggedin(true);
  }
}, []);

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
