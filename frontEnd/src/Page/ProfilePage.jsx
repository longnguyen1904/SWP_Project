import { useState } from "react";
import axios from "axios";

export default function ProfilePage() {
  const userId = 1;

  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword && oldPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu cũ");
      return;
    }

    setLoading(true);
    try {
      await axios.put("http://localhost:8081/api/profile/update", {
        userId,
        fullName,
        oldPassword,
        newPassword
      });
      setMessage("Cập nhật thông tin thành công ✅");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Mật khẩu cũ không chính xác hoặc có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* HEADER & AVATAR */}
        <div style={styles.header}>
          <div style={styles.avatarCircle}>
            {fullName ? fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <h2 style={styles.title}>Cài đặt tài khoản</h2>
          <p style={styles.subtitle}>Quản lý thông tin cá nhân và bảo mật</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* SECTION: THÔNG TIN CHUNG */}
          <div style={styles.sectionTitle}>Thông tin cá nhân</div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập tên mới của bạn"
              style={styles.input}
            />
          </div>

          <div style={{ height: "1px", background: "#334155", margin: "24px 0" }} />

          {/* SECTION: BẢO MẬT */}
          <div style={styles.sectionTitle}>Đổi mật khẩu</div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu cũ</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          {/* MESSAGES */}
          {message && <div style={styles.successBox}>{message}</div>}
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===== STYLES ===== */
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#020617",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  avatarCircle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "bold",
    margin: "0 auto 16px",
    boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: "0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    marginTop: "8px",
  },
  sectionTitle: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#3b82f6",
    fontWeight: "700",
    marginBottom: "16px",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#cbd5e1",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "#f8fafc",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box"
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "600",
    fontSize: "16px",
    marginTop: "10px",
    transition: "background 0.2s",
  },
  successBox: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid #10b981",
    color: "#10b981",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    marginBottom: "16px",
  }
};