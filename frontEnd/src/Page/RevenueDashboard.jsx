import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function RevenueDashboard() {
  const [data, setData] = useState([]);
 // Tạo chuỗi ngày hiện tại (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0];

const [startDate, setStartDate] = useState("2026-01-01");
const [endDate, setEndDate] = useState(today); // <-- Cập nhật ở đây
  const [activeRange, setActiveRange] = useState("custom"); // Track range selection
  const vendorId = 1;

  // Hàm xử lý chọn nhanh khoảng thời gian
  const handleQuickRange = (days, label) => {
    const end = new Date("2026-02-28"); // Giả định ngày hiện tại theo dữ liệu của bạn
    const start = new Date(end);
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setActiveRange(label);
    
    // Gọi API ngay lập tức với params mới
    loadRevenue(startStr, endStr);
  };

  const loadRevenue = (sDate = startDate, eDate = endDate) => {
    axios.get("http://localhost:8081/api/vendor/revenue/daily", {
      params: { vendorId, startDate: sDate, endDate: eDate }
    })
    .then(res => setData(res.data))
    .catch(err => console.error("API error:", err));
  };

  const downloadCSV = () => {
    axios.get("http://localhost:8081/api/vendor/revenue/export", {
      params: { vendorId, startDate, endDate },
      responseType: "blob"
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `revenue_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  };

  useEffect(() => { loadRevenue(); }, []);

  const totalRevenue = data.reduce((sum, d) => sum + Number(d.revenue), 0);
  const avgRevenue = data.length > 0 ? (totalRevenue / data.length).toFixed(2) : 0;

  // --- Chart Config (Giữ nguyên hoặc tinh chỉnh màu) ---
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: "Doanh thu",
      data: data.map(d => d.revenue),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    }]
  };

  // --- Styles ---
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
      transition: "0.2s"
    }),
    btnPrimary: { background: "#3b82f6", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
    btnCSV: { background: "#10b981", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "40px 20px", fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* HEADER SECTION */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>Báo cáo doanh thu</h1>
          <p style={{ color: "#94a3b8", marginTop: 4 }}>Tổng quan hoạt động kinh doanh của bạn</p>
        </div>

        {/* TOOLBAR */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: 16, 
          marginBottom: 24,
          padding: "16px",
          background: "#0f172a",
          borderRadius: "12px",
          border: "1px solid #1e293b"
        }}>
          {/* Quick Filters */}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleQuickRange(7, "7d")}>7 ngày qua</button>
            <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleQuickRange(30, "30d")}>30 ngày qua</button>
            <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleQuickRange(90, "90d")}>3 tháng qua</button>
            <button style={s.btnQuick(activeRange === "custom")} onClick={() => setActiveRange("custom")}>Tùy chỉnh</button>
          </div>

          {/* Date Picker & Action */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" value={startDate} style={s.input} onChange={e => { setStartDate(e.target.value); setActiveRange("custom"); }} />
              <span style={{ color: "#475569" }}>-</span>
              <input type="date" value={endDate} style={s.input} onChange={e => { setEndDate(e.target.value); setActiveRange("custom"); }} />
            </div>
            <button style={s.btnPrimary} onClick={() => loadRevenue()}>Lọc</button>
            <button style={s.btnCSV} onClick={downloadCSV}>Xuất CSV</button>
          </div>
        </div>

        {/* STATS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Tổng doanh thu</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#10b981" }}>${totalRevenue.toLocaleString()}</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Dựa trên phạm vi đã chọn</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Trung bình hàng ngày</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#3b82f6" }}>${avgRevenue}</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Hiệu suất trung bình</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Số lượng bản ghi</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0" }}>{data.length} <span style={{fontSize: "16px", color: "#475569"}}>ngày</span></h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Dữ liệu thực tế nhận được</div>
          </div>
        </div>

        {/* CHART AREA */}
        <div style={{ ...s.card, height: 420, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Biểu đồ tăng trưởng</h3>
            <span style={{ fontSize: "12px", color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
              Live Data
            </span>
          </div>
          <div style={{ height: 320 }}>
            <Line data={chartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* TABLE */}
        <div style={s.card}>
          <div style={{ marginBottom: 20, fontWeight: 600 }}>Chi tiết dữ liệu</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px" }}>Ngày</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Doanh thu</th>
                  <th style={{ textAlign: "right", padding: "12px 8px" }}>Tỷ trọng</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "14px 8px" }}>{row.date}</td>
                    <td style={{ padding: "14px 8px", textAlign: "right", fontWeight: "600" }}>${Number(row.revenue).toLocaleString()}</td>
                    <td style={{ padding: "14px 8px", textAlign: "right", color: "#94a3b8" }}>
                      {((Number(row.revenue) / totalRevenue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } }
  }
};