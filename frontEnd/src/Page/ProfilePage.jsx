import { useState, useEffect } from "react";
import { profileAPI } from "../services/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (message) { const t = setTimeout(() => setMessage(""), 5000); return () => clearTimeout(t); }
  }, [message]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await profileAPI.getProfile();
      const data = res.data?.data ?? res.data;
      setProfile(data);
      setFullName(data.fullName || "");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải thông tin cá nhân");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validate
    if (!fullName.trim() && !newPassword) {
      setError("Vui lòng nhập thông tin cần cập nhật");
      return;
    }

    if (newPassword) {
      if (!oldPassword) {
        setError("Vui lòng nhập mật khẩu cũ");
        return;
      }
      if (newPassword.length < 6) {
        setError("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Xác nhận mật khẩu không khớp");
        return;
      }
      if (oldPassword === newPassword) {
        setError("Mật khẩu mới phải khác mật khẩu cũ");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {};
      if (fullName.trim()) payload.fullName = fullName.trim();
      if (newPassword) {
        payload.oldPassword = oldPassword;
        payload.newPassword = newPassword;
      }

      await profileAPI.updateProfile(payload);
      setMessage("Cập nhật thông tin thành công ✅");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update localStorage if fullName changed
      if (fullName.trim()) {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.fullName = fullName.trim();
          localStorage.setItem("user", JSON.stringify(user));
        } catch {}
      }

      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            Đang tải thông tin...
          </div>
        </div>
      </div>
    );
  }

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

        {/* PROFILE INFO (Read-only) */}
        {profile && (
          <div style={styles.infoSection}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{profile.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Username</span>
              <span style={styles.infoValue}>{profile.username}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Vai trò</span>
              <span style={styles.infoBadge}>{profile.role}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Ngày tạo</span>
              <span style={styles.infoValue}>
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "—"}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* SECTION: THÔNG TIN CÁ NHÂN */}
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
            {newPassword && newPassword.length < 6 && (
              <span style={styles.hint}>Tối thiểu 6 ký tự</span>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <span style={styles.hint}>Mật khẩu không khớp</span>
            )}
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
    backgroundColor: "transparent",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(10px)",
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
  infoSection: {
    background: "rgba(30, 41, 59, 0.5)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #334155",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(51, 65, 85, 0.5)",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: "14px",
    color: "#e2e8f0",
    fontWeight: "500",
  },
  infoBadge: {
    fontSize: "12px",
    color: "#3b82f6",
    background: "rgba(59, 130, 246, 0.15)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  form: {},
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
    boxSizing: "border-box",
  },
  hint: {
    display: "block",
    fontSize: "12px",
    color: "#f59e0b",
    marginTop: "4px",
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
  },
};