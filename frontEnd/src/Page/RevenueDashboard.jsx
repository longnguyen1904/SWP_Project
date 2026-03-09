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
  const [data, setData] = useState([]); // Chứa dữ liệu daily
  const [topProducts, setTopProducts] = useState([]); // Chứa dữ liệu top-products
  const [totalRevenue, setTotalRevenue] = useState(0); // Chứa tổng doanh thu từ /summary

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState(today); 
  const [activeRange, setActiveRange] = useState("custom"); 
  
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  
  // ==========================================
  // XỬ LÝ QUYỀN TRUY CẬP (AUTHORIZATION)
  // ==========================================
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.roleName; 
  
  // Lấy Token từ LocalStorage để gửi kèm API (Không dùng vendorId fix cứng nữa)
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

  // ==========================================
  // FETCH REAL DATA FROM BACKEND (Bảo mật bằng Token)
  // ==========================================
  const loadRevenue = async (sDate = startDate, eDate = endDate) => {
    // Nếu không phải VENDOR hoặc ADMIN thì không cần gọi API
    if (role !== "VENDOR" && role !== "ADMIN") return;

    try {
      const config = {
        params: { startDate: sDate, endDate: eDate },
        headers: { 'Authorization': `Bearer ${token}` } // Đính kèm thẻ an ninh
      };

      // Gọi đồng thời 3 API 
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
      headers: { 'Authorization': `Bearer ${token}` }, // Đính kèm thẻ an ninh
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

  // ==========================================
  // CHẶN HIỂN THỊ NẾU LÀ KHÁCH HÀNG (CUSTOMER)
  // ==========================================
  if (role !== "VENDOR" && role !== "ADMIN") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#020617", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: "center", color: "#f8fafc", padding: "40px", background: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>🚫</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Không đủ quyền truy cập</h2>
          <p style={{ color: "#94a3b8", marginBottom: "24px" }}>Trang Báo Cáo Doanh Thu này chỉ dành riêng cho tài khoản Người Bán (Vendor).</p>
          <button onClick={() => window.location.href = '/'} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", backgroundColor: "#3b82f6", color: "white", cursor: "pointer", fontWeight: "600", transition: "0.2s" }} onMouseOver={(e) => e.target.style.backgroundColor = "#2563eb"} onMouseOut={(e) => e.target.style.backgroundColor = "#3b82f6"}>
            Trở về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Tính trung bình doanh thu hàng ngày
  const avgRevenue = data.length > 0 ? (totalRevenue / data.length).toFixed(2) : 0;

  // --- Cấu hình Biểu đồ Đường (Doanh thu) ---
  const lineChartData = {
    labels: data.map(d => d.date), // Lấy field "date" từ DB
    datasets: [{
      label: "Doanh thu",
      data: data.map(d => d.revenue), // Lấy field "revenue" từ DB
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      fill: true,
      tension: 0.4,
    }]
  };

  // --- Cấu hình Biểu đồ Doughnut (Top Sản Phẩm) ---
  const doughnutChartData = {
    labels: topProducts.map(p => p.productName || p.name || 'Sản phẩm ẩn'), 
    datasets: [{
      data: topProducts.map(p => p.revenue || p.total || p.amount || 0),
      backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
      borderWidth: 0,
      hoverOffset: 4
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
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", 
          gap: 16, marginBottom: 24, padding: "16px", background: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b"
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleQuickRange(7, "7d")}>7 ngày qua</button>
            <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleQuickRange(30, "30d")}>30 ngày qua</button>
            <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleQuickRange(90, "90d")}>3 tháng qua</button>
            <button style={s.btnQuick(activeRange === "custom")} onClick={() => setActiveRange("custom")}>Tùy chỉnh</button>
          </div>

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Tổng doanh thu</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#10b981" }}>${Number(totalRevenue).toLocaleString()}</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>{data.length} ngày có phát sinh</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Trung bình hàng ngày</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#3b82f6" }}>${avgRevenue}</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Hiệu suất trung bình</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Tổng đơn hàng</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#f59e0b" }}>0</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Chưa có API Backend</div>
          </div>
          <div style={s.card}>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>Tỷ lệ chuyển đổi</p>
            <h2 style={{ fontSize: "32px", margin: "8px 0 0 0", color: "#8b5cf6" }}>0%</h2>
            <div style={{ marginTop: 8, fontSize: "12px", color: "#475569" }}>Chưa có API Backend</div>
          </div>
        </div>

        {/* CHARTS AREA */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
          
          {/* Biểu đồ Doanh Thu */}
          <div style={{ ...s.card, flex: 2, height: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Biểu đồ tăng trưởng</h3>
              <span style={{ fontSize: "12px", color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                Live Data
              </span>
            </div>
            <div style={{ height: 320 }}>
              <Line data={lineChartData} options={{ ...lineOptions, maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Biểu đồ Khách hàng -> Thay thành Top Sản Phẩm */}
          <div style={{ ...s.card, flex: 1, height: 420 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>Top Sản Phẩm Bán Chạy</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>Theo giá trị chi tiêu ($)</p>
            </div>
            {/* ĐÃ CHỈNH SỬA: Giảm height xuống 280, thêm position relative và padding */}
            <div style={{ height: 280, position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "10px" }}>
              {topProducts.length > 0 ? (
                <Doughnut data={doughnutChartData} options={pieOptions} />
              ) : (
                 <div style={{color: '#475569'}}>Chưa có dữ liệu sản phẩm</div>
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
            <div style={{ fontWeight: 600, fontSize: "16px" }}>Chi tiết doanh thu theo ngày</div>
            <div style={{ 
              background: "#1e293b", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", color: "#94a3b8",
              display: "flex", alignItems: "center", gap: "8px", transition: "0.3s"
            }}>
              {isTableExpanded ? "Thu gọn" : "Xem chi tiết"}
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
                        {totalRevenue > 0 ? ((Number(row.revenue) / totalRevenue) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                     <tr>
                        <td colSpan="3" style={{textAlign: "center", padding: "20px", color: "#475569"}}>Không có dữ liệu trong khoảng thời gian này</td>
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

const lineOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: "#64748b" }, grid: { display: false } },
    y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.05)" } }
  }
};

const pieOptions = {
  maintainAspectRatio: false, // Bắt buộc false để kiểm soát size bằng thẻ div bọc ngoài
  layout: {
    padding: 10 // Thêm khoảng lùi một chút để biểu đồ không chạm viền
  },
  plugins: { 
    legend: { 
      position: 'bottom', 
      labels: { color: '#94a3b8', padding: 20, usePointStyle: true } 
    } 
  },
  cutout: '75%' // Tăng độ dày mỏng của viền lên 75% để nhìn thanh thoát hơn khi thu nhỏ
};