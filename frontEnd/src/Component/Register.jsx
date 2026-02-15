import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { OAuthConfig } from "../configurations/configuration";
import { getToken, setToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register(props, ref) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    email: "",      // Ở mode Login, trường này sẽ đóng vai trò là 'identifier'
    username: "",   // Chỉ dùng khi Register
    password: "",
    fullName: "",
    roleID: 3,
  });

  useEffect(() => {
    const accessToken = getToken();
    if (accessToken) {
      ref?.current?.close();
      navigate("/");
    }
  }, [navigate, ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Flow: Gửi POST tới /login hoặc /register.
   * - Login thành công: Backend trả { accessToken, ... } -> Lưu accessToken vào localStorage (key "accessToken").
   * - Register: Không gửi roleID (Backend tự gán CUSTOMER). Đăng ký xong chuyển sang form Login.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Chọn endpoint tùy mode Login/Register
    const endpoint = isLogin
      ? "http://localhost:8081/api/auth/login"
      : "http://localhost:8081/api/auth/register";

    // Payload: Login dùng identifier+password. Register dùng fullName, username, email, password (KHÔNG gửi roleID)
    const payload = isLogin
      ? { identifier: formData.email, password: formData.password }
      : {
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData && errorData.message) {
          alert(errorData.message);
        } else {
          const errorText = await response.text();
          alert(errorText || "Lỗi xác thực");
        }
        return;
      }

      const data = await response.json();

      if (isLogin) {
        // Lưu JWT Token với key "accessToken" (khớp localStorageService.getToken/setToken)
        if (data.accessToken) {
          setToken(data.accessToken);
        }
        props?.onSuccess?.();
        ref?.current?.close();
        navigate("/");
      } else {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến server (8081)");
    }
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

      <div className="login-form">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="subtitle">
          {isLogin ? "Login to your account" : "Join us today"}
        </p>

        <form onSubmit={handleSubmit}>
          {/* CÁC TRƯỜNG CHỈ HIỆN KHI ĐĂNG KÝ */}
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

          {/* TRƯỜNG NHẬP ĐỊNH DANH (DÙNG CHUNG) */}
          <div className="form-group">
            <label>{isLogin ? "Username or Email" : "Email"}</label>
            <input
              // Chuyển sang text khi login để không bị check định dạng email
              type={isLogin ? "text" : "email"}
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
              minLength={6}
            />
          </div>

          <button className="login-btn" type="submit">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <div className="divider"></div>

        <p className="footer-text">
          {isLogin ? "Don’t have an account? " : "Already have an account? "}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              // Reset form khi chuyển chế độ để tránh rác dữ liệu
              setFormData({ email: "", username: "", password: "", fullName: "", roleID: 3 });
            }}
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