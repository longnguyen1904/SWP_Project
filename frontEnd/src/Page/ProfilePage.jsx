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
        <div className="vendor-card profile-card">
          <div className="loading-center"><span className="spinner spinner-lg" /> Loading information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="vendor-card profile-card">

        <div className="profile-header">
          <div className="profile-avatar">{fullName ? fullName.charAt(0).toUpperCase() : "U"}</div>
          <h2 className="vendor-page-title">Account Settings</h2>
          <p className="vendor-page-subtitle">Manage personal information and security</p>
        </div>

        {profile && (
          <div className="info-section">
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{profile.email}</span></div>
            <div className="info-row"><span className="info-label">Username</span><span className="info-value">{profile.username}</span></div>
            <div className="info-row"><span className="info-label">Role</span><span className="badge badge-primary">{profile.role}</span></div>
            <div className="info-row">
              <span className="info-label">Created</span>
              <span className="info-value">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN") : "—"}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="section-title">Personal Information</div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your new name" />
          </div>

          <div className="divider" />

          <div className="section-title">Change Password</div>
          <div className="form-group">
            <label className="form-label">Old Password</label>
            <input className="form-input" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            {newPassword && newPassword.length < 6 && <span className="form-error-text">Minimum 6 characters</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            {confirmPassword && confirmPassword !== newPassword && <span className="form-error-text">Password does not match</span>}
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? <><span className="spinner" /> Saving...</> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}