import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OAuthConfig } from "../configurations/configuration";
import { getToken, setToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register(props, ref) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

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

    const endpoint = isLogin
      ? "http://localhost:8081/api/auth/token"
      : "http://localhost:8081/api/users";

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // MỚI: Dựa vào ApiResponse chuẩn của Backend (code 1000 là thành công)
      if (data.code !== 1000) {
        // Backend sẽ trả về câu thông báo trong data.message (ví dụ: "Sai mật khẩu")
        alert(data.message || "Đã có lỗi xảy ra");
        return;
      }

      if (isLogin) {
        // DÙNG SERVICE ĐỂ LƯU TOKEN
        setToken(data.result.token);

        alert("Đăng nhập thành công!");
        props?.onSuccess?.();
        ref?.current?.close();
        navigate("/");
      } else {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true); // Tự động chuyển về form Đăng nhập
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến Server. Vui lòng thử lại sau.");
    }
  };

  /* ===== GOOGLE LOGIN (GIỮ NGUYÊN FILE T2) ===== */
  const handleGoogleLogin = () => {
    const callbackUrl = OAuthConfig.redirectUri;
    const authUrl = OAuthConfig.authUri;
    const googleClientId = OAuthConfig.clientId;

    const targetUrl = `${authUrl}?redirect_uri=${encodeURIComponent(
      callbackUrl,
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
