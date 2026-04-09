import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function VendorTicketManagement() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.roleName;
  const token = localStorage.getItem('accessToken');
  const currentUserId = token ? token.split('_')[1] : null;

  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterContext, setFilterContext] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isKanbanMode, setIsKanbanMode] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState({});

  // STATE: Popup Thông tin & Chi tiết Sản phẩm + Hóa đơn
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchTickets = async () => {
    if (role !== "VENDOR" && role !== "ADMIN") return;
    setIsLoading(true);
    setPendingUpdates({});
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/tickets/vendor", { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) { console.error("Lỗi:", err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleRefresh = () => {
    setFilterStatus("All");
    setFilterContext("ALL");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSelectedTicket(null);
    fetchTickets();
  };

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tickets/${ticket.ticketId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
    } catch (err) { console.error("Lỗi:", err); }
  };

  const handleShowInfoModal = async () => {
    setShowInfoModal(true);
    setProductDetails(null);
    if (selectedTicket?.orderId) {
      setIsLoadingProduct(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tickets/${selectedTicket.ticketId}/product-details`, { headers: { Authorization: `Bearer ${token}` } });
        setProductDetails(res.data);
      } catch (err) {
        console.error("Không lấy được chi tiết SP", err);
      } finally {
        setIsLoadingProduct(false);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() && !replyFile) return;

    const textToSend = replyText;
    const fileToSend = replyFile;
    const tempId = `temp-${Date.now()}`;
    const localFileUrl = fileToSend ? URL.createObjectURL(fileToSend) : null;

    const tempMsg = {
      messageId: tempId,
      senderId: currentUserId,
      senderName: "Bạn (Vendor)",
      messageContent: textToSend,
      attachmentUrl: localFileUrl,
      createdAt: new Date().toISOString(),
      isSending: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setReplyText("");
    setReplyFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const formData = new FormData();
      formData.append("content", textToSend);
      if (fileToSend) formData.append("file", fileToSend);

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/tickets/${selectedTicket.ticketId}/reply`, formData, { headers: { Authorization: `Bearer ${token}` } });

      setMessages(prev => prev.map(msg =>
        msg.messageId === tempId
          ? { ...msg, messageId: Date.now(), attachmentUrl: res.data.fileUrl || localFileUrl, isSending: false }
          : msg
      ));

      setTickets(prev => prev.map(t =>
        t.ticketId === selectedTicket.ticketId
          ? { ...t, lastMessageAt: new Date().toISOString() }
          : t
      ));

      if (selectedTicket.status === "Open") {
        await updateTicketStatusDirect(selectedTicket.ticketId, "Resolved");
      }
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.messageId !== tempId));
      console.error("Gửi thất bại.");
    }
  };

  const updateTicketStatusDirect = async (ticketId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/tickets/${ticketId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(prev => prev.map(t => t.ticketId === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) { console.error("Lỗi:", err.response?.data?.error); }
  };

  const handleResolveTicket = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận đã hỗ trợ xong và chuyển trạng thái Ticket thành Đã trả lời (Resolved) không?")) {
      return;
    }
    await updateTicketStatusDirect(selectedTicket.ticketId, "Resolved");
  };

  const handleToggleKanban = () => {
    if (isKanbanMode) {
      if (Object.keys(pendingUpdates).length > 0) {
        fetchTickets();
      }
      setIsKanbanMode(false); 
    } else {
      setIsKanbanMode(true);
    }
  };

  const handleDragStart = (e, ticketId) => { e.dataTransfer.setData("ticketId", ticketId); };
  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    if (!ticketId) return;

    const ticket = tickets.find(t => String(t.ticketId) === ticketId);
    if (!ticket) return;
    if (ticket.status === newStatus) {
      return;
    }

    if (ticket.status !== "Open" || newStatus !== "Resolved") {
      alert("Lỗi vi phạm: Bạn (Vendor) chỉ được chuyển Ticket từ trạng thái Đang xử lý (Open) sang Đã trả lời (Resolved)!");
      return;
    }

    setTickets(prev => prev.map(t => String(t.ticketId) === ticketId ? { ...t, status: "Resolved" } : t));
    setPendingUpdates(prev => ({ ...prev, [ticketId]: "Resolved" }));
    if (selectedTicket?.ticketId === Number(ticketId)) {
      setSelectedTicket(prev => ({ ...prev, status: "Resolved" }));
    }
  };

  const handleConfirmChanges = async () => {
    const updates = Object.entries(pendingUpdates);
    if (updates.length === 0) {
      alert("Chưa có thay đổi nào để xác nhận.");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xác nhận và lưu các thay đổi trạng thái này lên hệ thống không?")) {
      return;
    }

    try {
      await Promise.all(updates.map(([id, status]) =>
        axios.put(`${import.meta.env.VITE_API_URL}/api/tickets/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      ));
      alert("Tuyệt vời! Đã lưu các thay đổi trạng thái thành công.");
      setPendingUpdates({});
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi lưu thay đổi lên máy chủ!");
    }
  };

  if (role !== "VENDOR" && role !== "ADMIN") return <div style={{ minHeight: "100vh", background: "transparent", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}><h2>🚫 Không có quyền truy cập</h2></div>;

  const getTicketContext = (t) => {
    const sub = (t.subject || '').toLowerCase();
    if (!t.orderId || sub.startsWith('[pre-sale') || sub.startsWith('[feature') || sub.startsWith('[report')) return 'INQUIRY';
    if (sub.startsWith('[payment') || sub.startsWith('[delivery') || sub.startsWith('[coupon')) return 'PAYMENT';
    return 'PURCHASED';
  };

  const filteredTickets = tickets
    .filter(t => {
      const matchStatus = isKanbanMode ? true : (filterStatus === "All" || t.status === filterStatus);
      const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticketId.toString().includes(searchTerm) || t.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || t.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
      const matchStart = startDate ? ticketDate >= startDate : true;
      const matchEnd = endDate ? ticketDate <= endDate : true;
      const matchContext = filterContext === 'ALL' || getTicketContext(t) === filterContext;
      return matchStatus && matchSearch && matchStart && matchEnd && matchContext;
    })
    .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));

  const openTickets = filteredTickets.filter(t => t.status === "Open");
  const resolvedTickets = filteredTickets.filter(t => t.status === "Resolved");
  const closedTickets = filteredTickets.filter(t => t.status === "Closed");

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f8fafc", fontFamily: 'Inter, system-ui, sans-serif', display: "flex", padding: "24px", gap: "24px" },
    panel: { backgroundColor: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(63, 63, 70, 0.4)", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" },
    input: { background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%", outline: "none" },
    btn: { padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", border: "none", transition: "0.2s", display: "flex", alignItems: "center", gap: "6px" },
    badge: (status) => ({ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: status === "Closed" ? "rgba(113, 113, 122, 0.2)" : status === "Resolved" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)", color: status === "Closed" ? "#a1a1aa" : status === "Resolved" ? "#f59e0b" : "#3b82f6", border: `1px solid ${status === "Closed" ? "rgba(113, 113, 122, 0.3)" : status === "Resolved" ? "rgba(245, 158, 11, 0.3)" : "rgba(59, 130, 246, 0.3)"}` }),
    colHeader: (color) => ({ padding: "12px", fontWeight: "700", fontSize: "14px", borderBottom: `2px solid ${color}`, backgroundColor: "rgba(39, 39, 42, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }),
    kanbanCard: { backgroundColor: "rgba(39, 39, 42, 0.95)", padding: "14px", borderRadius: "10px", cursor: "pointer", border: "1px solid rgba(82, 82, 91, 0.4)", transition: "0.2s" },
    badgeCount: { backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }
  };

  const renderTicketCard = (t, isKanban) => (
    <div key={t.ticketId}
      draggable={isKanban && t.status === "Open"}
      onDragStart={(e) => isKanban && t.status === "Open" && handleDragStart(e, t.ticketId)}
      onClick={() => handleSelectTicket(t)}
      style={{
        ...s.kanbanCard, margin: isKanban ? "10px 10px 0 10px" : "0 0 8px 0",
        backgroundColor: selectedTicket?.ticketId === t.ticketId ? (isKanban ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.15)") : "rgba(39, 39, 42, 0.6)",
        borderColor: selectedTicket?.ticketId === t.ticketId ? "#3b82f6" : "rgba(82, 82, 91, 0.4)",
        opacity: (t.status === "Closed" || t.status === "Resolved") && isKanban ? 0.7 : 1,
        cursor: t.status === "Open" && isKanban ? "grab" : "pointer"
      }}
      onMouseOver={(e) => { if (selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(63, 63, 70, 0.6)" }}
      onMouseOut={(e) => { if (selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(39, 39, 42, 0.6)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#3b82f6", fontWeight: "700" }}>#TCK-{t.ticketId}</span>
        {!isKanban && <span style={s.badge(t.status)}>{t.status}</span>}
        {isKanban && <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</span>}
      </div>
   

      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#f4f4f5", lineHeight: "1.4" }}>{t.subject}</h4>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#f97316", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "10px", fontWeight: "bold", color: "white" }}>
            {t.customerName?.charAt(0).toUpperCase() || "C"}
          </div>
          <span style={{ fontSize: "12px", color: "#d4d4d8" }}>{t.customerName || "Khách hàng"}</span>
        </div>
        {!isKanban && <span style={{ fontSize: "15px", color: "#a1a1aa" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</span>}
      </div>
    </div>
  );

  return (
    <div style={s.bg}>
      <div style={{ ...s.panel, width: isKanbanMode ? "100%" : "35%", minWidth: "350px", height: "calc(100vh - 48px)", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#f9fafb" }}>Quản lý Ticket</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleRefresh} style={{ ...s.btn, background: "rgba(39, 39, 42, 0.8)", color: "white", border: "1px solid rgba(82, 82, 91, 0.5)" }}><i className="bi bi-arrow-clockwise me-1"></i> Làm mới</button>
              {isKanbanMode && ( <button onClick={handleConfirmChanges} style={{ ...s.btn, background: "#10b981", color: "white" }}><i className="bi bi-check2-circle me-1"></i>Xác nhận</button> )}
              <button onClick={handleToggleKanban} style={{ ...s.btn, background: isKanbanMode ? "#f97316" : "rgba(39, 39, 42, 0.8)", color: isKanbanMode ? "white" : "#a1a1aa", border: `1px solid ${isKanbanMode ? "#f97316" : "rgba(82, 82, 91, 0.5)"}` }}>
                {isKanbanMode ? <><i className="bi bi-x-lg me-1"></i>Đóng</> : <><i className="bi bi-kanban me-1"></i>Xử lý ticket</>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexDirection: isKanbanMode ? "row" : "column" }}>
            <input type="text" className="custom-placeholder" placeholder="Tìm tên khách, sản phẩm, Tiêu đề, #ID..." style={{ ...s.input, flex: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(39, 39, 42, 0.8)", padding: "4px 8px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.5)" }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: "transparent", border: "none", color: startDate ? "white" : "#a1a1aa", outline: "none", fontSize: "12px" }} />
              <span style={{ color: "#71717a" }}>→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: "transparent", border: "none", color: endDate ? "white" : "#a1a1aa", outline: "none", fontSize: "12px" }} />
            </div>
          </div>

          {!isKanbanMode && (
            <>
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {["All", "Open", "Resolved", "Closed"].map(st => (
                  <button key={st} onClick={() => setFilterStatus(st)}
                    style={{
                      flex: 1, padding: "6px 0", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none", fontWeight: "600",
                      backgroundColor: filterStatus === st ? "#3b82f6" : "rgba(39, 39, 42, 0.8)", color: filterStatus === st ? "white" : "#a1a1aa"
                    }}>
                    {st}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                {[
                  { id: 'ALL', label: 'Tất cả', icon: 'bi-grid-fill' },
                  { id: 'PURCHASED', label: 'Đã mua', icon: 'bi-bag-check-fill' },
                  { id: 'PAYMENT', label: 'Đang mua', icon: 'bi-credit-card-fill' },
                  { id: 'INQUIRY', label: 'Hỏi đáp', icon: 'bi-chat-left-quote-fill' },
                ].map(ctx => (
                  <button key={ctx.id} onClick={() => setFilterContext(ctx.id)}
                    style={{
                      padding: "5px 12px", borderRadius: "6px", fontSize: "12px", cursor: "pointer",
                      border: filterContext === ctx.id ? "1px solid #f97316" : "1px solid rgba(82, 82, 91, 0.4)",
                      fontWeight: "600", display: "flex", alignItems: "center", gap: "5px",
                      backgroundColor: filterContext === ctx.id ? "rgba(249,115,22,0.15)" : "rgba(39, 39, 42, 0.6)",
                      color: filterContext === ctx.id ? "#f97316" : "#a1a1aa", transition: "0.2s"
                    }}>
                    <i className={`bi ${ctx.icon}`} style={{ fontSize: '11px' }}></i>
                    {ctx.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {isLoading ? <div style={{ textAlign: "center", color: "#3b82f6", marginTop: "40px" }}>Đang tải...</div> :

          isKanbanMode ? (
            <div style={{ display: "flex", flex: 1, overflowX: "auto", overflowY: "hidden", backgroundColor: "rgba(24, 24, 27, 0.3)" }}>
              <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(63, 63, 70, 0.4)" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Open")}>
                <div style={s.colHeader("#3b82f6")}><span style={{ color: "#3b82f6" }}><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Đang xử lý</span><span style={s.badgeCount}>{openTickets.length}</span></div>
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>{openTickets.map(t => renderTicketCard(t, true))}</div>
              </div>
              <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(63, 63, 70, 0.4)" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Resolved")}>
                <div style={s.colHeader("#f59e0b")}><span style={{ color: "#f59e0b" }}><i className="bi bi-check-circle-fill me-1" style={{ fontSize: '10px' }}></i> Đã trả lời</span><span style={s.badgeCount}>{resolvedTickets.length}</span></div>
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>{resolvedTickets.map(t => renderTicketCard(t, true))}</div>
              </div>
              <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Closed")}>
                <div style={s.colHeader("#71717a")}><span style={{ color: "#a1a1aa" }}><i className="bi bi-lock-fill me-1" style={{ fontSize: '10px' }}></i> Đã đóng</span><span style={s.badgeCount}>{closedTickets.length}</span></div>
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>{closedTickets.map(t => renderTicketCard(t, true))}</div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {filteredTickets.length === 0 ? <div style={{ textAlign: "center", color: "#a1a1aa", marginTop: "20px", fontSize: "14px" }}>Không có dữ liệu.</div> :
                filteredTickets.map(t => renderTicketCard(t, false))
              }
            </div>
          )}
      </div>

      {!isKanbanMode && (
      <div style={{ ...s.panel, flex: 1, height: "calc(100vh - 48px)", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        {!selectedTicket ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#71717a", backgroundColor: "rgba(24, 24, 27, 0.3)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.15 }}><i className="bi bi-chat-square-text"></i></div>
            <h3>Chọn một Ticket để bắt đầu hỗ trợ</h3>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)", display: "flex", justifyContent: "space-between", backgroundColor: "transparent", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0", color: "#f4f4f5" }}>{selectedTicket.subject}</h2>
                
                {/* GỘP TÊN KHÁCH HÀNG VÀ TÊN SẢN PHẨM TRÊN CÙNG MỘT DÒNG Ở ĐÂY */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#a1a1aa" }}>
                  <span>Khách: <strong style={{ color: "white" }}>{selectedTicket.customerName}</strong></span>
                  <span style={{ color: "#52525b" }}>|</span>
                  <span>Sản phẩm: <strong style={{ color: "#f97316" }}>{selectedTicket.productName || "Không xác định"}</strong></span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button 
                  onClick={handleShowInfoModal} 
                  style={{ ...s.btn, background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white" }}
                >
                  <i className="bi bi-info-circle me-1"></i> Thông tin
                </button>

                {selectedTicket.status === "Open" && (
                  <button onClick={handleResolveTicket}
                    style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#10b981", color: "white", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)", transition: "0.2s" }}><i className="bi bi-check2-circle me-1"></i> Xác nhận đã trả lời
                  </button>
                )}
                
                {selectedTicket.status === "Closed" && (
                  <span style={{ padding: "6px 12px", background: "rgba(113, 113, 122, 0.2)", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px" }}>
                    <i className="bi bi-lock-fill me-1"></i> Khách đã đóng
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "rgba(24, 24, 27, 0.4)" }}>
              {sortedMessages.map((msg) => {
                const isMine = String(msg.senderId) === String(currentUserId);
                return (
                  <div key={msg.messageId} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", opacity: msg.isSending ? 0.6 : 1 }}>
                    <span style={{ fontSize: "12px", color: "#71717a", marginBottom: "4px" }}>
                      {isMine ? "Bạn" : msg.senderName} • {msg.isSending ? "Đang gửi..." : new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {msg.messageContent && (
                      <div style={{
                        maxWidth: "75%", padding: "12px 16px", borderRadius: "14px", wordBreak: "break-word",
                        backgroundColor: isMine ? "#3b82f6" : "rgba(63, 63, 70, 0.6)",
                        color: "white",
                        borderBottomRightRadius: isMine && !msg.attachmentUrl ? "4px" : "14px",
                        borderBottomLeftRadius: !isMine && !msg.attachmentUrl ? "4px" : "14px",
                        marginBottom: msg.attachmentUrl ? "6px" : "0"
                      }}>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.5" }}>{msg.messageContent}</div>
                      </div>
                    )}

                    {msg.attachmentUrl && (
                      <div style={{ maxWidth: isKanbanMode ? "90%" : "75%", borderRadius: "12px", overflow: "hidden", borderBottomRightRadius: isMine ? "4px" : "12px", borderBottomLeftRadius: !isMine ? "4px" : "12px" }}>
                        {msg.attachmentUrl.startsWith('blob:') || msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null || msg.attachmentUrl.includes('res.cloudinary.com/image') ? (
                          <img src={msg.attachmentUrl} alt="attachment" style={{ maxWidth: "100%", maxHeight: "250px", display: "block", objectFit: "cover" }} />
                        ) : (
                          <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", padding: "10px 14px", color: "white", textDecoration: "none", fontSize: "13px", backgroundColor: isMine ? "#3b82f6" : "rgba(63, 63, 70, 0.6)" }}>
                            <i className="bi bi-paperclip me-1"></i> {msg.isSending ? "Đang tải file lên..." : "Tải file đính kèm"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "16px", borderTop: "1px solid rgba(82, 82, 91, 0.5)", backgroundColor: "rgba(39, 39, 42, 0.3)" }}>
              {selectedTicket.status === "Closed" ? (
                <div style={{ textAlign: "center", color: "#10b981", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", fontWeight: "500" }}><i className="bi bi-lock-fill me-1"></i> Ticket này đã được đóng lại. Không thể nhắn thêm.</div>
              ) : (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                    {replyFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", backgroundColor: "rgba(63, 63, 70, 0.6)", borderRadius: "6px", width: "max-content", fontSize: "12px" }}>
                        <span style={{ color: "#3b82f6" }}><i className="bi bi-paperclip me-1"></i>{replyFile.name}</span>
                        <button onClick={() => { setReplyFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0" }}><i className="bi bi-x-lg"></i></button>
                      </div>
                    )}
                    <textarea rows={isKanbanMode ? "3" : "2"} placeholder="Nhập hướng dẫn xử lý lỗi..." style={{ ...s.input, resize: "none", backgroundColor: "rgba(24, 24, 27, 0.8)", border: "1px solid rgba(82, 82, 91, 0.8)", fontSize: "13px" }} value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setReplyFile(e.target.files[0])} />
                  <div style={{ display: "flex", flexDirection: isKanbanMode ? "column" : "row", gap: "10px" }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.8)", backgroundColor: "rgba(24, 24, 27, 0.8)", color: "#a1a1aa", cursor: "pointer", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(63, 63, 70, 0.8)"} onMouseOut={e => e.currentTarget.style.backgroundColor = "rgba(24, 24, 27, 0.8)"}><i className="bi bi-paperclip" style={{ fontSize: '1.1rem' }}></i></button>
                    <button onClick={handleSendReply} disabled={!replyText.trim() && !replyFile} style={{ padding: "10px 20px", borderRadius: "8px", backgroundColor: (!replyText.trim() && !replyFile) ? "rgba(63, 63, 70, 0.6)" : "#3b82f6", color: (!replyText.trim() && !replyFile) ? "#a1a1aa" : "white", border: "none", cursor: (!replyText.trim() && !replyFile) ? "not-allowed" : "pointer", fontWeight: "600", transition: "0.2s", boxShadow: (!replyText.trim() && !replyFile) ? "none" : "0 4px 14px rgba(59,130,246,0.3)" }}>Gửi <i className="bi bi-send-fill ms-1"></i></button>
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
      )}

      {/* POPUP THÔNG TIN ĐƠN HÀNG KẾT HỢP CHI TIẾT SẢN PHẨM & VERSION */}
      {showInfoModal && selectedTicket && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ backgroundColor: "rgba(24, 24, 27, 0.95)", border: "1px solid rgba(82, 82, 91, 0.5)", borderRadius: "12px", width: "450px", padding: "24px", color: "white", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#f9fafb" }}>Chi tiết Ticket & Đơn hàng</h3>
              <button onClick={() => setShowInfoModal(false)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: "16px" }}><i className="bi bi-x-lg"></i></button>
            </div>
            
            {/* THÔNG TIN TICKET */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Mã Ticket:</span> 
                <strong style={{ color: "#3b82f6" }}>#TCK-{selectedTicket.ticketId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Khách hàng:</span> 
                <strong>{selectedTicket.customerName || "Ẩn danh"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
                <span style={{ color: "#a1a1aa", minWidth: "70px" }}>Tiêu đề lỗi:</span> 
                <strong style={{ textAlign: "right", color: "#fca5a5" }}>{selectedTicket.subject}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Ngày tạo Ticket:</span> 
                <strong>{new Date(selectedTicket.createdAt).toLocaleString("vi-VN")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a1a1aa" }}>Trạng thái hiện tại:</span> 
                <span style={s.badge(selectedTicket.status)}>{selectedTicket.status}</span>
              </div>
            </div>

            {/* HIỂN THỊ DỮ LIỆU TỪ BACKEND: ĐƠN HÀNG VÀ VERSION SẢN PHẨM */}
            {selectedTicket.orderId && (
              <div style={{ marginTop: "24px", borderTop: "1px dashed rgba(63, 63, 70, 0.4)", paddingTop: "16px" }}>
                <h4 style={{ color: "#f9fafb", fontSize: "15px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                   Thông tin Hóa đơn & Phiên bản
                </h4>
                
                {isLoadingProduct ? (
                    <div style={{ textAlign: "center", color: "#a1a1aa", padding: "10px 0" }}>Đang tải dữ liệu đơn hàng...</div>
                ) : productDetails ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", backgroundColor: "rgba(39, 39, 42, 0.5)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.3)" }}>
                        
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#a1a1aa" }}>Mã Đơn hàng:</span> 
                          <strong style={{ color: "#10b981" }}>#{selectedTicket.orderId}</strong>
                        </div>

                        {/* Các trường lấy thêm từ bảng Order */}
                        {productDetails.orderTotalAmount && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#a1a1aa" }}>Tổng thanh toán:</span> 
                            <strong style={{ color: "#fbbf24" }}>{Number(productDetails.orderTotalAmount).toLocaleString('vi-VN')} VNĐ</strong>
                          </div>
                        )}
                        
                        {productDetails.orderPaymentStatus && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#a1a1aa" }}>Trạng thái thanh toán:</span> 
                            <strong style={{ color: productDetails.orderPaymentStatus === "Success" || productDetails.orderPaymentStatus === "Paid" ? "#10b981" : "#f59e0b" }}>
                              {productDetails.orderPaymentStatus}
                            </strong>
                          </div>
                        )}

                        {productDetails.licenseTier && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#a1a1aa" }}>Gói License:</span> 
                            <strong style={{ color: "#c084fc" }}>{productDetails.licenseTier}</strong>
                          </div>
                        )}

                        <hr style={{ borderColor: "rgba(82, 82, 91, 0.3)", margin: "8px 0" }}/>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#a1a1aa" }}>Phần mềm:</span> 
                          <strong style={{ color: "white", textAlign: "right", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {productDetails.productName}
                          </strong>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#a1a1aa" }}>Phiên bản (Version) mới nhất:</span> 
                          <strong style={{ color: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                            v{productDetails.versionNumber}
                          </strong>
                        </div>

                        {productDetails.releaseNotes && productDetails.releaseNotes !== "Chưa có phiên bản nào được phát hành" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                              <span style={{ color: "#a1a1aa" }}>Ghi chú cập nhật:</span> 
                              <span style={{ color: "#d4d4d8", fontStyle: "italic", padding: "8px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", maxHeight: "100px", overflowY: "auto", border: "1px solid rgba(82,82,91,0.2)" }}>
                                {productDetails.releaseNotes}
                              </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <span style={{ color: "#ef4444", fontSize: "13px", padding: "10px", display: "block", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>Lỗi: Không tìm thấy dữ liệu hóa đơn của đơn hàng này.</span>
                )}
              </div>
            )}
            
            <button 
              onClick={() => setShowInfoModal(false)} 
              style={{ ...s.btn, background: "#3b82f6", color: "white", width: "100%", marginTop: "24px", justifyContent: "center", padding: "10px", fontSize: "14px" }}
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-placeholder::placeholder { color: rgba(255, 255, 255, 0.4) !important; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(24, 24, 27, 0.5); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #52525b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}} />
    </div>
  );
}