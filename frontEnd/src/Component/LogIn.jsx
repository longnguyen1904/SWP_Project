import { forwardRef, useState } from "react";
import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import "../Style/LogIn.css";

const LogIn = forwardRef(function LogIn(props, ref) {
  
  const [isLogin, setIsLogin] = useState(true);

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