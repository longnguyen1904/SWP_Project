import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminCommission() {
  const [commission, setCommission] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const colors = {
    bg: "#0f172a",
    card: "#1e293b",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    accent: "#38bdf8",
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    border: "#334155",
  };

 
  const loadCommission = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8081/api/admin/commission");
      setCommission(res.data);
    } catch (err) {
      showNotification("Failed to load commission data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommission();
  }, []);

  const updateCommission = async () => {
    const value = Number(input);

    if (isNaN(value)) {
      showNotification("Please enter a valid number", "error");
      return;
    }

    if (value < 0 || value > 100) {
      showNotification("Commission must be between 0 and 100%", "error");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `http://localhost:8081/api/admin/commission/set?percent=${value}`
      );
      await loadCommission();
      setInput("");
      showNotification("Commission updated successfully!", "success");
    } catch (err) {
      showNotification("Error updating commission", "error");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };


  // 3. RENDER UI 
 
  return (
    <div style={{ 
      padding: "40px 20px", 
      backgroundColor: colors.bg, 
      minHeight: "100vh", 
      fontFamily: "'Inter', sans-serif", 
      color: colors.textMain 
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* HEADER */}
        <header style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
            Platform Commission Settings
          </h2>
          <p style={{ color: colors.textMuted, marginTop: "8px" }}>
            Configure the global percentage taken from each transaction
          </p>
        </header>

        {/* NOTIFICATION */}
        {message && (
          <div style={notifStyle(messageType, colors)}>
            {messageType === "success" ? "✅ " : "❌ "} {message}
          </div>
        )}

        {/* MAIN CARD */}
        <div style={cardStyle(colors)}>
          <div style={{ marginBottom: "30px", textAlign: "center", padding: "20px 0" }}>
            <span style={{ color: colors.textMuted, fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Current Rate
            </span>
            <div style={{ fontSize: "64px", fontWeight: "800", color: colors.accent, marginTop: "10px" }}>
              {loading && !commission ? "..." : `${commission}%`}
            </div>
          </div>

          <div style={inputContainerStyle(colors)}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle(colors)}>New Commission Percent (%)</label>
              <input
                type="number"
                placeholder="e.g. 15"
                style={inputStyle}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && updateCommission()}
              />
            </div>
            <button 
              onClick={updateCommission} 
              disabled={loading}
              style={loading ? btnDisabled : btnPrimary}
            >
              {loading ? "Updating..." : "Update Rate"}
            </button>
          </div>
        </div>

        {/* INFO BOX */}
        <div style={{ marginTop: "20px", padding: "15px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.05)", border: `1px dashed ${colors.border}` }}>
            <p style={{ margin: 0, fontSize: "13px", color: colors.textMuted, lineHeight: "1.5" }}>
                <b>Note:</b> Changes to the commission rate will be applied immediately to all new transactions. Existing pending transactions will not be affected.
            </p>
        </div>
      </div>
    </div>
  );
}


const cardStyle = (colors) => ({
  backgroundColor: colors.card,
  padding: "40px",
  borderRadius: "16px",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
  border: `1px solid ${colors.border}`,
});

const notifStyle = (type, colors) => ({
  padding: "16px 20px",
  borderRadius: "12px",
  marginBottom: "25px",
  fontSize: "14px",
  fontWeight: "500",
  border: `1px solid ${type === "success" ? colors.success : colors.error}`,
  backgroundColor: type === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
  color: type === "success" ? colors.success : colors.error
});

const inputContainerStyle = (colors) => ({
  display: "flex",
  alignItems: "flex-end",
  gap: "15px",
  paddingTop: "20px",
  borderTop: `1px solid ${colors.border}`
});

const labelStyle = (colors) => ({
  display: "block",
  marginBottom: "8px",
  fontSize: "13px",
  fontWeight: "600",
  color: colors.textMuted
});

const inputStyle = {
  width: "100%",
  backgroundColor: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "12px 14px",
  borderRadius: "8px",
  outline: "none",
  fontSize: "16px",
  boxSizing: "border-box"
};

const btnPrimary = {
  backgroundColor: "#38bdf8",
  color: "#0f172a",
  border: "none",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.2s",
  whiteSpace: "nowrap"
};

const btnSecondary = {
  backgroundColor: "transparent",
  color: "#f8fafc",
  border: "1px solid #334155",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer"
};

const btnDisabled = { ...btnPrimary, opacity: 0.5, cursor: "not-allowed" };