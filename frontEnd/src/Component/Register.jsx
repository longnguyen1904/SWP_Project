import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { getToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register({ onSwitchToLogin }, ref) {
  const navigate = useNavigate();
  const [confirmPassword, setConfirmPassword] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    roleID: 3,
  });

  useEffect(() => {
    if (getToken()) ref?.current?.close();
  }, [ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (formData.password !== confirmPassword) {
      alert("Xác nhận mật khẩu không khớp");
      return;
    }
    try {
      await authAPI.register(formData);
      alert("Register success! Please login.");
      ref?.current?.close();
      onSwitchToLogin?.();
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, "Cannot connect to server"));
    }
  };

  return (
    <dialog ref={ref} className="result-modal">
      <form method="dialog"><button className="close-btn">✕</button></form>
      <div className="login-form">
        <h2>Create Account</h2>
        <p className="subtitle">Join us to explore software</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="fullName" placeholder="Your Full Name"
              value={formData.fullName} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="you@example.com"
              value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••"
              value={formData.password} onChange={handleChange} required />
            {formData.password && formData.password.length < 6 && (
              <span style={{ color: "#1a1a2e", fontSize: "0.8rem", fontWeight: "600" }}>Tối thiểu 6 ký tự</span>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {confirmPassword && confirmPassword !== formData.password && (
              <span style={{ color: "#1a1a2e", fontSize: "0.8rem", fontWeight: "600" }}>Mật khẩu không khớp</span>
            )}
          </div>

          <button className="login-btn" type="submit">Sign Up</button>
        </form>

        <div className="divider" />

        <p className="footer-text">
          Already have an account?{" "}
          <span onClick={() => { ref?.current?.close(); onSwitchToLogin?.(); }}
            style={{ cursor: "pointer", color: "#1a1a2e", fontWeight: "bold", textDecoration: "underline" }}>
            Log in
          </span>
        </p>
      </div>
    </dialog>
  );
});

export default Register;

