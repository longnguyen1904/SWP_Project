import { forwardRef } from "react";

const LogIn = forwardRef(function LogIn(props, ref) {
  return (
    <dialog ref={ref} className="result-modal">
      {/* NÚT ĐÓNG */}
      <form method="dialog">
        <button className="close-btn">✕</button>
      </form>

      {/* LOGIN FORM */}
      <form className="login-form">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to your account</p>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" required />
        </div>

        <button className="login-btn">Log In</button>

        <p className="footer-text">
          Don’t have an account? <span>Sign up</span>
        </p>
      </form>
    </dialog>
  );
});

export default LogIn;
