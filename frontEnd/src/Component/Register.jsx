import { forwardRef, useEffect, useState } from "react";

import { OAuthConfig } from "../configurations/configuration";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/localStorageService";
import "../Style/LogIn.css" ; 

const LogIn = forwardRef(function Register(props, ref) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  
  useEffect(() => {
    const accessToken = getToken();
    if (accessToken) {
      ref?.current?.close();
      navigate("/");
    }
  }, [navigate, ref]);

  const handleSubmit = (event) => {
    event.preventDefault();

    console.log("Username:", username);
    console.log("Password:", password);

    ref.current.close();
    props?.onSuccess?.();
    navigate("/");
  };

  
  const handleGoogleLogin = () => {
    const callbackUrl = OAuthConfig.redirectUri;
    const authUrl = OAuthConfig.authUri;
    const googleClientId = OAuthConfig.clientId;

    const targetUrl = `${authUrl}?redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&response_type=token&client_id=${googleClientId}&scope=openid%20email%20profile`;

    window.location.href = targetUrl;
  };

  return (
    <dialog ref={ref} className="result-modal">
   
      <form method="dialog">
        <button className="close-btn">✕</button>
      </form>

   
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Welcome to TALLT</h2>
        <p className="subtitle">Login to your account</p>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="login-btn" type="submit">
          Log In
        </button>

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>

        <div className="divider"></div>

        <button type="button" className="signup-btn">
          Create an account
        </button>
      </form>
    </dialog>
  );
});

export default LogIn;
