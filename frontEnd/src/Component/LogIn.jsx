import { forwardRef, useState } from "react";
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
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 4. Hàm xử lý khi bấm nút Submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Chặn reload trang

    // Chọn đường dẫn API
    const endpoint = isLogin
      ? "http://localhost:8081/api/auth/login"
      : "http://localhost:8081/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData), 
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
   
          alert("Đăng nhập thành công! Chào " + data.fullName);
          localStorage.setItem("user", JSON.stringify(data));
          if (ref.current) ref.current.close();
 
          window.location.reload();
        } else {
     
          alert("Đăng ký thành công! Hãy đăng nhập ngay.");
          setIsLogin(true); 
        }
      } else {
        alert("Lỗi: " + (data.message || "Kiểm tra lại email/mật khẩu"));
      }                                
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      alert("Không thể kết nối đến Server (Port 8081)!" );
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

          {/* 2. Email */}
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

          {/* 3. Password */}
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

          {/* Đã xóa phần chọn Role -> Mặc định là Customer */}

          <button className="login-btn" type="submit">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="footer-text">
          {isLogin ? "Don’t have an account? " : "Already have an account? "}
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