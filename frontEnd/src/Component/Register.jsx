import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OAuthConfig } from "../configurations/configuration";
import { getToken } from "../services/localStorageService";
import { login, register } from "../services/authApiService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register(props, ref) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    username: "", // Thêm username cho register
    roleID: 3, // Customer
  });

  /* ===== Nếu đã có token thì đóng dialog ===== */
  useEffect(() => {
    const accessToken = getToken();
    if (accessToken) {
      ref?.current?.close();
      navigate("/");
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
      let result;

      if (isLogin) {
        // Login: sử dụng identifier (email hoặc username)
        result = await login({
          identifier: formData.email, // Có thể là email hoặc username
          password: formData.password,
        });
      } else {
        // Register: gửi đầy đủ thông tin
        result = await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          roleID: formData.roleID,
        });
      }

      // Log error code để debug (nếu có)
      if (!result.success && result.code) {
        console.log("Error Code:", result.code);
      }

      if (result.success) {
        // ✅ Thành công: Lưu data.result (chứa User và Token)
        if (isLogin) {
          // Login: result.data chứa LoginResponse { token, user }
          // Token và user đã được lưu tự động trong authApiService
          props?.onSuccess?.();
          ref?.current?.close();
          navigate("/");
        } else {
          // Register: result.data chứa User object
          alert(result.message || "Đăng ký thành công! Vui lòng đăng nhập.");
          setIsLogin(true);
        }
      } else {
        // ❌ Thất bại: Hiển thị message từ ApiResponse
        alert(result.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("API Error:", err);
      alert("Không thể kết nối đến server. Vui lòng thử lại sau.");
    }
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
            <>
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
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
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

          <button className="login-btn" type="submit">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        {/* ===== GOOGLE LOGIN – GIỮ NGUYÊN ===== */}
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>

        <div className="divider"></div>

        <p className="footer-text">
          {isLogin ? "Don’t have an account? " : "Already have an account? "}
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
