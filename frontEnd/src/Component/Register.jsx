import { forwardRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { getToken } from "../services/localStorageService";
import "../Style/LogIn.css";

const Register = forwardRef(function Register({ onSwitchToLogin }, ref) {
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
    roleID: 3,
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

  useEffect(() => {
    if (getToken()) ref?.current?.close();
  }, [ref]);

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

        <div className="divider" />

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

