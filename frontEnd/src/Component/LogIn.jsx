import { forwardRef, useState } from "react";
import { authAPI, profileAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import "../Style/LogIn.css";

const LogIn = forwardRef(function LogIn(props, ref) {

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
    roleID: 3
  });

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
        localStorage.setItem("role", user.roleName || "");
        localStorage.setItem("accessToken", user.token || "authenticated");
        localStorage.setItem("userId", String(user.userID || ""));
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

  // Gửi yêu cầu quên mật khẩu – backend sinh mật khẩu mới và gửi qua email
  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Vui lòng nhập email");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMessage("");
    try {
      await profileAPI.forgotPassword(forgotEmail.trim());
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

  // Forgot password view – chỉ cần nhập email
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