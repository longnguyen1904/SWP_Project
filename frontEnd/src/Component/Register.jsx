import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { getToken, setToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register(props, ref) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    roleID: 3, // Customer
  });

  /* ===== Nếu đã có token thì đóng dialog ===== */
  useEffect(() => {
    const accessToken = getToken();
    if (accessToken) {
      ref?.current?.close();
      
    }
  }, [navigate, ref]);

  /* ===== Handle input ===== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ===== Login / Register bằng Email ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = isLogin
        ? await authAPI.login({ email: formData.email, password: formData.password })
        : await authAPI.register(formData);

      const user = unwrapResponse(res);

      if (isLogin) {
        setToken(user.token || "authenticated");
        if (user.roleName) localStorage.setItem("role", user.roleName);
        if (user.userID != null) localStorage.setItem("userId", String(user.userID));
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("authChanged"));
        ref?.current?.close();
        navigate("/");
      } else {
        alert("Register success! Please login.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, "Cannot connect to server (8081)"));
    }
  };

  /* ===== Quên mật khẩu ===== */
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập email");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMessage("Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
    } catch (err) {
      setForgotError(err.response?.data?.message || "Không thể gửi mật khẩu mới. Vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotState = () => {
    setShowForgot(false);
    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");
  };

  /* ===== GOOGLE LOGIN (GIỮ NGUYÊN FILE T2) ===== */
  const handleGoogleLogin = () => {
    const callbackUrl = OAuthConfig.redirectUri;
    const authUrl = OAuthConfig.authUri;
    const googleClientId = OAuthConfig.clientId;

    const targetUrl = `${authUrl}?redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&response_type=token&client_id=${googleClientId}&scope=openid%20email%20profile`;

    window.location.href = targetUrl;
  };

  /* ===== Forgot password view ===== */
  if (showForgot) {
    return (
      <dialog ref={ref} className="result-modal">
        <form method="dialog">
          <button className="close-btn" onClick={resetForgotState}>✕</button>
        </form>
        <div className="login-form">
          <h2>Quên mật khẩu</h2>
          <p className="subtitle">
            Nhập email để nhận mật khẩu mới
          </p>

          {forgotError && <div className="forgot-alert forgot-alert-error">{forgotError}</div>}
          {forgotMessage && <div className="forgot-alert forgot-alert-success">{forgotMessage}</div>}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>
          <button
            className="login-btn"
            type="button"
            onClick={handleForgotPassword}
            disabled={forgotLoading}
          >
            {forgotLoading ? "Đang gửi..." : "Gửi mật khẩu mới"}
          </button>

          <p className="footer-text">
            <span
              onClick={resetForgotState}
              style={{ cursor: "pointer", color: "blue", fontWeight: "bold" }}
            >
              ← Quay lại đăng nhập
            </span>
          </p>
        </div>
      </dialog>
    );
  }

  return (
    <dialog ref={ref} className="result-modal">
      <form method="dialog">
        <button className="close-btn">✕</button>
      </form>

      <div className="login-form">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="subtitle">
          {isLogin ? "Login to your account" : "Join us today"}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {isLogin && (
            <p className="forgot-password-link">
              <span
                onClick={() => setShowForgot(true)}
                style={{ cursor: "pointer", color: "white", fontWeight: "bold", fontSize: "0.9rem", textDecoration: "underline" }}
              >
                Quên mật khẩu?
              </span>
            </p>
          )}

          <button className="login-btn" type="submit">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        {/* ===== GOOGLE LOGIN – GIỮ NGUYÊN ===== */}
        {/* <button
          type="button"
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button> */}

        <div className="divider"></div>

        <p className="footer-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ cursor: "pointer", color: "blue", fontWeight: "bold" }}
          >
            {isLogin ? "Create an account" : "Log in"}
          </span>
        </p>
      </div>
    </dialog>
  );
});

export default Register;
