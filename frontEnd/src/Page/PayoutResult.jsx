import React from "react";
import { useSearchParams, Link } from "react-router-dom";

const COLORS = {
  bg: "#0f172a",
  card: "#1e293b",
  textMain: "#f8fafc",
  textMuted: "#94a3b8",
  accent: "#38bdf8",
  success: "#22c55e",
  error: "#ef4444",
  border: "#334155",
};

function PayoutResult() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const payoutId = searchParams.get("payoutId");

  const isSuccess = status === "success";

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Inter', sans-serif",
        color: COLORS.textMain,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.card,
          borderRadius: "20px",
          border: `1px solid ${COLORS.border}`,
          padding: "60px 50px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            backgroundColor: isSuccess
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            border: `2px solid ${isSuccess ? COLORS.success : COLORS.error}`,
          }}
        >
          {isSuccess ? "✅" : "❌"}
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            marginBottom: "12px",
            color: isSuccess ? COLORS.success : COLORS.error,
          }}
        >
          {isSuccess ? "Payout Successful!" : "Payout Failed"}
        </h1>

        {/* Message */}
        <p
          style={{
            color: COLORS.textMuted,
            fontSize: "15px",
            lineHeight: "1.6",
            marginBottom: "8px",
          }}
        >
          {isSuccess
            ? "The payout via VNPay was successful. The funds have been credited to both the Admin and Vendor wallets."
            : "The payout via VNPay failed. The payout has been reset to PENDING, and you can try again."}
        </p>

        {payoutId && (
          <p
            style={{
              color: COLORS.textMuted,
              fontSize: "13px",
              marginBottom: "30px",
            }}
          >
            Payout ID:{" "}
            <span style={{ color: COLORS.accent, fontWeight: "600" }}>
              #{payoutId}
            </span>
          </p>
        )}

        {/* Button */}
        <Link
          to="/Page/Admin/AdminPayout"
          style={{
            display: "inline-block",
            backgroundColor: COLORS.accent,
            color: COLORS.bg,
            padding: "12px 32px",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          ← Back to Payout Management
        </Link>
      </div>
    </div>
  );
}

export default PayoutResult;