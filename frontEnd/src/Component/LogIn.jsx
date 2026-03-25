import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { getToken, setToken } from "../services/localStorageService";
import { OAuthConfig } from "../configurations/configuration";
import "../Style/LogIn.css";

const LogIn = forwardRef(function LogIn({ onSwitchToRegister }, ref) {
  const navigate = useNavigate();
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    let timer;
    if (lockoutTimeLeft > 0) {
      timer = setInterval(() => {
        setLockoutTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTimeLeft === 0 && loginError.includes("bị khóa")) {
      setLoginError("");
    }
    return () => clearInterval(timer);
  }, [lockoutTimeLeft, loginError]);

  useEffect(() => {
    if (getToken()) ref?.current?.close();
  }, [ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });
      const user = unwrapResponse(res);
      setToken(user.token || "authenticated");
      if (user.roleName) localStorage.setItem("role", user.roleName);
      if (user.userID != null) localStorage.setItem("userId", String(user.userID));
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChanged"));
      ref?.current?.close();
      navigate("/");
    } catch (err) {
      console.error(err);
      const msg = getApiErrorMessage(err, "Invalid email or password");
      setLoginError(msg);

      const lockMatch = msg.match(/(\d+)\s*phút/i);
      if (msg.toLowerCase().includes("bị khóa") && lockMatch) {
        const minutes = parseInt(lockMatch[1], 10);
        setLockoutTimeLeft(minutes * 60);
      } else {
        setLockoutTimeLeft(0);
      }
    }
  };

  const handleGoogleLogin = () => {
    const targetUrl = `${OAuthConfig.authUri}?redirect_uri=${encodeURIComponent(
      OAuthConfig.redirectUri
    )}&response_type=token&client_id=${OAuthConfig.clientId}&scope=openid%20email%20profile`;
    window.location.href = targetUrl;
  };

  /* ===== Forgot Password: Step 1 – Send OTP ===== */
  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) { setForgotError("Vui lòng nhập email"); return; }
    setForgotLoading(true); setForgotError(""); setForgotMessage("");
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMessage("Mã OTP đã được gửi đến email của bạn.");
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Không thể gửi OTP.");
    } finally { setForgotLoading(false); }
  };

  /* ===== Forgot Password: Step 2 – Verify OTP + Reset ===== */
  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim()) { setForgotError("Vui lòng nhập mã OTP"); return; }
    if (!forgotNewPassword) { setForgotError("Vui lòng nhập mật khẩu mới"); return; }
    if (forgotNewPassword.length < 6) { setForgotError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { setForgotError("Xác nhận mật khẩu không khớp"); return; }
    setForgotLoading(true); setForgotError(""); setForgotMessage("");
    try {
      await authAPI.verifyOtpAndResetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotMessage("Đặt lại mật khẩu thành công!");
      setTimeout(() => resetForgotState(), 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Xác minh OTP thất bại.");
    } finally { setForgotLoading(false); }
  };

  const resetForgotState = () => {
    setShowForgot(false); setForgotStep(1); setForgotEmail("");
    setForgotOtp(""); setForgotNewPassword(""); setForgotConfirmPassword("");
    setForgotMessage(""); setForgotError("");
  };

  /* ===== Forgot Password View ===== */
  if (showForgot) {
    return (
      <dialog ref={ref} className="result-modal">
        <form method="dialog"><button className="close-btn" onClick={resetForgotState}>✕</button></form>
        <div className="login-form">
          <h2>Quên mật khẩu</h2>
          <p className="subtitle">
            {forgotStep === 1 ? "Nhập email để nhận mã OTP" : "Nhập mã OTP và mật khẩu mới"}
          </p>

          {forgotError && <div className="forgot-alert forgot-alert-error">{forgotError}</div>}
          {forgotMessage && <div className="forgot-alert forgot-alert-success">{forgotMessage}</div>}

          {forgotStep === 1 && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)} required />
              </div>
              <button className="login-btn" type="button" onClick={handleSendOtp} disabled={forgotLoading}>
                {forgotLoading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </>
          )}

          {forgotStep === 2 && (
            <>
              <div className="form-group">
                <label>Mã OTP</label>
                <input type="text" placeholder="Nhập 6 số OTP" value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)} maxLength={6} required />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input type="password" placeholder="••••••••" value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)} required />
                {forgotNewPassword && forgotNewPassword.length < 6 && (
                  <span style={{ color: "#ff6b6b", fontSize: "0.8rem" }}>Tối thiểu 6 ký tự</span>
                )}
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input type="password" placeholder="••••••••" value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)} required />
                {forgotConfirmPassword && forgotConfirmPassword !== forgotNewPassword && (
                  <span style={{ color: "#ff6b6b", fontSize: "0.8rem" }}>Mật khẩu không khớp</span>
                )}
              </div>
              <button className="login-btn" type="button" onClick={handleVerifyOtp} disabled={forgotLoading}>
                {forgotLoading ? "Đang xác minh..." : "Đặt lại mật khẩu"}
              </button>
              <p className="footer-text">
                <span onClick={() => { setForgotStep(1); setForgotError(""); setForgotMessage(""); }}
                  style={{ cursor: "pointer", color: "#1a1a2e", fontWeight: "bold", fontSize: "0.85rem", textDecoration: "underline" }}>
                  ← Gửi lại OTP
                </span>
              </p>
            </>
          )}

          <p className="footer-text">
            <span onClick={resetForgotState}
              style={{ cursor: "pointer", color: "#1a1a2e", fontWeight: "bold", textDecoration: "underline" }}>
              ← Quay lại đăng nhập
            </span>
          </p>
        </div>
      </dialog>
    );
  }

  /* ===== Login View ===== */
  return (
    <dialog ref={ref} className="result-modal">
      <form method="dialog"><button className="close-btn">✕</button></form>
      <div className="login-form">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to your account</p>

        {loginError && (
          <div className="login-alert-error">
            {lockoutTimeLeft > 0 
              ? `Tài khoản bị khoá. Thử lại sau ${Math.floor(lockoutTimeLeft / 60).toString().padStart(2, '0')}:${(lockoutTimeLeft % 60).toString().padStart(2, '0')}` 
              : loginError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="you@example.com"
              value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••"
              value={formData.password} onChange={handleChange} required />
          </div>

          <p className="forgot-password-link">
            <span onClick={() => setShowForgot(true)}
              style={{ cursor: "pointer", color: "white", fontWeight: "bold", fontSize: "0.9rem", textDecoration: "underline" }}>
              Quên mật khẩu?
            </span>
          </p>

          <button className="login-btn" type="submit" disabled={lockoutTimeLeft > 0}>
            {lockoutTimeLeft > 0 ? "Bị khoá..." : "Log In"}
          </button>
        </form>

        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <div className="divider" />

        <p className="footer-text">
          Don't have an account?{" "}
          <span onClick={() => { ref?.current?.close(); onSwitchToRegister?.(); }}
            style={{ cursor: "pointer", color: "#1a1a2e", fontWeight: "bold", textDecoration: "underline" }}>
            Create an account
          </span>
        </p>
      </div>
    </dialog>
  );
});

export default LogIn;