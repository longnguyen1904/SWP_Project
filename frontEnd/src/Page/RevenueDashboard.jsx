import { useEffect, useState } from "react";
import axios from "axios";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

// Đăng ký các element của Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export default function RevenueDashboard() {
  const [data, setData] = useState([]); 
  const [topProducts, setTopProducts] = useState([]); 
  const [totalRevenue, setTotalRevenue] = useState(0); 

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(today); 
  const [activeRange, setActiveRange] = useState("custom"); 
  
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.roleName; 
  const token = localStorage.getItem('accessToken');

  const handleQuickRange = (days, label) => {
    const end = new Date(today); 
    const start = new Date(end);
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);
    setActiveRange(label);
    
    loadRevenue(startStr, endStr);
  };

  const loadRevenue = async (sDate = startDate, eDate = endDate) => {
    if (role !== "VENDOR" && role !== "ADMIN") return;

    try {
      const config = {
        params: { startDate: sDate, endDate: eDate },
        headers: { 'Authorization': `Bearer ${token}` }
      };

      const [dailyRes, topProductsRes, summaryRes] = await Promise.all([
        axios.get("http://localhost:8081/api/vendor/revenue/daily", config),
        axios.get("http://localhost:8081/api/vendor/revenue/top-products", config),
        axios.get("http://localhost:8081/api/vendor/revenue/summary", config)
      ]);

      setData(dailyRes.data);
      setTopProducts(topProductsRes.data);
      setTotalRevenue(summaryRes.data || 0);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu từ Backend:", err);
    }
  };

  const downloadCSV = () => {
    axios.get("http://localhost:8081/api/vendor/revenue/export", {
      params: { startDate, endDate },
      headers: { 'Authorization': `Bearer ${token}` },
      responseType: "blob"
    }).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `revenue_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch(err => console.error("Lỗi khi xuất CSV:", err));
  };

  useEffect(() => { loadRevenue(); }, []);

  if (role !== "VENDOR" && role !== "ADMIN") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "transparent", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: "center", color: "#f8fafc", padding: "40px", background: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", borderRadius: "16px", border: "1px solid rgba(63, 63, 70, 0.4)", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>🚫</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Không đủ quyền truy cập</h2>
          <p style={{ color: "#a1a1aa", marginBottom: "24px" }}>Trang Báo Cáo Doanh Thu này chỉ dành riêng cho tài khoản Người Bán (Vendor).</p>
          <button onClick={() => window.location.href = '/'} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "#f97316", color: "white", cursor: "pointer", fontWeight: "600", transition: "0.2s" }}>
            Trở về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const avgRevenue = data.length > 0 ? (totalRevenue / data.length).toFixed(2) : 0;

  // ==========================================
  // 1. CẤU HÌNH BIỂU ĐỒ ĐƯỜNG MƯỢT (APPLE STYLE)
  // ==========================================
  const lineChartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: "Doanh thu",
      data: data.map(d => d.revenue),
      borderColor: "#f97316", // Cam TALLT
      borderWidth: 3, // Nét đậm mượt
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400); // Tạo gradient dọc
        gradient.addColorStop(0, "rgba(249, 115, 22, 0.5)"); // Trên cùng mờ 50%
        gradient.addColorStop(1, "rgba(249, 115, 22, 0.0)"); // Dưới cùng trong suốt 100%
        return gradient;
      },
      fill: true,
      tension: 0.4, // Độ uốn cong mượt
      pointRadius: 0, // Ẩn các chấm tròn
      pointHoverRadius: 6, // Chỉ hiện chấm to khi di chuột vào
      pointBackgroundColor: "#f97316",
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
    }]
  };

  // ==========================================
  // 2. CẤU HÌNH BIỂU ĐỒ TRÒN CÓ BO GÓC 
  // ==========================================
  const doughnutChartData = {
    labels: topProducts.map(p => p.productName || p.name || 'Sản phẩm ẩn'), 
    datasets: [{
      data: topProducts.map(p => p.revenue || p.total || p.amount || 0),
      backgroundColor: ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#facc15", "#14b8a6"],
      borderColor: "#18181b", // Trùng với nền xám trung tính để tạo "vết cắt"
      borderWidth: 4, // Khoảng cách giữa các lát cắt
      borderRadius: 8, // Bo tròn đầu các lát cắt cực đẹp
      hoverOffset: 8 // Phóng to mượt mà khi hover
    }]
  };

  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f4f4f5", padding: "40px 20px", fontFamily: 'Inter, system-ui, sans-serif' },
    card: { background: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(63, 63, 70, 0.4)", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" },
    input: { background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white", padding: "8px 12px", borderRadius: "6px", fontSize: "13px" },
    btnQuick: (isActive) => ({
      background: isActive ? "#f97316" : "transparent",
      color: isActive ? "white" : "#a1a1aa",
      border: `1px solid ${isActive ? "#f97316" : "rgba(82, 82, 91, 0.5)"}`,
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      transition: "0.2s",
      fontWeight: isActive ? "600" : "400"
    }),
    btnPrimary: { background: "#f97316", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "0.2s" },
    btnCSV: { background: "rgba(39, 39, 42, 0.8)", color: "#a1a1aa", border: "1px solid rgba(82, 82, 91, 0.5)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "0.2s" }
  };

  return (
    <div style={s.bg}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* HEADER SECTION */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", margin: 0, color: "#f9fafb" }}>Báo cáo doanh thu</h1>
          <p style={{ color: "#a1a1aa", marginTop: 4 }}>Tổng quan hoạt động kinh doanh của bạn</p>
        </div>

        {/* TOOLBAR */}
        <div style={{ ...s.card, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px 24px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleQuickRange(7, "7d")}>7 ngày qua</button>
            <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleQuickRange(30, "30d")}>30 ngày qua</button>
            <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleQuickRange(90, "90d")}>3 tháng qua</button>
            <button style={s.btnQuick(activeRange === "custom")} onClick={() => setActiveRange("custom")}>Tùy chỉnh</button>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="date" value={startDate} style={s.input} onChange={e => { setStartDate(e.target.value); setActiveRange("custom"); }} />
              <span style={{ color: "#71717a" }}>-</span>
              <input type="date" value={endDate} style={s.input} onChange={e => { setEndDate(e.target.value); setActiveRange("custom"); }} />
            </div>
            <button style={s.btnPrimary} onMouseOver={e=>e.target.style.opacity=0.8} onMouseOut={e=>e.target.style.opacity=1} onClick={() => loadRevenue()}>Lọc</button>
            <button style={s.btnCSV} onMouseOver={e=>e.target.style.background="rgba(63, 63, 70, 0.8)"} onMouseOut={e=>e.target.style.background="rgba(39, 39, 42, 0.8)"} onClick={downloadCSV}>Xuất CSV</button>
          </div>
        </div>

        {/* STATS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 24 }}>
          <div style={s.card}>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "500" }}>Tổng doanh thu</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#10b981" }}>${Number(totalRevenue).toLocaleString()}</h2>
            <div style={{ marginTop: 8, fontSize: "13px", color: "#71717a" }}>{data.length} ngày phát sinh</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "500" }}>Trung bình hàng ngày</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#f97316" }}>${avgRevenue}</h2>
            <div style={{ marginTop: 8, fontSize: "13px", color: "#71717a" }}>Hiệu suất trung bình</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "500" }}>Tổng đơn hàng</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#f59e0b" }}>0</h2>
            <div style={{ marginTop: 8, fontSize: "13px", color: "#71717a" }}>Chưa có API Backend</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "500" }}>Tỷ lệ chuyển đổi</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#8b5cf6" }}>0%</h2>
            <div style={{ marginTop: 8, fontSize: "13px", color: "#71717a" }}>Chưa có API Backend</div>
          </div>
        </div>

        {/* CHARTS AREA */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          
          <div style={{ ...s.card, flex: 2, height: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#f4f4f5" }}>Biểu đồ tăng trưởng</h3>
              <span style={{ fontSize: "12px", color: "#f97316", background: "rgba(249, 115, 22, 0.15)", padding: "4px 8px", borderRadius: "6px", fontWeight: "600", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
                Live Data
              </span>
            </div>
            <div style={{ height: 310 }}>
              <Line data={lineChartData} options={lineOptions} />
            </div>
          </div>

          <div style={{ ...s.card, flex: 1, height: 420 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#f4f4f5" }}>Top Sản Phẩm</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#a1a1aa" }}>Bán chạy theo chi tiêu</p>
            </div>
            <div style={{ height: 290, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {topProducts.length > 0 ? (
                <Doughnut data={doughnutChartData} options={pieOptions} />
              ) : (
                 <div style={{color: '#71717a'}}>Chưa có dữ liệu sản phẩm</div>
              )}
            </div>
          </div>

        </div>

        {/* TABLE COLLAPSIBLE */}
        <div style={s.card}>
          <div 
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "4px 0" }}
            onClick={() => setIsTableExpanded(!isTableExpanded)}
          >
            <div style={{ fontWeight: 600, fontSize: "16px", color: "#f4f4f5" }}>Chi tiết doanh thu theo ngày</div>
            <div style={{ 
              background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", color: "#f4f4f5",
              display: "flex", alignItems: "center", gap: "8px", transition: "0.3s"
            }}>
              {isTableExpanded ? "Thu gọn bảng" : "Xem chi tiết"}
              <span style={{ transform: isTableExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>▼</span>
            </div>
          </div>

          <div style={{ 
            maxHeight: isTableExpanded ? "1000px" : "0px", 
            overflow: "hidden", 
            transition: "max-height 0.5s ease-in-out",
            opacity: isTableExpanded ? 1 : 0
          }}>
            <div style={{ overflowX: "auto", marginTop: 24 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(82, 82, 91, 0.5)", color: "#a1a1aa", fontSize: "14px" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: "500" }}>Ngày</th>
                    <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: "500" }}>Doanh thu</th>
                    <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: "500" }}>Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(63, 63, 70, 0.3)", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(39, 39, 42, 0.5)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding: "16px 8px", color: "#f4f4f5" }}>{row.date}</td>
                      <td style={{ padding: "16px 8px", textAlign: "right", fontWeight: "600", color: "#10b981" }}>${Number(row.revenue).toLocaleString()}</td>
                      <td style={{ padding: "16px 8px", textAlign: "right", color: "#a1a1aa" }}>
                        {totalRevenue > 0 ? ((Number(row.revenue) / totalRevenue) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                     <tr>
                        <td colSpan="3" style={{textAlign: "center", padding: "30px", color: "#71717a"}}>Không có dữ liệu trong khoảng thời gian này</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Tùy chỉnh cực mạnh Option biểu đồ Đường
const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false, // Di chuột theo chiều dọc là hiện điểm (như chứng khoán)
  },
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(24, 24, 27, 0.95)",
      titleColor: "#a1a1aa",
      bodyColor: "#ffffff",
      bodyFont: { size: 14, weight: "bold", family: "Inter" },
      padding: 12,
      borderColor: "rgba(82, 82, 91, 0.5)",
      borderWidth: 1,
      displayColors: false, // Ẩn cái ô vuông màu nhỏ trong tooltip
      callbacks: {
        label: function(context) { return '$ ' + context.parsed.y.toLocaleString(); }
      }
    }
  },
  scales: {
    x: { 
      ticks: { color: "#71717a", font: { family: "Inter" } }, 
      grid: { display: false, drawBorder: false } 
    },
    y: { 
      ticks: { 
        color: "#71717a", font: { family: "Inter" },
        callback: function(value) { return '$' + value; }
      }, 
      grid: { color: "rgba(82, 82, 91, 0.3)", drawBorder: false, borderDash: [5, 5] } // Lưới đứt đoạn cực đẹp
    }
  }
};

// Tùy chỉnh siêu đỉnh Option biểu đồ Tròn
const pieOptions = {
  maintainAspectRatio: false, 
  layout: { padding: 10 },
  plugins: { 
    legend: { 
      position: 'bottom', 
      labels: { color: '#a1a1aa', padding: 20, usePointStyle: true, pointStyle: 'circle', font: { family: "Inter" } } 
    },
    tooltip: {
      backgroundColor: "rgba(24, 24, 27, 0.95)",
      bodyFont: { size: 14, weight: "bold", family: "Inter" },
      padding: 12,
      borderColor: "rgba(82, 82, 91, 0.5)",
      borderWidth: 1
    }
  },
  cutout: '80%' // Tạo độ mảnh khảnh, hiện đại cho vòng tròn
};