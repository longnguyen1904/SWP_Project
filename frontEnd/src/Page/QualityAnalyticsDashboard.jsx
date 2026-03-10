import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, RadialLinearScale, ArcElement, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, RadialLinearScale, ArcElement, Tooltip, Legend, Filler);

export default function QualityAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(today);
  const [activeRange, setActiveRange] = useState("30d");

  const [customStartDate, setCustomStartDate] = useState(startDate);
  const [customEndDate, setCustomEndDate] = useState(endDate);

  const [selectedProductId, setSelectedProductId] = useState("");

  // STATE MỚI: Lưu toàn bộ sản phẩm để hiển thị trên Dropdown
  const [allVendorProducts, setAllVendorProducts] = useState([]); 

  const [productsData, setProductsData] = useState([]);
  const [ratingDist, setRatingDist] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [ticketStatus, setTicketStatus] = useState([]); 
  const [summary, setSummary] = useState({ totalQty: 0, avgRating: 0, totalReviews: 0, totalTickets: 0 });
  const [apiErrors, setApiErrors] = useState([]);

  const userStr = localStorage.getItem('user');
  const role = userStr ? JSON.parse(userStr)?.roleName : null;
  const token = localStorage.getItem('accessToken');

  const handleRangeChange = (days, label) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];

    setStartDate(formattedStart);
    setEndDate(formattedEnd);
    setCustomStartDate(formattedStart);
    setCustomEndDate(formattedEnd);
    setActiveRange(label);
  };

  const handleCustomDateSubmit = () => {
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!");
      return;
    }
    setStartDate(customStartDate);
    setEndDate(customEndDate);
    setActiveRange("custom");
  };

  // EFFECT 1: Load danh sách Dropdown 1 lần duy nhất khi mở trang
  useEffect(() => {
    if (role !== "VENDOR" && role !== "ADMIN") return;
    const fetchDropdownList = async () => {
      try {
        const config = { 
          // Gọi dải ngày từ năm 2000 để chắc chắn lấy được mọi sản phẩm Vendor từng tạo
          params: { startDate: "2000-01-01", endDate: today }, 
          headers: { 'Authorization': `Bearer ${token}` } 
        };
        const res = await axios.get("http://localhost:8081/api/vendor/revenue/top-products", config);
        setAllVendorProducts(res.data || []);
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm cho Dropdown:", error);
      }
    };
    fetchDropdownList();
  }, [role, token, today]);

  // EFFECT 2: Load dữ liệu Dashboard theo bộ lọc Ngày + SP
  useEffect(() => {
    if (role !== "VENDOR" && role !== "ADMIN") return;

    const fetchAllData = async () => {
      setLoading(true);
      setApiErrors([]);
      
      const baseParams = { startDate, endDate };
      if (selectedProductId) baseParams.productId = selectedProductId;
      
      const config = { params: baseParams, headers: { 'Authorization': `Bearer ${token}` } };
      const topConfig = { params: { startDate, endDate }, headers: { 'Authorization': `Bearer ${token}` } };

      try {
        const [topRes, sumRes, distRes, reviewsRes, ticketRes] = await Promise.allSettled([
          axios.get("http://localhost:8081/api/vendor/revenue/top-products", topConfig),
          axios.get("http://localhost:8081/api/vendor/revenue/summary", config),
          axios.get("http://localhost:8081/api/vendor/revenue/rating-distribution", { params: baseParams, headers: config.headers }),
          axios.get("http://localhost:8081/api/vendor/revenue/recent-reviews", { params: baseParams, headers: config.headers }),
          axios.get("http://localhost:8081/api/vendor/revenue/ticket-status", { params: baseParams, headers: config.headers })
        ]);

        if (sumRes.status === "fulfilled") {
          const sData = sumRes.value.data;
          setSummary({
            totalQty: sData.totalOrders || 0,
            avgRating: sData.vendorAvgRating || 0,
            totalReviews: sData.totalReviews || 0,
            totalTickets: sData.totalTickets || 0
          });
        }

        if (topRes.status === "fulfilled") {
          const pData = topRes.value.data.map(p => ({
            id: p.productId,
            name: p.productName,
            category: p.categoryName,
            sales: p.quantity,
            rating: p.avgRating,
            ticketCount: p.ticketCount || 0
          }));
          setProductsData(pData.sort((a,b) => b.sales - a.sales));
        }

        if (distRes.status === "fulfilled") setRatingDist(distRes.value.data || []);
        if (reviewsRes.status === "fulfilled") setRecentReviews(reviewsRes.value.data || []);
        if (ticketRes.status === "fulfilled") setTicketStatus(ticketRes.value.data || []);

      } catch (error) {
        console.error("Lỗi Fetch Data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [startDate, endDate, selectedProductId, role, token]);

  if (role !== "VENDOR" && role !== "ADMIN") return <div style={{ color: "white", textAlign: "center", padding: "100px" }}><h2>🚫 Không có quyền truy cập</h2></div>;

  const displayedProducts = selectedProductId ? productsData.filter(p => String(p.id) === String(selectedProductId)) : productsData;

  const issueRate = summary.totalQty > 0 ? ((summary.totalTickets / summary.totalQty) * 100).toFixed(1) : 0;
  const isHighIssueRate = issueRate > 5.0;

  // ==========================================
  // 1. BIỂU ĐỒ MA TRẬN ĐỊNH HƯỚNG (SCATTER CHART)
  // ==========================================
  const scatterData = {
    datasets: [{
      label: 'Sản phẩm',
      data: displayedProducts.filter(p => p.sales > 0).map(p => ({
        x: p.sales,
        y: p.rating > 0 ? p.rating : 2.5,
        name: p.name,
        tickets: p.ticketCount
      })),
      backgroundColor: (ctx) => {
        const y = ctx.raw?.y;
        if (y >= 4.0) return 'rgba(16, 185, 129, 0.8)';
        if (y >= 3.0) return 'rgba(245, 158, 11, 0.8)';
        return 'rgba(239, 68, 68, 0.8)';
      },
      pointRadius: 8,
      pointHoverRadius: 12,
      borderColor: '#18181b',
      borderWidth: 2
    }]
  };

  const scatterOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const data = ctx.raw;
            return `${data.name} | Bán: ${data.x} | Sao: ${data.y} | Lỗi: ${data.tickets}`;
          }
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Lượt bán (Độ phổ biến)', color: '#a1a1aa' }, grid: { color: 'rgba(82,82,91,0.2)' }, ticks: { color: '#71717a' } },
      y: { title: { display: true, text: 'Điểm đánh giá (Chất lượng)', color: '#a1a1aa' }, min: 1, max: 5, grid: { color: 'rgba(82,82,91,0.2)' }, ticks: { color: '#71717a' } }
    }
  };

  // ==========================================
  // 2. BIỂU ĐỒ PHÂN TÍCH DANH MỤC (BAR CHART)
  // ==========================================
  const categoryStats = {};
  
  displayedProducts.forEach(p => {
    const catName = p.category && p.category.trim() !== "" ? p.category : "Chưa phân loại";
    if (!categoryStats[catName]) {
      categoryStats[catName] = { ratingSum: 0, count: 0 };
    }
    if (p.rating > 0) {
      categoryStats[catName].ratingSum += p.rating;
      categoryStats[catName].count += 1;
    }
  });

  const categories = Object.keys(categoryStats);
  const catAvgRatings = categories.map(c => 
    categoryStats[c].count > 0 ? (categoryStats[c].ratingSum / categoryStats[c].count).toFixed(1) : 0
  );

  const catBarData = {
    labels: categories.map(c => c.length > 15 ? c.substring(0, 15) + '...' : c),
    datasets: [{
      label: 'Điểm đánh giá trung bình',
      data: catAvgRatings,
      backgroundColor: 'rgba(59, 130, 246, 0.7)',
      borderRadius: 4,
    }]
  };
  const catBarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#a1a1aa' }, grid: { display: false } },
      y: { min: 0, max: 5, ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(82,82,91,0.15)' } }
    }
  };

  // ==========================================
  // CÁC BIỂU ĐỒ CŨ ĐÃ TỐI ƯU
  // ==========================================
  const ticketColors = { "Open": "#ef4444", "In Progress": "#f59e0b", "Resolved": "#3b82f6", "Closed": "#10b981" };
  const ticketDoughnutData = {
    labels: ticketStatus.map(t => t.status || "Khác"),
    datasets: [{
      data: ticketStatus.map(t => t.count),
      backgroundColor: ticketStatus.map(t => ticketColors[t.status] || "#8b5cf6"),
      borderColor: "#18181b", borderWidth: 4, borderRadius: 6, hoverOffset: 8
    }]
  };

  const starDataArray = [0, 0, 0, 0, 0];
  ratingDist.forEach(r => { if (r.rating >= 1 && r.rating <= 5) starDataArray[5 - r.rating] = r.count; });
  const starDoughnutData = {
    labels: ["5 Sao", "4 Sao", "3 Sao", "2 Sao", "1 Sao"],
    datasets: [{ 
      data: starDataArray, 
      backgroundColor: ["#10b981", "#3b82f6", "#facc15", "#f97316", "#ef4444"], 
      borderColor: "#18181b", borderWidth: 4, borderRadius: 6, hoverOffset: 8 
    }]
  };
  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#a1a1aa', usePointStyle: true, padding: 16 } } }, cutout: '75%' };

  // ==========================================
  // STYLES TỔNG THỂ
  // ==========================================
  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f4f4f5", padding: "40px 20px", fontFamily: 'Inter, system-ui, sans-serif' },
    card: { background: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(63, 63, 70, 0.4)", borderRadius: "20px", padding: "24px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.6)" },
    btnQuick: (isActive) => ({ background: isActive ? "#3b82f6" : "transparent", color: isActive ? "white" : "#a1a1aa", border: `1px solid ${isActive ? "#3b82f6" : "rgba(82, 82, 91, 0.5)"}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: isActive ? "600" : "500", transition: "all 0.2s" }),
    input: { background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", outline: "none", minWidth: "160px", fontWeight: "500", cursor: "pointer" },
    dateInput: { background: "transparent", border: "none", color: "white", outline: "none", fontSize: "13px", cursor: "pointer" }
  };

  return (
    <div style={s.bg}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "36px", fontWeight: "800", margin: 0, color: "#f9fafb", letterSpacing: "-0.5px" }}>Định hướng Chất lượng</h1>
            <p style={{ color: "#a1a1aa", marginTop: 6, fontSize: "15px" }}>Phân tích sự hài lòng của khách hàng và định hướng sản phẩm</p>
          </div>
          
          {/* CONTROL PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
            
            {/* Lọc sản phẩm & Nút nhanh */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              
              {/* SỬA MAP TỪ allVendorProducts thay vì productsData */}
              <select style={s.input} value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value=""> Tất cả Sản phẩm</option>
                {allVendorProducts.map(p => (
                  <option key={p.productId || p.id} value={p.productId || p.id}>
                    {p.productName || p.name}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 6, background: "rgba(24, 24, 27, 0.6)", padding: "6px", borderRadius: "10px", border: "1px solid rgba(63, 63, 70, 0.4)" }}>
                <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleRangeChange(7, "7d")}>7 ngày</button>
                <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleRangeChange(30, "30d")}>30 ngày</button>
                <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleRangeChange(90, "90d")}>3 tháng</button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "rgba(39, 39, 42, 0.6)", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.4)" }}>
              <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Từ:</span>
              <input 
                type="date" 
                style={s.dateInput} 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={today}
              />
              <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Đến:</span>
              <input 
                type="date" 
                style={s.dateInput} 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)}
                max={today}
              />
              <button 
                onClick={handleCustomDateSubmit}
                style={{
                  background: activeRange === "custom" ? "#3b82f6" : "rgba(82, 82, 91, 0.8)",
                  color: "white", border: "none", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", transition: "0.2s"
                }}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>

        {apiErrors.length > 0 && <div style={{ background: "rgba(239, 68, 68, 0.1)", borderLeft: "4px solid #ef4444", color: "#fca5a5", padding: "16px 20px", borderRadius: "8px", marginBottom: "24px" }}>⚠️ {apiErrors.join(" | ")}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#3b82f6" }}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>⏳</div> Đang đồng bộ dữ liệu...
          </div>
        ) : (
          <>
            {/* KPI CARDS (Tập trung vào Chất lượng) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 28 }}>
              <div style={{ ...s.card, borderTop: "4px solid #eab308" }}>
                <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Điểm đánh giá chung</p>
                <h2 style={{ fontSize: "30px", margin: "12px 0 0 0", color: "#eab308", fontWeight: "800" }}>{summary.avgRating} <span style={{fontSize: "24px"}}>⭐</span></h2>
              </div>
              <div style={{ ...s.card, borderTop: "4px solid #8b5cf6" }}>
                <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tổng lượt đánh giá</p>
                <h2 style={{ fontSize: "30px", margin: "12px 0 0 0", color: "#8b5cf6", fontWeight: "800" }}>{summary.totalReviews} <span style={{fontSize: "16px", color:"#71717a", fontWeight: "normal"}}>lượt</span></h2>
              </div>
              <div style={{ ...s.card, borderTop: "4px solid #3b82f6" }}>
                <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sự cố & Hỗ trợ (Tickets)</p>
                <h2 style={{ fontSize: "30px", margin: "12px 0 0 0", color: "#3b82f6", fontWeight: "800" }}>{summary.totalTickets}</h2>
              </div>
              <div style={{ ...s.card, borderTop: `4px solid ${isHighIssueRate ? "#ef4444" : "#10b981"}` }}>
                <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tỷ lệ phát sinh lỗi</p>
                <h2 style={{ fontSize: "30px", margin: "12px 0 0 0", color: isHighIssueRate ? "#ef4444" : "#10b981", fontWeight: "800" }}>{issueRate}%</h2>
                <div style={{ fontSize: "12px", color: "#71717a", marginTop: 4 }}>{isHighIssueRate ? "Báo động: Tỷ lệ lỗi quá cao!" : "Phần mềm hoạt động ổn định"}</div>
              </div>
            </div>

            {/* CHART HÀNG 1: MA TRẬN CHIẾN LƯỢC & DANH MỤC */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "28px" }}>
              <div style={{ ...s.card, flex: 2, height: 420 }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#f4f4f5", fontWeight: "700" }}>Ma trận Định hướng Sản phẩm</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#a1a1aa" }}>Phân tích tương quan giữa Lượt mua và Mức độ hài lòng</p>
                </div>
                <div style={{ height: 320 }}><Scatter data={scatterData} options={scatterOptions} /></div>
              </div>
              <div style={{ ...s.card, flex: 1, height: 420 }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#f4f4f5", fontWeight: "700" }}>Chất lượng theo Danh mục</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#a1a1aa" }}>Điểm đánh giá trung bình</p>
                </div>
                <div style={{ height: 320 }}><Bar data={catBarData} options={catBarOptions} /></div>
              </div>
            </div>

            {/* CHART HÀNG 2: PHÂN BỔ SAO & REVIEW REALTIME */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "28px" }}>
              <div style={{ ...s.card, flex: 1, height: 440 }}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#f4f4f5", fontWeight: "700" }}>Cấu trúc Đánh giá</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#a1a1aa" }}>Tỷ lệ phân bổ từ 1 đến 5 sao</p>
                </div>
                <div style={{ height: 300, display: "flex", alignItems: "center" }}><Doughnut data={starDoughnutData} options={pieOptions} /></div>
              </div>
              
              <div style={{ ...s.card, flex: 2, height: 440, overflowY: "auto", paddingRight: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", position: "sticky", top: 0, backgroundColor: "rgba(24, 24, 27, 0.9)", backdropFilter: "blur(10px)", paddingBottom: "10px", zIndex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#f4f4f5", fontWeight: "700" }}>💬 Nhận xét gần đây</h3>
                  {selectedProductId && <span style={{ fontSize: "13px", color: "#3b82f6", background: "rgba(59, 130, 246, 0.1)", padding: "4px 10px", borderRadius: "20px" }}>Đang lọc 1 sản phẩm</span>}
                </div>

                {recentReviews.length === 0 ? <div style={{textAlign: "center", padding: "40px 0", color: "#71717a"}}>Chưa có phản hồi nào gần đây.</div> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {recentReviews.map((rev, idx) => (
                      <div key={idx} style={{ background: "rgba(39, 39, 42, 0.4)", padding: "18px", borderRadius: "14px", border: "1px solid rgba(82, 82, 91, 0.3)", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(63, 63, 70, 0.4)"} onMouseOut={e=>e.currentTarget.style.background="rgba(39, 39, 42, 0.4)"}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ fontWeight: "700", color: "#f4f4f5", marginBottom: "2px" }}>Khách hàng #{rev.userId}</div>
                            <div style={{ color: "#a1a1aa", fontSize: "12px" }}>Sản phẩm: <span style={{color: "#3b82f6"}}>{rev.productName}</span></div>
                          </div>
                          <div style={{ background: "rgba(234, 179, 8, 0.1)", padding: "4px 8px", borderRadius: "8px", color: "#eab308", fontSize: "14px" }}>
                            {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                          </div>
                        </div>
                        <div style={{ color: "#d4d4d8", fontSize: "15px", lineHeight: "1.5", fontStyle: "italic" }}>"{rev.comment}"</div>
                        <div style={{ color: "#71717a", fontSize: "12px", marginTop: "12px", textAlign: "right" }}>⏱ {rev.reviewDate}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TABLE CHI TIẾT SẢN PHẨM */}
            <div style={{ ...s.card, padding: "28px" }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: "18px", color: "#f4f4f5", fontWeight: "700" }}>Chi tiết Chất lượng Sản phẩm</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(82, 82, 91, 0.4)", color: "#a1a1aa", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
                      <th style={{ padding: "0 8px 16px 8px" }}>Tên phần mềm</th>
                      <th style={{ padding: "0 8px 16px 8px", textAlign: "center" }}>Danh mục</th>
                      <th style={{ padding: "0 8px 16px 8px", textAlign: "center" }}>Lượt sử dụng</th>
                      <th style={{ padding: "0 8px 16px 8px", textAlign: "center" }}>Điểm đánh giá</th>
                      <th style={{ padding: "0 8px 16px 8px", textAlign: "center" }}>Tickets Lỗi</th>
                      <th style={{ padding: "0 8px 16px 8px", textAlign: "center" }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.map((p, i) => {
                      let statusBadge = { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", text: "Ổn định" };
                      if ((p.rating > 0 && p.rating < 3.5) || p.ticketCount > 5) {
                        statusBadge = { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", text: "Cần cải thiện" };
                      } else if (p.rating >= 4.5 && p.sales > 10) {
                        statusBadge = { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", text: "Sản phẩm tốt" };
                      }

                      return (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(63, 63, 70, 0.2)", transition: "0.2s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(39, 39, 42, 0.3)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{ padding: "18px 8px", color: "#f4f4f5", fontWeight: "600", fontSize: "15px" }}>{p.name}</td>
                        <td style={{ padding: "18px 8px", textAlign: "center" }}><span style={{ background: "rgba(255,255,255,0.08)", color: "#d4d4d8", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>{p.category}</span></td>
                        <td style={{ padding: "18px 8px", textAlign: "center", color: "#f4f4f5", fontWeight: "700" }}>{p.sales.toLocaleString()}</td>
                        <td style={{ padding: "18px 8px", textAlign: "center", color: p.rating >= 4 ? "#eab308" : p.rating > 0 ? "#f97316" : "#71717a", fontWeight: "700" }}>{p.rating > 0 ? `${p.rating} ★` : "Chưa có"}</td>
                        <td style={{ padding: "18px 8px", textAlign: "center", fontWeight: "700", color: p.ticketCount > 0 ? "#ef4444" : "#a1a1aa" }}>{p.ticketCount}</td>
                        <td style={{ padding: "18px 8px", textAlign: "center" }}>
                          <span style={{background: statusBadge.bg, color: statusBadge.color, padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600"}}>
                            {statusBadge.text}
                          </span>
                        </td>
                      </tr>
                    )})}

                    {(() => {
                      const displayedTickets = displayedProducts.reduce((sum, p) => sum + (p.ticketCount || 0), 0);
                      const missingTickets = summary.totalTickets - displayedTickets;
                      if (missingTickets > 0 && !selectedProductId) {
                        return (
                          <tr style={{ background: "rgba(39, 39, 42, 0.2)", borderBottom: "1px solid rgba(63, 63, 70, 0.2)" }}>
                            <td style={{ padding: "18px 8px", color: "#a1a1aa", fontStyle: "italic", fontSize: "14px" }}>Ticket từ các Đơn hàng khác</td>
                            <td style={{ padding: "18px 8px", textAlign: "center", color: "#71717a" }}>-</td>
                            <td style={{ padding: "18px 8px", textAlign: "center", color: "#71717a" }}>-</td>
                            <td style={{ padding: "18px 8px", textAlign: "center", color: "#71717a" }}>-</td>
                            <td style={{ padding: "18px 8px", textAlign: "center", fontWeight: "700", color: "#ef4444" }}>{missingTickets}</td>
                            <td style={{ padding: "18px 8px", textAlign: "center", color: "#71717a" }}>-</td>
                          </tr>
                        );
                      }
                      return null;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}