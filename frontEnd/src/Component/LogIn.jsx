import { forwardRef, useState, useEffect } from "react";
import { authAPI, profileAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import "../Style/LogIn.css";

const LogIn = forwardRef(function LogIn(props, ref) {

  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = email, 2 = OTP + new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    roleID: 3
  });

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = isLogin
        ? await authAPI.login(formData)
        : await authAPI.register(formData);

      const user = unwrapResponse(res);

      if (isLogin) {
        alert("Đăng nhập thành công! Chào " + user.fullName);
        localStorage.setItem("user", JSON.stringify(user));
        if (ref.current) ref.current.close();
        window.location.reload();
      } else {
        alert("Đăng ký thành công! Hãy đăng nhập ngay.");
        setIsLogin(true);
      }
    } catch (error) {
      alert("Lỗi: " + getApiErrorMessage(error, "Kiểm tra lại email/mật khẩu"));
    }
  };

  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập email");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");
    try {
      await profileAPI.forgotPassword(forgotEmail.trim());
      setForgotMessage("Mã OTP đã được gửi đến email của bạn");
      setForgotStep(2);
      setCountdown(60);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  const handleResetPassword = async () => {
    setForgotError("");
    if (!forgotOtp.trim()) { setForgotError("Vui lòng nhập mã OTP"); return; }
    if (!forgotNewPassword) { setForgotError("Vui lòng nhập mật khẩu mới"); return; }
    if (forgotNewPassword.length < 6) { setForgotError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { setForgotError("Xác nhận mật khẩu không khớp"); return; }

    setForgotLoading(true);
    setForgotMessage("");
    try {
      await profileAPI.resetPassword({
        email: forgotEmail.trim(),
        token: forgotOtp.trim(),
        newPassword: forgotNewPassword,
      });
      setForgotMessage("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.");
      setTimeout(() => {
        resetForgotState();
      }, 2000);
    } catch (err) {
      setForgotError(err.response?.data?.message || "Đặt lại mật khẩu thất bại.");
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
    setCountdown(0);
  };

  // Forgot password view
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
                  placeholder="Nhập 6 chữ số"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                />
              </div>
              <button
                className="login-btn"
                type="button"
                onClick={handleResetPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
              <p className="footer-text">
                {countdown > 0
                  ? `Gửi lại OTP sau ${countdown}s`
                  : <span onClick={handleResendOtp} style={{ cursor: "pointer", color: "blue", fontWeight: "bold" }}>Gửi lại mã OTP</span>
                }
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
          {isLogin ? "Login to your account" : "Join us to explore software"}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Your Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
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
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {isLogin && (
            <p className="forgot-password-link">
              <span
                onClick={() => setShowForgot(true)}
                style={{ cursor: "pointer", color: "blue", fontWeight: "bold", fontSize: "0.85rem" }}
              >
                Quên mật khẩu?
              </span>
            </p>
          )}

          <button className="login-btn" type="submit">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="footer-text">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ cursor: "pointer", color: "blue", fontWeight: "bold" }}
          >
            {isLogin ? "Sign up" : "Log in"}
          </span>
        </p>
      </div>
    </dialog>
  );
});

export default LogIn;