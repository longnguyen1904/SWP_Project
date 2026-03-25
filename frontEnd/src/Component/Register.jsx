import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { getToken, setToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register(props, ref) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=OTP+newPassword
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    roleID: 3, // Customer
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [attemptData, setAttemptData] = useState({});
  const [now, setNow] = useState(Date.now());
  const MAX_ATTEMPTS = 5;
  const LOCK_SECONDS = 300;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentEmail = formData.email.trim().toLowerCase();
  const currentData = attemptData[currentEmail] || { attempts: 0, lockUntil: 0 };
  const lockoutTimeLeft = currentData.lockUntil > now ? Math.ceil((currentData.lockUntil - now) / 1000) : 0;

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
    if (loginError) setLoginError("");
  };

  /* ===== Password validation ===== */
  const getPasswordErrors = (pw) => {
    const errors = [];
    if (pw.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) errors.push("At least one uppercase letter");
    if (!/[a-z]/.test(pw)) errors.push("At least one lowercase letter");
    if (!/[0-9]/.test(pw)) errors.push("At least one digit");
    return errors;
  };

  /* ===== Login / Register bằng Email ===== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (lockoutTimeLeft > 0) {
      setLoginError(`Account locked. Try again in ${lockoutTimeLeft}s.`);
      return;
    }

    // Validate password on register
    if (!isLogin) {
      const pwErrors = getPasswordErrors(formData.password);
      if (pwErrors.length > 0) {
        setLoginError("Password requirements:\n- " + pwErrors.join("\n- "));
        return;
      }
    }

    try {
      const res = isLogin
        ? await authAPI.login({ email: formData.email, password: formData.password })
        : await authAPI.register(formData);

      const user = unwrapResponse(res);

      if (isLogin) {
        setAttemptData((prev) => ({ ...prev, [currentEmail]: undefined }));
        setToken(user.token || "authenticated");
        if (user.roleName) localStorage.setItem("role", user.roleName);
        if (user.userID != null) localStorage.setItem("userId", String(user.userID));
        // Save vendor suspend info
        if (user.vendorStatus) localStorage.setItem("vendorStatus", user.vendorStatus);
        else localStorage.removeItem("vendorStatus");
        if (user.suspendReason) localStorage.setItem("suspendReason", user.suspendReason);
        else localStorage.removeItem("suspendReason");
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
      if (isLogin) {
        const newAttempts = currentData.attempts + 1;
        const remaining = MAX_ATTEMPTS - newAttempts;

        let newLockUntil = 0;
        if (remaining <= 0) {
          newLockUntil = Date.now() + LOCK_SECONDS * 1000;
          setLoginError(`Account temporarily locked. Try again in ${LOCK_SECONDS}s.`);
        } else {
          setLoginError(`Invalid email or password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
        }

        setAttemptData((prev) => ({
          ...prev,
          [currentEmail]: { attempts: remaining <= 0 ? 0 : newAttempts, lockUntil: newLockUntil }
        }));
      } else {
        setLoginError(getApiErrorMessage(err, "Cannot connect to server (8081)"));
      }
    }
  };

  /* ===== Step 1: Gửi OTP ===== */
  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập email");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");
    try {
      await authAPI.forgotPassword(forgotEmail.trim());
      setForgotMessage("Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  };

  /* ===== Step 2: Xác minh OTP + Đặt mật khẩu mới ===== */
  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim()) {
      setForgotError("Vui lòng nhập mã OTP");
      return;
    }
    if (!forgotNewPassword) {
      setForgotError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Xác nhận mật khẩu không khớp");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");
    try {
      await authAPI.verifyOtpAndResetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      setForgotMessage("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.");
      setTimeout(() => {
        resetForgotState();
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Xác minh OTP thất bại. Vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotState = () => {
    setShowForgot(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
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

  /* ===== Forgot password view – 2 steps ===== */
  if (showForgot) {
    return (
      <dialog ref={ref} className="result-modal">
        <form method="dialog">
          <button className="close-btn" onClick={resetForgotState}>✕</button>
        </form>
        <div className="login-form">
          <h2>Quên mật khẩu</h2>
          <p className="subtitle">
            {forgotStep === 1
              ? "Nhập email để nhận mã OTP"
              : "Nhập mã OTP và mật khẩu mới"}
          </p>

          {forgotError && <div className="forgot-alert forgot-alert-error">{forgotError}</div>}
          {forgotMessage && <div className="forgot-alert forgot-alert-success">{forgotMessage}</div>}

          {forgotStep === 1 && (
            <>
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
                onClick={handleSendOtp}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </>
          )}

          {forgotStep === 2 && (
            <>
              <div className="form-group">
                <label>Mã OTP</label>
                <input
                  type="text"
                  placeholder="Nhập 6 số OTP"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  required
                />
                {forgotNewPassword && forgotNewPassword.length < 6 && (
                  <span style={{ color: "#ff6b6b", fontSize: "0.8rem" }}>Tối thiểu 6 ký tự</span>
                )}
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  required
                />
                {forgotConfirmPassword && forgotConfirmPassword !== forgotNewPassword && (
                  <span style={{ color: "#ff6b6b", fontSize: "0.8rem" }}>Mật khẩu không khớp</span>
                )}
              </div>
              <button
                className="login-btn"
                type="button"
                onClick={handleVerifyOtp}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Đang xác minh..." : "Đặt lại mật khẩu"}
              </button>

              <p className="footer-text">
                <span
                  onClick={() => { setForgotStep(1); setForgotError(""); setForgotMessage(""); }}
                  style={{ cursor: "pointer", color: "blue", fontWeight: "bold", fontSize: "0.85rem" }}
                >
                  ← Gửi lại OTP
                </span>
              </p>
            </>
          )}

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
              autoComplete="off"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete={isLogin ? "current-password" : "new-password"}
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
            {!isLogin && formData.password && (() => {
              const errors = getPasswordErrors(formData.password);
              if (errors.length === 0) return <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Strong password</span>;
              return <div style={{ marginTop: 4 }}>{errors.map((e, i) => <div key={i} style={{ color: '#ffffff', fontSize: '0.78rem' }}>✕ {e}</div>)}</div>;
            })()}
          </div>

          {(loginError || lockoutTimeLeft > 0) && (
            <div style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 'bold', marginTop: -4, marginBottom: 4 }}>
              {lockoutTimeLeft > 0 
                ? `Account locked. Try again in ${Math.floor(lockoutTimeLeft / 60).toString().padStart(2, '0')}:${(lockoutTimeLeft % 60).toString().padStart(2, '0')}` 
                : loginError}
            </div>
          )}

          {isLogin && (
            <p className="forgot-password-link">
              <span
                onClick={() => setShowForgot(true)}
                style={{ cursor: "pointer", color: "white", fontWeight: "bold", fontSize: "0.9rem", textDecoration: "underline" }}
              >
                Forgot password?
              </span>
            </p>
          )}

          <button className="login-btn" type="submit" disabled={isLogin && lockoutTimeLeft > 0}>
            {isLogin && lockoutTimeLeft > 0 ? "Locked..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        {/* ===== GOOGLE LOGIN ===== */}
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>

        <div className="divider"></div>

        <p className="footer-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => {
              if (ref?.current) ref.current.close();
              if (props.onSwitchToLogin) props.onSwitchToLogin();
              setFormData({ email: "", password: "", fullName: "", roleID: 3 });
            }}
            style={{ cursor: "pointer", color: "blue", fontWeight: "bold", textDecoration: "underline" }}
          >
            {isLogin ? "Create an account" : "Log in"}
          </span>
        </p>
      </div>
    </dialog>
  );
});

export default Register;
