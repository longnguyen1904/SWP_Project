import { forwardRef, useEffect, useState } from "react";
import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { getToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register({ onSwitchToLogin }, ref) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    roleID: 3,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    if (getToken()) ref?.current?.close();
  }, [ref]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (registerError) setRegisterError("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");

    const pwErrors = getPasswordErrors(formData.password);
    if (pwErrors.length > 0) {
      setRegisterError("Password requirements:\n- " + pwErrors.join("\n- "));
      return;
    }

    try {
      await authAPI.register(formData);
      ref?.current?.close();
      onSwitchToLogin?.({ email: formData.email, password: formData.password });
    } catch (err) {
      console.error(err);
      setRegisterError(getApiErrorMessage(err, "Cannot connect to server (8081)"));
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
                autoComplete="new-password"
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
            {formData.password && (() => {
              const errors = getPasswordErrors(formData.password);
              if (errors.length === 0) return <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Strong password</span>;
              return <div style={{ marginTop: 4 }}>{errors.map((e, i) => <div key={i} style={{ color: '#ffffff', fontSize: '0.78rem' }}>✕ {e}</div>)}</div>;
            })()}
          </div>

          {registerError && (
            <div style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 'bold', marginTop: -4, marginBottom: 4 }}>
              {registerError}
            </div>
          )}

          <button className="login-btn" type="submit">
            Sign Up
          </button>
        </form>

        <div className="divider" />

        <p className="footer-text">
          Already have an account?{" "}
          <span
            onClick={() => {
              ref?.current?.close();
              onSwitchToLogin?.();
            }}
            style={{ cursor: "pointer", color: "blue", fontWeight: "bold", textDecoration: "underline" }}
          >
            Log in
          </span>
        </p>
      </div>
    </dialog>
  );
});

export default Register;
