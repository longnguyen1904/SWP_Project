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
  const [attemptData, setAttemptData] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const MAX_ATTEMPTS = 5;
  const LOCK_SECONDS = 300;

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentEmail = formData.email.trim().toLowerCase();
  const currentData = attemptData[currentEmail] || { attempts: 0, lockUntil: 0 };
  const lockoutTimeLeft = currentData.lockUntil > now ? Math.ceil((currentData.lockUntil - now) / 1000) : 0;

  useEffect(() => {
    if (getToken()) ref?.current?.close();
  }, [ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (loginError) setLoginError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutTimeLeft > 0) {
      setLoginError(`Account locked. Try again in ${lockoutTimeLeft}s.`);
      return;
    }

    try {
      const res = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });
      const user = unwrapResponse(res);
      setAttemptData((prev) => ({ ...prev, [currentEmail]: undefined }));
      setToken(user.token || "authenticated");
      if (user.roleName) localStorage.setItem("role", user.roleName);
      if (user.userID != null) localStorage.setItem("userId", String(user.userID));
      if (user.vendorStatus) localStorage.setItem("vendorStatus", user.vendorStatus);
      else localStorage.removeItem("vendorStatus");
      if (user.suspendReason) localStorage.setItem("suspendReason", user.suspendReason);
      else localStorage.removeItem("suspendReason");
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChanged"));
      ref?.current?.close();
      navigate("/");
    } catch (err) {
      console.error(err);
      const newAttempts = currentData.attempts + 1;
      const remaining = MAX_ATTEMPTS - newAttempts;

      let newLockUntil = 0;
      if (remaining <= 0) {
        newLockUntil = Date.now() + LOCK_SECONDS * 1000;
        setLoginError(`Too many failed attempts. Account locked for ${LOCK_SECONDS}s.`);
      } else {
        setLoginError(`Invalid email or password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
      }

      setAttemptData((prev) => ({
        ...prev,
        [currentEmail]: { attempts: remaining <= 0 ? 0 : newAttempts, lockUntil: newLockUntil }
      }));
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
    if (!forgotEmail.trim()) { setForgotError("Please enter your email"); return; }
    setForgotLoading(true); setForgotError(""); setForgotMessage("");
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMessage("OTP has been sent to your email.");
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to send OTP.");
    } finally { setForgotLoading(false); }
  };

  /* ===== Forgot Password: Step 2 – Verify OTP + Reset ===== */
  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim()) { setForgotError("Please enter the OTP"); return; }
    if (!forgotNewPassword) { setForgotError("Please enter a new password"); return; }
    if (forgotNewPassword.length < 6) { setForgotError("Password must be at least 6 characters"); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { setForgotError("Passwords do not match"); return; }
    setForgotLoading(true); setForgotError(""); setForgotMessage("");
    try {
      await authAPI.verifyOtpAndResetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotMessage("Password reset successful!");
      setTimeout(() => resetForgotState(), 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to verify OTP.");
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
          <h2>Forgot Password</h2>
          <p className="subtitle">
            {forgotStep === 1 ? "Enter your email to receive an OTP" : "Enter the OTP and your new password"}
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
                {forgotLoading ? "Sending..." : "Send OTP"}
              </button>
            </>
          )}

          {forgotStep === 2 && (
            <>
              <div className="form-group">
                <label>OTP Code</label>
                <input type="text" placeholder="Enter 6-digit OTP" value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)} maxLength={6} required />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="••••••••" value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)} required />
                {forgotNewPassword && forgotNewPassword.length < 6 && (
                  <span style={{ color: "#ff6b6b", fontSize: "0.8rem" }}>At least 6 characters</span>
                )}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" placeholder="••••••••" value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)} required />
                {forgotConfirmPassword && forgotConfirmPassword !== forgotNewPassword && (
                  <span style={{ color: "#ff6b6b", fontSize: "0.8rem" }}>Passwords do not match</span>
                )}
              </div>
              <button className="login-btn" type="button" onClick={handleVerifyOtp} disabled={forgotLoading}>
                {forgotLoading ? "Verifying..." : "Reset Password"}
              </button>
              <p className="footer-text">
                <span onClick={() => { setForgotStep(1); setForgotError(""); setForgotMessage(""); }}
                  style={{ cursor: "pointer", color: "#1a1a2e", fontWeight: "bold", fontSize: "0.85rem", textDecoration: "underline" }}>
                  ← Resend OTP
                </span>
              </p>
            </>
          )}

          <p className="footer-text">
            <span onClick={resetForgotState}
              style={{ cursor: "pointer", color: "#1a1a2e", fontWeight: "bold", textDecoration: "underline" }}>
              ← Back to Login
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



        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="you@example.com"
              value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password" 
                placeholder="••••••••"
                value={formData.password} 
                onChange={handleChange} 
                required 
                style={{ paddingRight: 75, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 2, top: 2, bottom: 2,
                  background: 'transparent', border: 'none', borderRadius: 8,
                  padding: '0 12px', cursor: 'pointer', fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', gap: 5, color: '#555',
                  fontWeight: 500
                }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {(loginError || lockoutTimeLeft > 0) && (
              <div className="login-alert-error">
                {lockoutTimeLeft > 0 
                  ? `Account locked. Try again in ${Math.floor(lockoutTimeLeft / 60).toString().padStart(2, '0')}:${(lockoutTimeLeft % 60).toString().padStart(2, '0')}` 
                  : loginError}
              </div>
            )}
          </div>

          <p className="forgot-password-link">
            <span onClick={() => setShowForgot(true)}
              style={{ cursor: "pointer", color: "white", fontWeight: "bold", fontSize: "0.9rem", textDecoration: "underline" }}>
              Forgot password?
            </span>
          </p>

          <button className="login-btn" type="submit" disabled={lockoutTimeLeft > 0}>
            {lockoutTimeLeft > 0 ? "Locked..." : "Log In"}
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