import { useState, useEffect } from "react";
import { profileAPI } from "../services/api";
import "../Style/Vendor.css";
import "../Style/ProfilePage.css";

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

  useEffect(() => { fetchProfile(); }, []);
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
    setMessage(""); setError("");

    if (!fullName.trim() && !newPassword) {
      setError("Vui lòng nhập thông tin cần cập nhật"); return;
    }
    if (newPassword) {
      if (!oldPassword) { setError("Vui lòng nhập mật khẩu cũ"); return; }
      if (newPassword.length < 6) { setError("Mật khẩu mới phải có ít nhất 6 ký tự"); return; }
      if (newPassword !== confirmPassword) { setError("Xác nhận mật khẩu không khớp"); return; }
      if (oldPassword === newPassword) { setError("Mật khẩu mới phải khác mật khẩu cũ"); return; }
    }

    setLoading(true);
    try {
      const payload = {};
      if (fullName.trim()) payload.fullName = fullName.trim();
      if (newPassword) { payload.oldPassword = oldPassword; payload.newPassword = newPassword; }

      await profileAPI.updateProfile(payload);
      setMessage("Cập nhật thông tin thành công ✅");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");

      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.fullName = fullName.trim();
        localStorage.setItem("user", JSON.stringify(user));
      } catch {}

      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="profile-container">
        <div className="vendor-card profile-card">
          <div className="loading-center"><span className="spinner spinner-lg" /> Đang tải thông tin...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="vendor-card profile-card">

        <div className="profile-header">
          <div className="profile-avatar">{fullName ? fullName.charAt(0).toUpperCase() : "U"}</div>
          <h2 className="vendor-page-title">Cài đặt tài khoản</h2>
          <p className="vendor-page-subtitle">Quản lý thông tin cá nhân và bảo mật</p>
        </div>

        {profile && (
          <div className="info-section">
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{profile.email}</span></div>
            <div className="info-row"><span className="info-label">Username</span><span className="info-value">{profile.username}</span></div>
            <div className="info-row"><span className="info-label">Vai trò</span><span className="badge badge-primary">{profile.role}</span></div>
            <div className="info-row">
              <span className="info-label">Ngày tạo</span>
              <span className="info-value">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "—"}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="section-title">Thông tin cá nhân</div>
          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            <input className="form-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập tên mới của bạn" />
          </div>

          <div className="divider" />

          <div className="section-title">Đổi mật khẩu</div>
          <div className="form-group">
            <label className="form-label">Mật khẩu cũ</label>
            <input className="form-input" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu mới</label>
            <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            {newPassword && newPassword.length < 6 && <span className="form-error-text">Tối thiểu 6 ký tự</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu mới</label>
            <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            {confirmPassword && confirmPassword !== newPassword && <span className="form-error-text">Mật khẩu không khớp</span>}
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <><span className="spinner" /> Đang lưu...</> : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}