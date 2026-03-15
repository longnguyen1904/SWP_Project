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
  
  const [filterStatus, setFilterStatus] = useState("Open");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isKanbanMode, setIsKanbanMode] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchTickets = async () => {
    if (role !== "VENDOR" && role !== "ADMIN") return;
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:8081/api/tickets/vendor", { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) { console.error("Lỗi:", err); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await axios.get(`http://localhost:8081/api/tickets/${ticket.ticketId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
    } catch (err) { console.error("Lỗi:", err); }
  };

  // ===============================================
  // HÀM GỬI TIN NHẮN TỐI ƯU (OPTIMISTIC UI)
  // ===============================================
  const handleSendReply = async () => {
    if (!replyText.trim() && !replyFile) return;

    // 1. Lưu lại nội dung
    const textToSend = replyText;
    const fileToSend = replyFile;
    const tempId = `temp-${Date.now()}`;
    const localFileUrl = fileToSend ? URL.createObjectURL(fileToSend) : null;

    // 2. Cập nhật UI ngay lập tức
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
    
    // 3. Reset form để Vendor gõ tiếp
    setReplyText(""); 
    setReplyFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // 4. Gọi API ngầm lên Cloudinary
    try {
      const formData = new FormData();
      formData.append("content", textToSend);
      if (fileToSend) formData.append("file", fileToSend);

      const res = await axios.post(`http://localhost:8081/api/tickets/${selectedTicket.ticketId}/reply`, formData, { headers: { Authorization: `Bearer ${token}` } });
      
      // 5. Cập nhật tin nhắn gốc
      setMessages(prev => prev.map(msg => 
        msg.messageId === tempId 
          ? { ...msg, messageId: Date.now(), attachmentUrl: res.data.fileUrl || localFileUrl, isSending: false } 
          : msg
      ));
    } catch (err) { 
      setMessages(prev => prev.filter(msg => msg.messageId !== tempId));
      alert("Gửi thất bại! Lỗi kết nối máy chủ."); 
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      await axios.put(`http://localhost:8081/api/tickets/${ticketId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` }});
      setTickets(prev => prev.map(t => t.ticketId === ticketId ? {...t, status: newStatus} : t));
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(prev => ({...prev, status: newStatus}));
      }
    } catch (err) { alert(err.response?.data?.error || "Lỗi cập nhật trạng thái"); }
  };

  const handleDragStart = (e, ticketId) => { e.dataTransfer.setData("ticketId", ticketId); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    if (!ticketId) return;
    const ticket = tickets.find(t => String(t.ticketId) === ticketId);
    if (ticket && ticket.status !== newStatus) updateTicketStatus(ticket.ticketId, newStatus);
  };

  if (role !== "VENDOR" && role !== "ADMIN") return <div style={{ minHeight: "100vh", background: "transparent", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}><h2>🚫 Không có quyền truy cập</h2></div>;

  const filteredTickets = tickets
    .filter(t => {
      const matchStatus = isKanbanMode ? true : (filterStatus === "All" || t.status === filterStatus);
      const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticketId.toString().includes(searchTerm) || t.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
      const matchStart = startDate ? ticketDate >= startDate : true;
      const matchEnd = endDate ? ticketDate <= endDate : true;
      return matchStatus && matchSearch && matchStart && matchEnd;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const openTickets = filteredTickets.filter(t => t.status === "Open");
  const resolvedTickets = filteredTickets.filter(t => t.status === "Resolved");
  const closedTickets = filteredTickets.filter(t => t.status === "Closed");

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f8fafc", fontFamily: 'Inter, system-ui, sans-serif', display: "flex", padding: "24px", gap: "24px" },
    panel: { backgroundColor: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(63, 63, 70, 0.4)", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" },
    input: { background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%", outline: "none" },
    badge: (status) => ({
      padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
      backgroundColor: status === "Closed" ? "rgba(113, 113, 122, 0.2)" : status === "Resolved" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
      color: status === "Closed" ? "#a1a1aa" : status === "Resolved" ? "#f59e0b" : "#3b82f6",
      border: `1px solid ${status === "Closed" ? "rgba(113, 113, 122, 0.3)" : status === "Resolved" ? "rgba(245, 158, 11, 0.3)" : "rgba(59, 130, 246, 0.3)"}`
    }),
    colHeader: (color) => ({ padding: "12px", fontWeight: "700", fontSize: "14px", borderBottom: `2px solid ${color}`, backgroundColor: "rgba(39, 39, 42, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }),
    kanbanCard: { backgroundColor: "rgba(39, 39, 42, 0.95)", padding: "14px", borderRadius: "10px", margin: "10px 10px 0 10px", cursor: "pointer", border: "1px solid rgba(82, 82, 91, 0.4)", transition: "0.2s" },
    badgeCount: { backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }
  };

  const renderTicketCard = (t, isKanban) => (
    <div key={t.ticketId} 
      draggable={isKanban}
      onDragStart={(e) => isKanban && handleDragStart(e, t.ticketId)}
      onClick={() => handleSelectTicket(t)}
      style={{ 
        ...s.kanbanCard, 
        margin: isKanban ? "10px 10px 0 10px" : "0 0 8px 0",
        backgroundColor: selectedTicket?.ticketId === t.ticketId ? (isKanban ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.15)") : "rgba(39, 39, 42, 0.6)",
        borderColor: selectedTicket?.ticketId === t.ticketId ? "#3b82f6" : "rgba(82, 82, 91, 0.4)"
      }}
      onMouseOver={(e) => { if(selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(63, 63, 70, 0.6)" }}
      onMouseOut={(e) => { if(selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(39, 39, 42, 0.6)" }}
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
        {!isKanban && <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</span>}
      </div>
    </div>
  );

  return (
    <div style={s.bg}>
      
      {/* ---------------- PANEl BÊN TRÁI: DANH SÁCH / KANBAN ---------------- */}
      <div style={{ ...s.panel, width: isKanbanMode ? "65%" : "35%", minWidth: "350px", height: "calc(100vh - 48px)", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        
        {/* Header Panel Trái */}
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#f9fafb" }}>Quản lý Ticket</h2>
            
            <button 
              onClick={() => setIsKanbanMode(!isKanbanMode)}
              style={{ background: isKanbanMode ? "#3b82f6" : "rgba(39, 39, 42, 0.8)", color: isKanbanMode ? "white" : "#a1a1aa", border: `1px solid ${isKanbanMode ? "#3b82f6" : "rgba(82, 82, 91, 0.5)"}`, padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
            >
              {isKanbanMode ? "🗂️ Đóng Kanban" : "🗂️ Mở Kanban"}
            </button>
          </div>

          {/* Bộ lọc luôn hiển thị */}
          <div style={{ display: "flex", gap: "10px", flexDirection: isKanbanMode ? "row" : "column" }}>
            <input type="text" placeholder="Tìm tên khách, Tiêu đề, #ID..." style={{...s.input, flex: 1}} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(39, 39, 42, 0.8)", padding: "4px 8px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.5)" }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: "transparent", border: "none", color: startDate ? "white" : "#a1a1aa", outline: "none", fontSize: "12px" }} />
              <span style={{color: "#71717a"}}>→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: "transparent", border: "none", color: endDate ? "white" : "#a1a1aa", outline: "none", fontSize: "12px" }} />
            </div>
          </div>

          {/* Nút lọc Status chỉ hiện khi ở chế độ List */}
          {!isKanbanMode && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {["All", "Open", "Resolved", "Closed"].map(st => (
                <button key={st} onClick={() => setFilterStatus(st)}
                  style={{ flex: 1, padding: "6px 0", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none", fontWeight: "600",
                    backgroundColor: filterStatus === st ? "#3b82f6" : "rgba(39, 39, 42, 0.8)", color: filterStatus === st ? "white" : "#a1a1aa" }}>
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nội dung Panel Trái */}
        {isLoading ? <div style={{ textAlign: "center", color: "#3b82f6", marginTop: "40px" }}>Đang tải...</div> : 
        
        isKanbanMode ? (
          <div style={{ display: "flex", flex: 1, overflowX: "auto", overflowY: "hidden", backgroundColor: "rgba(24, 24, 27, 0.3)" }}>
            <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(63, 63, 70, 0.4)" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Open")}>
              <div style={s.colHeader("#3b82f6")}><span style={{color: "#3b82f6"}}>🟢 Open</span><span style={s.badgeCount}>{openTickets.length}</span></div>
              <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>{openTickets.map(t => renderTicketCard(t, true))}</div>
            </div>
            <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(63, 63, 70, 0.4)" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Resolved")}>
              <div style={s.colHeader("#f59e0b")}><span style={{color: "#f59e0b"}}>🟡 Resolved</span><span style={s.badgeCount}>{resolvedTickets.length}</span></div>
              <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>{resolvedTickets.map(t => renderTicketCard(t, true))}</div>
            </div>
            <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Closed")}>
              <div style={s.colHeader("#71717a")}><span style={{color: "#a1a1aa"}}>🔒 Closed</span><span style={s.badgeCount}>{closedTickets.length}</span></div>
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

      {/* ---------------- PANEl BÊN PHẢI: KHUNG CHAT ---------------- */}
      <div style={{ ...s.panel, width: isKanbanMode ? "35%" : "65%", height: "calc(100vh - 48px)", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        {!selectedTicket ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#71717a", backgroundColor: "rgba(24, 24, 27, 0.3)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.2 }}>💬</div>
            <h3>Chọn một Ticket để bắt đầu hỗ trợ</h3>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)", display: "flex", justifyContent: "space-between", backgroundColor: "transparent", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0", color: "#f4f4f5" }}>{selectedTicket.subject}</h2>
                <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Khách: <strong style={{color: "white"}}>{selectedTicket.customerName}</strong></span>
              </div>
              
              <select value={selectedTicket.status} disabled={selectedTicket.status === "Closed"} onChange={(e) => updateTicketStatus(selectedTicket.ticketId, e.target.value)}
                style={{ ...s.input, width: "auto", cursor: selectedTicket.status === "Closed" ? "not-allowed" : "pointer", padding: "6px 12px" }}>
                {selectedTicket.status === "Closed" && <option value="Closed">🔒 Khách đã Đóng</option>}
                <option value="Open">🟢 Đang xử lý</option>
                <option value="Resolved">🟡 Đã trả lời</option>
              </select>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "rgba(24, 24, 27, 0.4)" }}>
              {sortedMessages.map((msg) => {
                const isMine = String(msg.senderId) === String(currentUserId); 
                return (
                  <div key={msg.messageId} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", opacity: msg.isSending ? 0.6 : 1 }}>
                    <span style={{ fontSize: "12px", color: "#71717a", marginBottom: "4px" }}>
                      {isMine ? "Bạn" : msg.senderName} • {msg.isSending ? "Đang gửi..." : new Date(msg.createdAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    
                    {msg.messageContent && (
                      <div style={{ 
                        maxWidth: isKanbanMode ? "90%" : "75%", padding: "12px 16px", borderRadius: "14px", 
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
                            📎 {msg.isSending ? "Đang tải file lên..." : "Tải file đính kèm"}
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
                 <div style={{ textAlign: "center", color: "#10b981", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", fontWeight: "500" }}>🔒 Ticket này đã được đóng lại. Không thể nhắn thêm.</div>
              ) : (
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                    {replyFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", backgroundColor: "rgba(63, 63, 70, 0.6)", borderRadius: "6px", width: "max-content", fontSize: "12px" }}>
                        <span style={{color: "#3b82f6"}}>📎 {replyFile.name}</span>
                        <button onClick={() => {setReplyFile(null); if(fileInputRef.current) fileInputRef.current.value = ""}} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0" }}>✖</button>
                      </div>
                    )}
                    <textarea rows={isKanbanMode ? "3" : "2"} placeholder="Nhập hướng dẫn xử lý lỗi..." style={{ ...s.input, resize: "none", backgroundColor: "rgba(24, 24, 27, 0.8)", border: "1px solid rgba(82, 82, 91, 0.8)", fontSize: "13px" }} value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setReplyFile(e.target.files[0])} />
                  <div style={{ display: "flex", flexDirection: isKanbanMode ? "column" : "row", gap: "10px" }}>
                    <button onClick={() => fileInputRef.current?.click()} style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.8)", backgroundColor: "rgba(24, 24, 27, 0.8)", color: "#a1a1aa", cursor: "pointer", transition: "0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor="rgba(63, 63, 70, 0.8)"} onMouseOut={e => e.currentTarget.style.backgroundColor="rgba(24, 24, 27, 0.8)"}>📎</button>
                    <button onClick={handleSendReply} disabled={!replyText.trim() && !replyFile} style={{ padding: "10px 20px", borderRadius: "8px", backgroundColor: (!replyText.trim() && !replyFile) ? "rgba(63, 63, 70, 0.6)" : "#3b82f6", color: (!replyText.trim() && !replyFile) ? "#a1a1aa" : "white", border: "none", cursor: (!replyText.trim() && !replyFile) ? "not-allowed" : "pointer", fontWeight: "600", transition: "0.2s" }}>Gửi 📤</button>
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>

    </div>
  );
}