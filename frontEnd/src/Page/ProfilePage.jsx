import { useState, useEffect } from "react";
import { profileAPI } from "../services/api";
import "../Style/Vendor.css";

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
      setError(err.response?.data?.message || "Cannot load profile information");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");

    if (!fullName.trim() && !newPassword) {
      setError("Please enter information to update"); return;
    }
    if (newPassword) {
      if (!oldPassword) { setError("Please enter old password"); return; }
      if (newPassword.length < 6) { setError("New password must be at least 6 characters"); return; }
      if (newPassword !== confirmPassword) { setError("Password confirmation does not match"); return; }
      if (oldPassword === newPassword) { setError("New password must be different from old password"); return; }
    }

    setLoading(true);
    try {
      const payload = {};
      if (fullName.trim()) payload.fullName = fullName.trim();
      if (newPassword) { payload.oldPassword = oldPassword; payload.newPassword = newPassword; }

      await profileAPI.updateProfile(payload);
      setMessage("Profile updated successfully");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");

      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (fullName.trim()) user.fullName = fullName.trim();
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("authChanged"));
      } catch {}

      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while updating");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="profile-container">
        <div className="vendor-card" style={{ width: "100%", maxWidth: 1000, padding: 60, textAlign: "center" }}>
          <span className="spinner spinner-lg" style={{ marginBottom: 16 }} />
          <p style={{ color: "#94a3b8" }}>Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-layout">
        
        {/* LEFT COLUMN: Read Only Info */}
        <div className="vendor-card" style={{ height: "fit-content" }}>
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-glow"></div>
              <div className="profile-avatar">{fullName ? fullName.charAt(0).toUpperCase() : "U"}</div>
            </div>
            <h2 className="vendor-page-title" style={{ fontSize: 24, marginBottom: 8 }}>{fullName || "User"}</h2>
            <span className="badge badge-primary" style={{ fontSize: 13, padding: "6px 16px" }}>
              {profile?.role || "Vendor"}
            </span>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">Email Address</span>
              <span className="profile-info-value">{profile?.email || "—"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Username</span>
              <span className="profile-info-value">{profile?.username || "—"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">
                {profile?.createdAt ? new Date(profile?.createdAt).toLocaleDateString("vi-VN") : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Forms */}
        <div className="vendor-card">
          <h2 className="vendor-page-title" style={{ marginBottom: 8 }}>Account Settings</h2>
          <p className="vendor-page-subtitle" style={{ marginBottom: 32 }}>
            Update your personal details and secure your account.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="profile-section-title">
              <i className="bi bi-person-lines-fill"></i> Personal Information
            </div>
            
            <div className="profile-form-grid">
              <div className="form-group profile-form-full">
                <label className="form-label">Full Name</label>
                <input 
                  className="form-input" 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Enter your new name" 
                />
              </div>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-section-title">
              <i className="bi bi-shield-lock-fill"></i> Security & Password
            </div>
            
            <div className="profile-form-grid">
              <div className="form-group profile-form-full">
                <label className="form-label">Current Password</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)} 
                  placeholder="Enter current password to make changes" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Minimum 6 characters" 
                />
                {newPassword && newPassword.length < 6 && (
                  <span className="form-error-text">Minimum 6 characters required</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Must match new password" 
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <span className="form-error-text">Passwords do not match</span>
                )}
              </div>
            </div>

            {message && (
              <div className="alert alert-success" style={{ marginTop: 24, marginBottom: 0 }}>
                {message}
              </div>
            )}
            {error && (
              <div className="alert alert-error" style={{ marginTop: 24, marginBottom: 0 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: "12px 32px", fontSize: 15, fontWeight: 600 }} 
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }} /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}