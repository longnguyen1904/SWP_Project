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
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setCustomStartDate(start.toISOString().split('T')[0]);
    setCustomEndDate(end.toISOString().split('T')[0]);
    setActiveRange(label);
  };

  const handleCustomDateSubmit = () => {
    if (new Date(customStartDate) > new Date(customEndDate)) { alert("Ngày bắt đầu không được lớn hơn ngày kết thúc!"); return; }
    setStartDate(customStartDate);
    setEndDate(customEndDate);
    setActiveRange("custom");
  };

  useEffect(() => {
    if (role !== "VENDOR" && role !== "ADMIN") return;
    const fetchDropdownList = async () => {
      try {
        const config = { params: { startDate: "2000-01-01", endDate: today }, headers: { 'Authorization': `Bearer ${token}` } };
        const res = await axios.get("http://localhost:8081/api/vendor/revenue/top-products", config);
        setAllVendorProducts(res.data || []);
      } catch (error) { console.error("Lỗi tải dropdown:", error); }
    };
    fetchDropdownList();
  }, [role, token, today]);

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
          setSummary({ totalQty: sData.totalOrders || 0, avgRating: sData.vendorAvgRating || 0, totalReviews: sData.totalReviews || 0, totalTickets: sData.totalTickets || 0 });
        }
        if (topRes.status === "fulfilled") {
          const pData = topRes.value.data.map(p => ({ id: p.productId, name: p.productName, category: p.categoryName, sales: p.quantity, rating: p.avgRating, ticketCount: p.ticketCount || 0 }));
          setProductsData(pData.sort((a,b) => b.sales - a.sales));
        }
        if (distRes.status === "fulfilled") setRatingDist(distRes.value.data || []);
        if (reviewsRes.status === "fulfilled") setRecentReviews(reviewsRes.value.data || []);
        if (ticketRes.status === "fulfilled") setTicketStatus(ticketRes.value.data || []);

      } catch (error) { console.error("Lỗi Fetch Data:", error); }
      finally { setLoading(false); }
    };
    fetchAllData();
  }, [startDate, endDate, selectedProductId, role, token]);

  if (role !== "VENDOR" && role !== "ADMIN") return <div style={{ color: "white", textAlign: "center", padding: "100px" }}><h2><i className="bi bi-shield-lock-fill me-2"></i>Không có quyền truy cập</h2></div>;

  const displayedProducts = selectedProductId ? productsData.filter(p => String(p.id) === String(selectedProductId)) : productsData;

  // Tính tổng ticket từ sản phẩm
  const totalProductTickets = displayedProducts.reduce((sum, p) => sum + (p.ticketCount || 0), 0);
  const topBugProduct = [...displayedProducts].sort((a,b) => b.ticketCount - a.ticketCount)[0];

  // ==========================================
  // 1. MA TRẬN ĐỊNH HƯỚNG (SCATTER - CẢI TIẾN)
  // ==========================================
  const maxSales = Math.max(...displayedProducts.map(p => p.sales), 1);
  const scatterData = {
    datasets: [{
      label: 'Sản phẩm',
      data: displayedProducts.filter(p => p.sales > 0).map(p => ({
        x: p.sales,
        y: p.rating > 0 ? p.rating : 2.5,
        name: p.name,
        tickets: p.ticketCount,
        r: Math.max(6, Math.min(20, (p.sales / maxSales) * 18 + 4))
      })),
      backgroundColor: (ctx) => {
        const d = ctx.raw;
        if (!d) return 'rgba(59,130,246,0.6)';
        if (d.y >= 4.0 && d.tickets <= 2) return 'rgba(16, 185, 129, 0.75)';
        if (d.y >= 3.0 && d.tickets <= 5) return 'rgba(245, 158, 11, 0.75)';
        return 'rgba(239, 68, 68, 0.75)';
      },
      pointRadius: (ctx) => ctx.raw?.r || 8,
      pointHoverRadius: (ctx) => (ctx.raw?.r || 8) + 4,
      borderColor: (ctx) => {
        const d = ctx.raw;
        if (!d) return '#3b82f6';
        if (d.y >= 4.0 && d.tickets <= 2) return '#10b981';
        if (d.y >= 3.0 && d.tickets <= 5) return '#f59e0b';
        return '#ef4444';
      },
      borderWidth: 2
    }]
  };

  const scatterOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(9,9,11,0.95)', borderColor: '#3f3f46', borderWidth: 1,
        padding: 14, titleFont: { size: 14, weight: 'bold' }, bodyFont: { size: 13 },
        callbacks: {
          title: (items) => items[0]?.raw?.name || '',
          label: (ctx) => {
            const d = ctx.raw;
            return [
              `📊 Lượt bán: ${d.x}`,
              `⭐ Đánh giá: ${d.y.toFixed(1)} / 5.0`,
              `🐛 Ticket lỗi: ${d.tickets}`,
              d.y >= 4.0 && d.tickets <= 2 ? '✅ Sản phẩm tốt' : d.y < 3.0 || d.tickets > 5 ? '🔴 Cần cải thiện' : '🟡 Theo dõi'
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: '← Ít bán hơn ─── Lượt bán (Độ phổ biến) ─── Bán chạy →', color: '#71717a', font: { size: 12 } },
        grid: { color: 'rgba(82,82,91,0.15)', drawBorder: false },
        ticks: { color: '#52525b' }
      },
      y: {
        title: { display: true, text: '← Thấp ─── Điểm đánh giá (Chất lượng) ─── Cao →', color: '#71717a', font: { size: 12 } },
        min: 0.5, max: 5.5,
        grid: { color: 'rgba(82,82,91,0.15)', drawBorder: false },
        ticks: { color: '#52525b', stepSize: 1 }
      }
    }
  };

  // ==========================================
  // 2. BIỂU ĐỒ SỐ LỖI THEO SẢN PHẨM (BAR CHART MỚI)
  // ==========================================
  const bugProducts = [...displayedProducts].sort((a,b) => b.ticketCount - a.ticketCount).slice(0, 8);
  const bugBarData = {
    labels: bugProducts.map(p => p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name),
    datasets: [{
      label: 'Số ticket lỗi',
      data: bugProducts.map(p => p.ticketCount),
      backgroundColor: bugProducts.map(p => p.ticketCount > 5 ? 'rgba(239, 68, 68, 0.7)' : p.ticketCount > 2 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(16, 185, 129, 0.7)'),
      borderRadius: 6, borderSkipped: false,
      barThickness: 28,
    }]
  };
  const bugBarOptions = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(9,9,11,0.95)', borderColor: '#3f3f46', borderWidth: 1,
        callbacks: { label: (ctx) => `${ctx.parsed.x} ticket lỗi` }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(82,82,91,0.15)' }, ticks: { color: '#71717a', stepSize: 1 } },
      y: { grid: { display: false }, ticks: { color: '#a1a1aa', font: { size: 12, weight: '600' } } }
    }
  };

  // ==========================================
  // 3. CATEGORY BAR CHART
  // ==========================================
  const categoryStats = {};
  displayedProducts.forEach(p => {
    const catName = p.category && p.category.trim() !== "" ? p.category : "Chưa phân loại";
    if (!categoryStats[catName]) categoryStats[catName] = { ratingSum: 0, count: 0, tickets: 0 };
    if (p.rating > 0) { categoryStats[catName].ratingSum += p.rating; categoryStats[catName].count += 1; }
    categoryStats[catName].tickets += (p.ticketCount || 0);
  });

  const categories = Object.keys(categoryStats);
  const catAvgRatings = categories.map(c => categoryStats[c].count > 0 ? +(categoryStats[c].ratingSum / categoryStats[c].count).toFixed(1) : 0);
  const catTickets = categories.map(c => categoryStats[c].tickets);

  const catBarData = {
    labels: categories.map(c => c.length > 16 ? c.substring(0, 16) + '...' : c),
    datasets: [
      { label: 'Đánh giá TB', data: catAvgRatings, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderRadius: 4, yAxisID: 'y' },
      { label: 'Ticket lỗi', data: catTickets, backgroundColor: 'rgba(239, 68, 68, 0.5)', borderRadius: 4, yAxisID: 'y1' }
    ]
  };
  const catBarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#a1a1aa', usePointStyle: true, padding: 14 } } },
    scales: {
      x: { ticks: { color: '#71717a', font: { size: 11 } }, grid: { display: false } },
      y: { position: 'left', min: 0, max: 5, ticks: { color: '#3b82f6', stepSize: 1 }, grid: { color: 'rgba(82,82,91,0.12)' }, title: { display: true, text: 'Điểm ★', color: '#3b82f6' } },
      y1: { position: 'right', min: 0, ticks: { color: '#ef4444', stepSize: 1 }, grid: { display: false }, title: { display: true, text: 'Ticket', color: '#ef4444' } }
    }
  };

  // ==========================================
  // 4. DONUT CHARTS
  // ==========================================
  const ticketColors = { "Open": "#ef4444", "In Progress": "#f59e0b", "Resolved": "#3b82f6", "Closed": "#10b981" };
  const ticketDoughnutData = {
    labels: ticketStatus.map(t => t.status || "Khác"),
    datasets: [{ data: ticketStatus.map(t => t.count), backgroundColor: ticketStatus.map(t => ticketColors[t.status] || "#8b5cf6"), borderColor: "#18181b", borderWidth: 3, borderRadius: 6, hoverOffset: 6 }]
  };

  const starDataArray = [0, 0, 0, 0, 0];
  ratingDist.forEach(r => { if (r.rating >= 1 && r.rating <= 5) starDataArray[5 - r.rating] = r.count; });
  const starDoughnutData = {
    labels: ["5 Sao", "4 Sao", "3 Sao", "2 Sao", "1 Sao"],
    datasets: [{ data: starDataArray, backgroundColor: ["#10b981", "#3b82f6", "#facc15", "#f97316", "#ef4444"], borderColor: "#18181b", borderWidth: 3, borderRadius: 6, hoverOffset: 6 }]
  };
  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#a1a1aa', usePointStyle: true, padding: 14, font: { size: 12 } } } }, cutout: '72%' };

  // ==========================================
  // STYLES
  // ==========================================
  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f4f4f5", padding: "30px 20px", fontFamily: 'Inter, system-ui, sans-serif' },
    card: { background: "rgba(9, 9, 11, 0.7)", backdropFilter: "blur(14px)", border: "1px solid rgba(39, 39, 42, 0.6)", borderRadius: "16px", padding: "22px", boxShadow: "0 8px 24px -8px rgba(0,0,0,0.5)" },
    cardHover: { transition: "border-color 0.25s, box-shadow 0.25s" },
    btnQuick: (isActive) => ({ background: isActive ? "#3b82f6" : "transparent", color: isActive ? "white" : "#71717a", border: `1px solid ${isActive ? "#3b82f6" : "rgba(63, 63, 70, 0.5)"}`, padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: isActive ? "700" : "500", transition: "all 0.2s" }),
    input: { background: "#09090b", border: "1px solid rgba(63, 63, 70, 0.5)", color: "white", padding: "9px 14px", borderRadius: "8px", fontSize: "13px", outline: "none", minWidth: "150px", fontWeight: "500", cursor: "pointer" },
    dateInput: { background: "transparent", border: "none", color: "white", outline: "none", fontSize: "12px", cursor: "pointer" },
    kpiIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }
  };

  return (
    <div style={s.bg}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", margin: 0, color: "#f9fafb", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 10 }}>
              <i className="bi bi-graph-up-arrow" style={{ color: "#3b82f6" }}></i>
              Định hướng Chất lượng
            </h1>
            <p style={{ color: "#71717a", marginTop: 5, fontSize: "13px" }}>Phân tích lỗi sản phẩm, mức độ hài lòng và định hướng cải tiến</p>
          </div>
          
          {/* CONTROLS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <select style={s.input} value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">🔍 Tất cả Sản phẩm</option>
                {allVendorProducts.map(p => (
                  <option key={p.productId || p.id} value={p.productId || p.id}>{p.productName || p.name}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 4, background: "#09090b", padding: "4px", borderRadius: "10px", border: "1px solid rgba(39, 39, 42, 0.6)" }}>
                <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleRangeChange(7, "7d")}>7 ngày</button>
                <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleRangeChange(30, "30d")}>30 ngày</button>
                <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleRangeChange(90, "90d")}>3 tháng</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", background: "#09090b", padding: "5px 12px", borderRadius: "8px", border: "1px solid rgba(39, 39, 42, 0.5)" }}>
              <span style={{ fontSize: "12px", color: "#52525b" }}>Từ:</span>
              <input type="date" style={s.dateInput} value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} max={today} />
              <span style={{ fontSize: "12px", color: "#52525b" }}>→</span>
              <input type="date" style={s.dateInput} value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} max={today} />
              <button onClick={handleCustomDateSubmit} style={{ background: activeRange === "custom" ? "#3b82f6" : "#27272a", color: "white", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", transition: "0.2s" }}>Áp dụng</button>
            </div>
          </div>
        </div>

        {apiErrors.length > 0 && <div style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "4px solid #ef4444", color: "#fca5a5", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}><i className="bi bi-exclamation-triangle-fill me-2"></i>{apiErrors.join(" | ")}</div>}

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#3b82f6" }}>
            <div className="spinner-border mb-3" role="status"></div>
            <div style={{ color: "#71717a" }}>Đang đồng bộ dữ liệu...</div>
          </div>
        ) : (
          <>
            {/* KPI CARDS - REDESIGNED */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              <div style={{ ...s.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: "#52525b", fontSize: "12px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Điểm đánh giá</p>
                    <h2 style={{ fontSize: "28px", margin: "8px 0 0", color: "#eab308", fontWeight: "800" }}>{summary.avgRating} <span style={{fontSize: "18px"}}>★</span></h2>
                  </div>
                  <div style={{ ...s.kpiIcon, background: "rgba(234, 179, 8, 0.1)", color: "#eab308" }}><i className="bi bi-star-fill"></i></div>
                </div>
              </div>
              <div style={{ ...s.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: "#52525b", fontSize: "12px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tổng đánh giá</p>
                    <h2 style={{ fontSize: "28px", margin: "8px 0 0", color: "#8b5cf6", fontWeight: "800" }}>{summary.totalReviews}</h2>
                  </div>
                  <div style={{ ...s.kpiIcon, background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}><i className="bi bi-chat-square-heart-fill"></i></div>
                </div>
              </div>
              <div style={{ ...s.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: "#52525b", fontSize: "12px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tổng ticket lỗi</p>
                    <h2 style={{ fontSize: "28px", margin: "8px 0 0", color: summary.totalTickets > 10 ? "#ef4444" : "#3b82f6", fontWeight: "800" }}>{summary.totalTickets}</h2>
                  </div>
                  <div style={{ ...s.kpiIcon, background: summary.totalTickets > 10 ? "rgba(239, 68, 68, 0.1)" : "rgba(59, 130, 246, 0.1)", color: summary.totalTickets > 10 ? "#ef4444" : "#3b82f6" }}><i className="bi bi-bug-fill"></i></div>
                </div>
              </div>
              <div style={{ ...s.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: "#52525b", fontSize: "12px", margin: 0, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>SP nhiều lỗi nhất</p>
                    <h2 style={{ fontSize: "16px", margin: "8px 0 0", color: "#f97316", fontWeight: "700", lineHeight: 1.3 }}>{topBugProduct?.name || "—"}</h2>
                    {topBugProduct && <div style={{ fontSize: "11px", color: "#71717a", marginTop: 3 }}>{topBugProduct.ticketCount} ticket lỗi</div>}
                  </div>
                  <div style={{ ...s.kpiIcon, background: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}><i className="bi bi-exclamation-triangle-fill"></i></div>
                </div>
              </div>
            </div>

            {/* ROW 1: SCATTER MATRIX (wider) + BUG BAR CHART */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px", marginBottom: "16px" }}>
              <div style={{ ...s.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="bi bi-bullseye" style={{ color: "#3b82f6" }}></i>Ma trận Định hướng Sản phẩm
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#52525b" }}>Trục X: Lượt bán • Trục Y: Đánh giá • Kích thước: Độ phổ biến</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: "11px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span><span style={{color: "#71717a"}}>Tốt</span></span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span><span style={{color: "#71717a"}}>TB</span></span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span><span style={{color: "#71717a"}}>Yếu</span></span>
                  </div>
                </div>
                <div style={{ height: 340 }}><Scatter data={scatterData} options={scatterOptions} /></div>
              </div>

              <div style={{ ...s.card }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-bug-fill" style={{ color: "#ef4444" }}></i>Số lỗi theo Sản phẩm
                </h3>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#52525b" }}>Top sản phẩm có nhiều ticket lỗi nhất</p>
                <div style={{ height: 340 }}>
                  {bugProducts.length > 0 && bugProducts.some(p => p.ticketCount > 0) ? (
                    <Bar data={bugBarData} options={bugBarOptions} />
                  ) : (
                    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#27272a" }}>
                      <i className="bi bi-check-circle" style={{ fontSize: "2.5rem", marginBottom: 10, color: "#10b981", opacity: 0.3 }}></i>
                      <span style={{ color: "#52525b" }}>Không có lỗi nào!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: CATEGORY + TICKET STATUS + STAR DISTRIBUTION */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div style={{ ...s.card }}>
                <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-bar-chart-fill" style={{ color: "#3b82f6" }}></i>Phân tích theo Danh mục
                </h3>
                <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#52525b" }}>Đánh giá trung bình & số lỗi theo danh mục</p>
                <div style={{ height: 260 }}><Bar data={catBarData} options={catBarOptions} /></div>
              </div>

              <div style={{ ...s.card }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-pie-chart-fill" style={{ color: "#8b5cf6" }}></i>Trạng thái Ticket
                </h3>
                <div style={{ height: 260, display: "flex", alignItems: "center" }}>
                  {ticketStatus.length > 0 ? <Doughnut data={ticketDoughnutData} options={pieOptions} /> :
                    <div style={{ textAlign: "center", width: "100%", color: "#52525b" }}>Chưa có dữ liệu</div>}
                </div>
              </div>

              <div style={{ ...s.card }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-stars" style={{ color: "#eab308" }}></i>Phân bổ Sao
                </h3>
                <div style={{ height: 260, display: "flex", alignItems: "center" }}><Doughnut data={starDoughnutData} options={pieOptions} /></div>
              </div>
            </div>

            {/* ROW 3: RECENT REVIEWS */}
            <div style={{ ...s.card, marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-chat-left-quote-fill" style={{ color: "#8b5cf6" }}></i>Nhận xét gần đây
                </h3>
                {selectedProductId && <span style={{ fontSize: "12px", color: "#3b82f6", background: "rgba(59, 130, 246, 0.08)", padding: "3px 10px", borderRadius: "20px" }}>Lọc 1 SP</span>}
              </div>
              {recentReviews.length === 0 ? <div style={{textAlign: "center", padding: "30px 0", color: "#27272a"}}>Chưa có phản hồi nào.</div> : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                  {recentReviews.slice(0, 6).map((rev, idx) => (
                    <div key={idx} style={{ background: "rgba(24, 24, 27, 0.5)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(39, 39, 42, 0.5)", transition: "0.2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: "600", color: "#d4d4d8", fontSize: "13px" }}>Khách #{rev.userId}</div>
                          <div style={{ color: "#52525b", fontSize: "11px", marginTop: 2 }}>SP: <span style={{color: "#3b82f6"}}>{rev.productName}</span></div>
                        </div>
                        <div style={{ background: "rgba(234, 179, 8, 0.08)", padding: "2px 8px", borderRadius: "6px", color: "#eab308", fontSize: "13px", fontWeight: "600" }}>
                          {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                        </div>
                      </div>
                      <div style={{ color: "#a1a1aa", fontSize: "13px", lineHeight: "1.5", fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>"{rev.comment}"</div>
                      <div style={{ color: "#3f3f46", fontSize: "11px", marginTop: 10, textAlign: "right" }}>{rev.reviewDate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* TABLE: CHI TIẾT LỖI THEO SẢN PHẨM */}
            <div style={{ ...s.card }}>
              <h3 style={{ margin: "0 0 18px", fontSize: "16px", color: "#f4f4f5", fontWeight: "700", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="bi bi-table" style={{ color: "#3b82f6" }}></i>Chi tiết Lỗi & Chất lượng theo Sản phẩm
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(39, 39, 42, 0.6)", color: "#52525b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>
                      <th style={{ padding: "0 8px 14px" }}>Sản phẩm</th>
                      <th style={{ padding: "0 8px 14px", textAlign: "center" }}>Danh mục</th>
                      <th style={{ padding: "0 8px 14px", textAlign: "center" }}>Lượt bán</th>
                      <th style={{ padding: "0 8px 14px", textAlign: "center" }}>Đánh giá</th>
                      <th style={{ padding: "0 8px 14px", textAlign: "center" }}>Ticket lỗi</th>
                      <th style={{ padding: "0 8px 14px", textAlign: "center" }}>Tỷ lệ lỗi</th>
                      <th style={{ padding: "0 8px 14px", textAlign: "center" }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.map((p) => {
                      const errRate = p.sales > 0 ? ((p.ticketCount / p.sales) * 100).toFixed(1) : 0;
                      let badge = { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981", text: "Ổn định", icon: "bi-check-circle-fill" };
                      if ((p.rating > 0 && p.rating < 3.5) || p.ticketCount > 5) {
                        badge = { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444", text: "Cần cải thiện", icon: "bi-exclamation-circle-fill" };
                      } else if (p.rating >= 4.5 && p.sales > 10) {
                        badge = { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", text: "Xuất sắc", icon: "bi-trophy-fill" };
                      }

                      return (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(39, 39, 42, 0.3)", transition: "0.15s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(24, 24, 27, 0.4)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{ padding: "14px 8px", color: "#e4e4e7", fontWeight: "600", fontSize: "13px" }}>{p.name}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}><span style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", padding: "4px 8px", borderRadius: "4px", fontSize: "11px" }}>{p.category}</span></td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: "#d4d4d8", fontWeight: "600" }}>{p.sales.toLocaleString()}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: p.rating >= 4 ? "#eab308" : p.rating > 0 ? "#f97316" : "#3f3f46", fontWeight: "600" }}>{p.rating > 0 ? `${p.rating} ★` : "—"}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}>
                          <span style={{ fontWeight: "700", color: p.ticketCount > 5 ? "#ef4444" : p.ticketCount > 0 ? "#f97316" : "#3f3f46" }}>{p.ticketCount}</span>
                        </td>
                        <td style={{ padding: "14px 8px", textAlign: "center", color: errRate > 5 ? "#ef4444" : "#52525b", fontSize: "12px" }}>{errRate}%</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}>
                          <span style={{background: badge.bg, color: badge.color, padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: 4}}>
                            <i className={`bi ${badge.icon}`}></i>{badge.text}
                          </span>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "1px solid rgba(63, 63, 70, 0.4)" }}>
                      <td style={{ padding: "12px 8px", color: "#71717a", fontWeight: "600", fontSize: "12px" }}>TỔNG CỘNG</td>
                      <td></td>
                      <td style={{ padding: "12px 8px", textAlign: "center", color: "#d4d4d8", fontWeight: "700" }}>{displayedProducts.reduce((s,p) => s + p.sales, 0).toLocaleString()}</td>
                      <td style={{ padding: "12px 8px", textAlign: "center", color: "#eab308", fontWeight: "700" }}>{summary.avgRating} ★</td>
                      <td style={{ padding: "12px 8px", textAlign: "center", color: "#ef4444", fontWeight: "700" }}>{totalProductTickets}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}