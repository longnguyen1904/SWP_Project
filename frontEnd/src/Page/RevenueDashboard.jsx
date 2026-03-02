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
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-02-28");
  const vendorId = 1;

  const loadRevenue = () => {
    axios.get("http://localhost:8081/api/vendor/revenue/daily", {
      params: { vendorId, startDate, endDate }
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

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: "Doanh thu (USD)",
      data: data.map(d => d.revenue),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#9ca3af",
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#9ca3af" } }
    }
  };

  // Styles object
  const s = {
    card: {
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
    },
    input: {
      background: "#1e293b",
      border: "1px solid #334155",
      color: "white",
      padding: "8px 12px",
      borderRadius: "6px",
      outline: "none"
    },
    btnPrimary: {
      background: "#3b82f6",
      color: "white",
      border: "none",
      padding: "8px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "600",
      transition: "0.2s"
    },
    btnSecondary: {
      background: "transparent",
      color: "#9ca3af",
      border: "1px solid #334155",
      padding: "8px 20px",
      borderRadius: "6px",
      cursor: "pointer"
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "40px 20px", fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>Revenue Analytics</h1>
            <p style={{ color: "#94a3b8", marginTop: 4 }}>Theo dõi và quản lý hiệu suất doanh thu của bạn</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <input type="date" value={startDate} style={s.input} onChange={e => setStartDate(e.target.value)} />
            <input type="date" value={endDate} style={s.input} onChange={e => setEndDate(e.target.value)} />
            <button style={s.btnPrimary} onClick={loadRevenue}>Lọc dữ liệu</button>
            <button style={s.btnSecondary} onClick={downloadCSV}>Xuất CSV</button>
          </div>
        </div>

        {/* TOP STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
          <div style={s.card}>
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>Tổng doanh thu</span>
            <h2 style={{ fontSize: "32px", margin: "10px 0 0 0", color: "#10b981" }}>${totalRevenue.toLocaleString()}</h2>
          </div>
          <div style={s.card}>
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>Doanh thu TB/Ngày</span>
            <h2 style={{ fontSize: "32px", margin: "10px 0 0 0" }}>${avgRevenue}</h2>
          </div>
          <div style={s.card}>
            <span style={{ color: "#94a3b8", fontSize: "14px" }}>Tổng số ngày</span>
            <h2 style={{ fontSize: "32px", margin: "10px 0 0 0" }}>{data.length}</h2>
          </div>
        </div>

        {/* MAIN CHART */}
        <div style={{ ...s.card, height: 400, marginBottom: 24 }}>
          <div style={{ marginBottom: 20, fontWeight: 600 }}>Biểu đồ tăng trưởng doanh thu</div>
          <div style={{ height: 320 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={s.card}>
          <div style={{ marginBottom: 16, fontWeight: 600 }}>Chi tiết giao dịch</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 500 }}>Ngày giao dịch</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 500 }}>Trạng thái</th>
                <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 500 }}>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1e293b", transition: "0.2s" }}>
                  <td style={{ padding: "16px 8px" }}>{row.date}</td>
                  <td style={{ padding: "16px 8px", textAlign: "right" }}>
                    <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>Thành công</span>
                  </td>
                  <td style={{ padding: "16px 8px", textAlign: "right", fontWeight: "600" }}>
                    ${Number(row.revenue).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}