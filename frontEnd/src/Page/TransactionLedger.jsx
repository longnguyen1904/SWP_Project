import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip'; 

export default function TransactionLedger() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const role = userStr ? JSON.parse(userStr)?.roleName : null;
  const token = localStorage.getItem('accessToken');

  const today = new Date().toISOString().split('T')[0];
  
  // --- STATES ---
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(today);
  const [activeRange, setActiveRange] = useState("30d"); // Mặc định là 30 ngày
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const [vendorProducts, setVendorProducts] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // --- HÀM XỬ LÝ LỌC NHANH ---
  const handleQuickRange = (days, label) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setActiveRange(label);
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await axios.get("http://localhost:8081/api/vendor/revenue/top-products", {
          params: { startDate: "2000-01-01", endDate: today },
          headers: { Authorization: `Bearer ${token}` }
        });
        setVendorProducts(res.data || []);
      } catch (err) { console.error("Lỗi load SP:", err); }
    };
    loadProducts();
  }, []);

  const fetchLedger = async () => {
    if (role !== "VENDOR" && role !== "ADMIN") return;
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:8081/api/vendor/revenue/ledger", {
        params: { startDate, endDate, search: searchTerm, productId: selectedProductId, sortBy },
        headers: { Authorization: `Bearer ${token}` }
      });
      setLedgerData(res.data || []);
      setSelectedIds([]); 
    } catch (err) { console.error("Lỗi lấy sổ cái:", err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchLedger(); }, [startDate, endDate, selectedProductId, sortBy]);

  // --- LOGIC NÉN ZIP (TRỊ IDM) ---
  const handleBulkPDF = async () => {
    if (isExporting || selectedIds.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    const zip = new JSZip();
    const folder = zip.folder("Invoices_List");

    try {
      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        const antiIDMUrl = `http://localhost:8081/api/vendor/revenue/export-invoice/${id}?t=${new Date().getTime()}&r=${Math.random()}`;
        const res = await axios.get(antiIDMUrl, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        });
        folder.file(`Invoice_TCK${id}.pdf`, res.data);
        setExportProgress(Math.round(((i + 1) / selectedIds.length) * 100));
        await new Promise(r => setTimeout(r, 50));
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoices_Bulk_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 5000);
      setSelectedIds([]);
    } catch (err) {
      alert("Lỗi khi nén file!");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleBulkCSV = () => {
    const selectedRows = ledgerData.filter(row => selectedIds.includes(row.transactionId));
    const header = "Ma GD,Ngay,San pham,Khach hang,Gia ban,Phi san (10%),Thuc nhan\n";
    const rows = selectedRows.map(r => `${r.transactionId},${r.transactionDate},${r.productName},${r.customerName},${r.grossAmount},${r.platformFee},${r.netAmount}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BaoCao_Export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    setSelectedIds([]);
  };

  // --- STYLES ---
  const s = {
    bg: { minHeight: "100vh", color: "#f8fafc", fontFamily: 'Inter, sans-serif', padding: "24px" },
    card: { background: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(63, 63, 70, 0.4)", borderRadius: "16px", padding: "24px" },
    input: { background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white", padding: "10px 14px", borderRadius: "8px", outline: "none", fontSize: "13px" },
    btnQuick: (isActive) => ({
      background: isActive ? "#3b82f6" : "rgba(39, 39, 42, 0.5)",
      color: isActive ? "white" : "#a1a1aa",
      border: `1px solid ${isActive ? "#3b82f6" : "rgba(82, 82, 91, 0.5)"}`,
      padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", transition: "0.2s", fontWeight: "600"
    }),
    th: { padding: "16px 12px", textAlign: "left", color: "#a1a1aa", fontSize: "12px", fontWeight: "700", borderBottom: "1px solid rgba(82, 82, 91, 0.4)", textTransform: "uppercase" },
    td: { padding: "16px 12px", borderBottom: "1px solid rgba(63, 63, 70, 0.3)", color: "#f4f4f5", fontSize: "14px" },
    bulkBar: { position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", background: "#3b82f6", color: "white", padding: "14px 28px", borderRadius: "50px", display: "flex", alignItems: "center", gap: "20px", boxShadow: "0 10px 40px rgba(59, 130, 246, 0.6)", zIndex: 1000 }
  };

  if (role !== "VENDOR" && role !== "ADMIN") return <div style={{ color: "white", textAlign: "center", padding: "100px" }}><h2>🚫 Không có quyền truy cập</h2></div>;

  return (
    <div style={s.bg}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        
        <button onClick={() => navigate("/Page/Vendor/RevenueDashboard")} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", fontWeight: "600" }}>
          ← Quay lại Tổng quan
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: "32px", fontWeight: "800", margin: 0 }}>Sổ cái Giao dịch chi tiết</h1>
        </div>

        {/* BỘ LỌC TÍCH HỢP LỌC NHANH */}
        <div style={{ ...s.card, marginBottom: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-end" }}>
            
            {/* Quick Ranges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", color: "#a1a1aa" }}>LỌC NHANH</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={s.btnQuick(activeRange === "7d")} onClick={() => handleQuickRange(7, "7d")}>7 Ngày</button>
                <button style={s.btnQuick(activeRange === "30d")} onClick={() => handleQuickRange(30, "30d")}>30 Ngày</button>
                <button style={s.btnQuick(activeRange === "90d")} onClick={() => handleQuickRange(90, "90d")}>3 Tháng</button>
              </div>
            </div>

            {/* Custom Dates */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", color: "#a1a1aa" }}>KHOẢNG THỜI GIAN TÙY CHỈNH</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="date" value={startDate} style={s.input} onChange={e => { setStartDate(e.target.value); setActiveRange("custom"); }} />
                <span style={{ color: "#71717a" }}>-</span>
                <input type="date" value={endDate} style={s.input} onChange={e => { setEndDate(e.target.value); setActiveRange("custom"); }} />
              </div>
            </div>

            {/* Product Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <label style={{ fontSize: "11px", color: "#a1a1aa" }}>SẢN PHẨM</label>
              <select style={{ ...s.input, width: "100%" }} value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                <option value="">Tất cả sản phẩm</option>
                {vendorProducts.map(p => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
              </select>
            </div>

            {/* Search */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <label style={{ fontSize: "11px", color: "#a1a1aa" }}>TÌM KIẾM</label>
              <input type="text" placeholder="Tên khách, Mã GD..." style={{ ...s.input, width: "100%" }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div style={{ ...s.card, padding: 0, overflow: "hidden" }}>
          {isLoading ? <div style={{ textAlign: "center", padding: "80px", color: "#3b82f6" }}>🔄 Đang tải...</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "rgba(39, 39, 42, 0.8)" }}>
                  <tr>
                    <th style={{ ...s.th, width: "50px", textAlign: "center" }}>
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                           if (e.target.checked) setSelectedIds(ledgerData.map(r => r.transactionId));
                           else setSelectedIds([]);
                        }} 
                        checked={selectedIds.length === ledgerData.length && ledgerData.length > 0} 
                        disabled={isExporting}
                      />
                    </th>
                    <th style={s.th}>Mã GD</th>
                    <th style={s.th}>Sản phẩm / Đơn hàng</th>
                    <th style={s.th}>Khách hàng</th>
                    <th style={{ ...s.th, textAlign: "right" }}>Giá Gốc</th>
                    <th style={{ ...s.th, textAlign: "right", color: "#ef4444" }}>Phí Sàn (10%)</th>
                    <th style={{ ...s.th, textAlign: "right", color: "#10b981" }}>Thực Nhận</th>
                    <th style={{ ...s.th, textAlign: "center" }}>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.map((row) => (
                    <tr key={row.transactionId} style={{ backgroundColor: selectedIds.includes(row.transactionId) ? "rgba(59, 130, 246, 0.1)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ ...s.td, textAlign: "center" }}>
                        <input type="checkbox" checked={selectedIds.includes(row.transactionId)} onChange={() => {
                          if(selectedIds.includes(row.transactionId)) setSelectedIds(selectedIds.filter(id => id !== row.transactionId));
                          else setSelectedIds([...selectedIds, row.transactionId]);
                        }} disabled={isExporting} />
                      </td>
                      <td style={{ ...s.td, fontWeight: "800", color: "#3b82f6" }}>#{row.transactionId}</td>
                      <td style={s.td}>{row.productName}</td>
                      <td style={s.td}>{row.customerName}</td>
                      <td style={{ ...s.td, textAlign: "right" }}>{Number(row.grossAmount).toLocaleString()} đ</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#ef4444" }}>-{Number(row.platformFee).toLocaleString()} đ</td>
                      <td style={{ ...s.td, textAlign: "right", color: "#10b981", fontWeight: "800" }}>{Number(row.netAmount).toLocaleString()} đ</td>
                      <td style={{ ...s.td, textAlign: "center", fontSize: "12px" }}>{new Date(row.transactionDate).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* BULK ACTION BAR */}
        {selectedIds.length > 0 && (
          <div style={s.bulkBar}>
            <span style={{ fontWeight: "700" }}>{isExporting ? `⌛ Nén file (${exportProgress}%)...` : `Đã chọn ${selectedIds.length} đơn`}</span>
            <button onClick={handleBulkPDF} disabled={isExporting} style={{ background: "white", color: "#3b82f6", border: "none", padding: "10px 24px", borderRadius: "25px", fontWeight: "800", cursor: "pointer" }}>
              📦 Tải file ZIP
            </button>
            <button onClick={handleBulkCSV} disabled={isExporting} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", padding: "10px 24px", borderRadius: "25px", fontWeight: "800", cursor: "pointer" }}>
              📊 Tải CSV Gộp
            </button>
            {!isExporting && <button onClick={() => setSelectedIds([])} style={{ background: "none", border: "none", color: "white", cursor: "pointer", textDecoration: "underline" }}>Hủy</button>}
          </div>
        )}

      </div>
    </div>
  );
}