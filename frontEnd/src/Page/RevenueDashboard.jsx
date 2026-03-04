import { useEffect, useState } from "react";
import api from "../services/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function RevenueDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const revenueApiPrefix = "/api/vendor/revenue";

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(today);
  const [activeRange, setActiveRange] = useState("custom");

  const handleQuickRange = (days, label) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setActiveRange(label);
    loadRevenue(startStr, endStr);
  };

  const loadRevenue = async (sDate = startDate, eDate = endDate) => {
    if (isAdmin) {
      setData([]);
      setLoading(false);
      setError("Tai khoan Admin khong co doanh thu ca nhan. Chi tai khoan Vendor moi co du lieu doanh thu.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.get(`${revenueApiPrefix}/daily`, {
        params: { startDate: sDate, endDate: eDate },
      });
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setData([]);
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Khong tai du lieu doanh thu cho tai khoan hien tai.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    if (isAdmin) {
      setError("Tai khoan Admin khong the xuat bao cao doanh thu Vendor.");
      return;
    }

    try {
      const res = await api.get(`${revenueApiPrefix}/export`, {
        params: { startDate, endDate },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `revenue_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Khong the xuat CSV trong luc nay.");
    }
  };

  useEffect(() => {
    loadRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
  const avgRevenue = data.length > 0 ? (totalRevenue / data.length).toFixed(2) : 0;

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: "Doanh thu",
        data: data.map((d) => d.revenue),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const s = {
    card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" },
    input: { background: "#1e293b", border: "1px solid #334155", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "13px" },
    btnQuick: (isActive) => ({
      background: isActive ? "#3b82f6" : "transparent",
      color: isActive ? "white" : "#94a3b8",
      border: `1px solid ${isActive ? "#3b82f6" : "#334155"}`,
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      transition: "0.2s",
    }),
    btnPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    btnCSV: { background: "#10b981", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "40px 20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
            Bao cao doanh thu
          </h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>
            {isAdmin ? "Tai khoan Admin khong co doanh thu ca nhan" : "Tong quan hoat dong kinh doanh cua ban"}
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid rgba(239, 68, 68, 0.4)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            padding: "16px",
            background: "#0f172a",
            borderRadius: "12px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleQuickRange(7, "7d")}>7 ngay qua</button>
            <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleQuickRange(30, "30d")}>30 ngay qua</button>
            <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleQuickRange(90, "90d")}>3 thang qua</button>
            <button style={s.btnQuick(activeRange === "custom")} onClick={() => setActiveRange("custom")}>Tuy chinh</button>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" value={startDate} style={s.input} onChange={(e) => { setStartDate(e.target.value); setActiveRange("custom"); }} />
              <span style={{ color: "#475569" }}>-</span>
              <input type="date" value={endDate} style={s.input} onChange={(e) => { setEndDate(e.target.value); setActiveRange("custom"); }} />
            </div>
            <button
              style={{ ...s.btnPrimary, opacity: isAdmin ? 0.5 : 1, cursor: isAdmin ? "not-allowed" : "pointer" }}
              onClick={() => loadRevenue()}
              disabled={isAdmin}
            >
              Loc
            </button>
            <button
              style={{ ...s.btnCSV, opacity: isAdmin ? 0.5 : 1, cursor: isAdmin ? "not-allowed" : "pointer" }}
              onClick={downloadCSV}
              disabled={isAdmin}
            >
              Xuat CSV
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
              Tong doanh thu
            </p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#10b981" }}>${totalRevenue.toLocaleString()}</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Dua tren pham vi da chon</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Trung binh hang ngay</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#3b82f6" }}>${avgRevenue}</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Hieu suat trung binh</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>So luong ban ghi</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0" }}>{data.length} <span style={{ fontSize: "16px", color: "#475569" }}>ngay</span></h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Du lieu thuc te nhan duoc</div>
          </div>
        </div>

        <div style={{ ...s.card, height: 420, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Bieu do tang truong</h3>
            <span style={{ fontSize: "12px", color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
              Live Data
            </span>
          </div>
          <div style={{ height: 320 }}>
            <Line data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        <div style={s.card}>
          <div style={{ marginBottom: 20, fontWeight: 600 }}>Chi tiet du lieu</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px" }}>Ngay</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Doanh thu</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Ty trong</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "14px 8px" }}>{row.date}</td>
                    <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: "600" }}>${Number(row.revenue).toLocaleString()}</td>
                    <td style={{ padding: "14px 8px", textAlign: "right", color: "#94a3b8" }}>
                      {totalRevenue > 0 ? ((Number(row.revenue) / totalRevenue) * 100).toFixed(1) : "0.0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && (
              <div style={{ marginTop: 12, fontSize: 13, color: "#94a3b8" }}>Dang tai du lieu...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const chartOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#64748b" }, grid: { display: false } },
    y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } },
  },
};
