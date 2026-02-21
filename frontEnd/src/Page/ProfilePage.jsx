import { useState } from "react";
import axios from "axios";

export default function ProfilePage() {
  // test trước – sau này thay bằng JWT
  const userId = 1;

  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validate frontend trước
    if (newPassword && oldPassword === newPassword) {
      setError("New password must be different from old password ");
      return;
    }

    try {
      await axios.put("http://localhost:8081/api/profile/update", {
        userId,
        fullName,
        oldPassword,
        newPassword
      });

      setMessage("Profile updated successfully ✅");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Old password is incorrect");
      }
    }

  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617, #020617)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: 40
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#1e293b",
          color: "#e5e7eb",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
        }}
      >
        <h2 style={{ marginBottom: 20, textAlign: "center" }}>
          Profile Settings
        </h2>

        <form onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter new full name"
              style={inputStyle}
            />
          </div>

          {/* OLD PASSWORD */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter old password"
              style={inputStyle}
            />
          </div>

          {/* NEW PASSWORD */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              style={inputStyle}
            />
          </div>

          {/* MESSAGE */}
          {message && (
            <p style={{ color: "#22c55e", marginBottom: 12 }}>
              {message}
            </p>
          )}
          {error && (
            <p style={{ color: "#ef4444", marginBottom: 12 }}>
              {error}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px 0",
              background: "#2563eb",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 16
            }}
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}

/* ===== INLINE STYLE ===== */
const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  color: "#cbd5f5"
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e5e7eb",
  outline: "none"
};
