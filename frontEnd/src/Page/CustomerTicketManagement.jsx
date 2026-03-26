import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function CustomerTicketManagement() {
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
  const [pendingUpdates, setPendingUpdates] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchTickets = async () => {
    setIsLoading(true);
    setPendingUpdates({});
    try {
      const res = await axios.get("http://localhost:8081/api/tickets/customer", { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) { console.error("Lỗi fetchTickets:", err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await axios.get(`http://localhost:8081/api/tickets/${ticket.ticketId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data);
    } catch (err) { console.error("Lỗi handleSelectTicket:", err); }
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
      senderName: "Bạn",
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

      const res = await axios.post(`http://localhost:8081/api/tickets/${selectedTicket.ticketId}/reply`, formData, { headers: { Authorization: `Bearer ${token}` } });

      setMessages(prev => prev.map(msg =>
        msg.messageId === tempId
          ? { ...msg, messageId: Date.now(), attachmentUrl: res.data.fileUrl || localFileUrl, isSending: false }
          : msg
      ));
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.messageId !== tempId));
      console.error("Lỗi gửi tin nhắn.");
    }
  };
  const handleToggleKanban = () => {
    if (isKanbanMode) {
      // Nếu đang mở Kanban và chuẩn bị đóng
      // Kiểm tra xem có thay đổi nào đang lưu tạm (chưa bấm Xác nhận) không
      if (Object.keys(pendingUpdates).length > 0) {
        // Nếu có, gọi fetchTickets để tải lại dữ liệu gốc từ server (hủy bỏ các thay đổi tạm)
        fetchTickets();
      }
      setIsKanbanMode(false); // Đóng Kanban
    } else {
      // Nếu đang đóng và chuẩn bị mở
      setIsKanbanMode(true);
    }
  };
  const handleCloseTicket = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xác nhận vấn đề đã được giải quyết và ĐÓNG Ticket này không?")) {
      return;
    }
    try {
      await axios.put(`http://localhost:8081/api/tickets/${selectedTicket.ticketId}/status`, { status: "Closed" }, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedTicket({ ...selectedTicket, status: "Closed" });
      setTickets(tickets.map(t => t.ticketId === selectedTicket.ticketId ? { ...t, status: "Closed" } : t));
    } catch (err) { console.error("Lỗi đóng ticket:", err); }
  };

  const handleDragStart = (e, ticketId) => { e.dataTransfer.setData("ticketId", ticketId); };
  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("ticketId");
    if (!ticketId) return;

    const ticket = tickets.find(t => String(t.ticketId) === ticketId);
    if (!ticket) return;

    // 1. Nếu kéo thả về lại chính cột cũ -> Bỏ qua im lặng
    if (ticket.status === newStatus) {
      return;
    }

    // 2. KHÁCH HÀNG: Chỉ cho kéo sang Closed
    if (newStatus !== "Closed") {
      alert("Lỗi vi phạm: Bạn chỉ có quyền chuyển Ticket sang trạng thái Đã đóng (Closed)!");
      return;
    }

    // 3. Hợp lệ -> Lưu tạm vào state Kanban
    setTickets(prev => prev.map(t => String(t.ticketId) === ticketId ? { ...t, status: "Closed" } : t));
    setPendingUpdates(prev => ({ ...prev, [ticketId]: "Closed" }));
    if (selectedTicket?.ticketId === Number(ticketId)) {
      setSelectedTicket(prev => ({ ...prev, status: "Closed" }));
    }
  };

  // Nút bấm lưu thay đổi Kanban (CÓ HỎI LẠI NGƯỜI DÙNG)
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
        axios.put(`http://localhost:8081/api/tickets/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      ));
      alert("Tuyệt vời! Đã lưu các thay đổi trạng thái thành công.");
      setPendingUpdates({});
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi lưu thay đổi lên máy chủ!");
    }
  };

  const filteredTickets = tickets
    .filter(t => {
      const matchStatus = isKanbanMode ? true : (filterStatus === "All" || t.status === filterStatus);
      const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticketId.toString().includes(searchTerm);
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
    btn: { padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600", border: "none", transition: "0.2s", display: "flex", alignItems: "center", gap: "6px" },
    badge: (status) => ({ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", backgroundColor: status === "Closed" ? "rgba(113, 113, 122, 0.2)" : status === "Resolved" ? "rgba(16, 185, 129, 0.2)" : "rgba(249, 115, 22, 0.15)", color: status === "Closed" ? "#a1a1aa" : status === "Resolved" ? "#10b981" : "#f97316" }),
    colHeader: (color) => ({ padding: "12px", fontWeight: "700", fontSize: "14px", borderBottom: `2px solid ${color}`, backgroundColor: "rgba(39, 39, 42, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center" }),
    kanbanCard: { backgroundColor: "rgba(39, 39, 42, 0.95)", padding: "14px", borderRadius: "10px", cursor: "pointer", border: "1px solid rgba(82, 82, 91, 0.4)", transition: "0.2s" },
    badgeCount: { backgroundColor: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }
  };

  const renderTicketCard = (t, isKanban) => (
    <div key={t.ticketId}
      draggable={isKanban && t.status !== "Closed"}
      onDragStart={(e) => isKanban && t.status !== "Closed" && handleDragStart(e, t.ticketId)}
      onClick={() => handleSelectTicket(t)}
      style={{
        ...s.kanbanCard, margin: isKanban ? "10px 10px 0 10px" : "0 0 8px 0",
        backgroundColor: selectedTicket?.ticketId === t.ticketId ? "rgba(249, 115, 22, 0.15)" : "rgba(39, 39, 42, 0.6)",
        borderColor: selectedTicket?.ticketId === t.ticketId ? "#f97316" : "rgba(82, 82, 91, 0.4)",
        opacity: t.status === "Closed" && isKanban ? 0.7 : 1,
        cursor: t.status === "Closed" && isKanban ? "pointer" : (isKanban ? "grab" : "pointer")
      }}
      onMouseOver={(e) => { if (selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(63, 63, 70, 0.6)" }}
      onMouseOut={(e) => { if (selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(39, 39, 42, 0.6)" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#a1a1aa", fontWeight: "700" }}>#TCK-{t.ticketId}</span>
        {!isKanban && <span style={s.badge(t.status)}>{t.status === "Resolved" ? "Có phản hồi" : t.status === "Open" ? "Đang xử lý" : t.status}</span>}
        {isKanban && <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</span>}
      </div>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#f4f4f5", lineHeight: "1.4" }}>{t.subject}</h4>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: "#d4d4d8" }}>Shop: {t.vendorName || "Người bán"}</span>
        {!isKanban && <span style={{ fontSize: "11px", color: "#a1a1aa" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</span>}
      </div>
    </div>
  );

  return (
    <div style={s.bg}>
      <div style={{ ...s.panel, width: isKanbanMode ? "100%" : "35%", minWidth: "320px", height: "calc(100vh - 48px)", transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>

        <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#f9fafb" }}>Lịch sử Hỗ trợ</h2>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={fetchTickets} style={{ ...s.btn, background: "rgba(39, 39, 42, 0.8)", color: "white", border: "1px solid rgba(82, 82, 91, 0.5)" }}><i className="bi bi-arrow-clockwise me-1"></i> Làm mới</button>

              {isKanbanMode && (
                <button onClick={handleConfirmChanges} style={{ ...s.btn, background: "#10b981", color: "white" }}><i className="bi bi-check2-circle me-1"></i> Xác nhận</button>
              )}

              {/* Sử dụng hàm handleToggleKanban mới tạo ở đây */}
              <button
                onClick={handleToggleKanban}
                style={{ ...s.btn, background: isKanbanMode ? "#f97316" : "rgba(39, 39, 42, 0.8)", color: isKanbanMode ? "white" : "#a1a1aa", border: `1px solid ${isKanbanMode ? "#f97316" : "rgba(82, 82, 91, 0.5)"}` }}
              >
                {isKanbanMode ? <><i className="bi bi-x-lg me-1"></i>Đóng</> : <><i className="bi bi-kanban me-1"></i>Xử lý ticket</>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexDirection: isKanbanMode ? "row" : "column" }}>
            <input type="text" placeholder="Tìm theo Tiêu đề hoặc #ID..." style={{ ...s.input, flex: 1 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(39, 39, 42, 0.8)", padding: "4px 8px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.5)" }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: "transparent", border: "none", color: startDate ? "white" : "#a1a1aa", outline: "none", fontSize: "12px" }} />
              <span style={{ color: "#71717a" }}>→</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: "transparent", border: "none", color: endDate ? "white" : "#a1a1aa", outline: "none", fontSize: "12px" }} />
            </div>
          </div>

          {!isKanbanMode && (
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {["All", "Open", "Resolved", "Closed"].map(st => (
                <button key={st} onClick={() => setFilterStatus(st)}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none", fontWeight: "600",
                    backgroundColor: filterStatus === st ? "#f97316" : "rgba(39, 39, 42, 0.8)", color: filterStatus === st ? "white" : "#a1a1aa"
                  }}>
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? <div style={{ textAlign: "center", color: "#a1a1aa", marginTop: "40px" }}>Đang tải...</div> :

          isKanbanMode ? (
            <div style={{ display: "flex", flex: 1, overflowX: "auto", overflowY: "hidden", backgroundColor: "rgba(24, 24, 27, 0.3)" }}>
              <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(63, 63, 70, 0.4)" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Open")}>
                <div style={s.colHeader("#f97316")}><span style={{ color: "#f97316" }}><i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i> Đang xử lý</span><span style={s.badgeCount}>{openTickets.length}</span></div>
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: "12px" }}>{openTickets.map(t => renderTicketCard(t, true))}</div>
              </div>
              <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", borderRight: "1px solid rgba(63, 63, 70, 0.4)" }} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, "Resolved")}>
                <div style={s.colHeader("#10b981")}><span style={{ color: "#10b981" }}><i className="bi bi-check-circle-fill me-1" style={{ fontSize: '10px' }}></i> Đã trả lời</span><span style={s.badgeCount}>{resolvedTickets.length}</span></div>
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
            <h3>Chọn một Ticket để xem phản hồi</h3>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)", display: "flex", justifyContent: "space-between", backgroundColor: "transparent", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0", color: "#f4f4f5" }}>{selectedTicket.subject}</h2>
                <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Shop: <strong style={{ color: "#f97316" }}>{selectedTicket.vendorName}</strong></span>
              </div>

              {selectedTicket.status !== "Closed" && (
                <button onClick={handleCloseTicket}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#f97316", color: "white", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 14px 0 rgba(249, 115, 22, 0.39)" }}>
                  Xác nhận đã giải quyết
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "rgba(24, 24, 27, 0.4)" }}>
              {sortedMessages.map((msg) => {
                const isMine = String(msg.senderId) === String(currentUserId);
                return (
                  <div key={msg.messageId} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", opacity: msg.isSending ? 0.6 : 1 }}>
                    <span style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "4px" }}>
                      {isMine ? "Bạn" : msg.senderName} • {msg.isSending ? "Đang gửi..." : new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {msg.messageContent && (
                      <div style={{
                        maxWidth: "75%", padding: "12px 16px", borderRadius: "12px", wordBreak: "break-word",
                        backgroundColor: isMine ? "#f97316" : "rgba(39, 39, 42, 0.8)",
                        color: "white",
                        borderBottomRightRadius: isMine && !msg.attachmentUrl ? "4px" : "12px",
                        borderBottomLeftRadius: !isMine && !msg.attachmentUrl ? "4px" : "12px",
                        border: isMine ? "none" : "1px solid rgba(82, 82, 91, 0.5)",
                        marginBottom: msg.attachmentUrl ? "6px" : "0"
                      }}>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>{msg.messageContent}</div>
                      </div>
                    )}

                    {msg.attachmentUrl && (
                      <div style={{
                        maxWidth: "75%", borderRadius: "12px", overflow: "hidden",
                        borderBottomRightRadius: isMine ? "4px" : "12px",
                        borderBottomLeftRadius: !isMine ? "4px" : "12px",
                      }}>
                        {msg.attachmentUrl.startsWith('blob:') || msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null || msg.attachmentUrl.includes('res.cloudinary.com/image') ? (
                          <img src={msg.attachmentUrl} alt="attachment" style={{ maxWidth: "100%", maxHeight: "300px", display: "block", objectFit: "cover" }} />
                        ) : (
                          <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", padding: "12px 16px", color: "white", textDecoration: "none", fontSize: "13px", backgroundColor: isMine ? "#f97316" : "rgba(39, 39, 42, 0.8)" }}>
                            <i className="bi bi-paperclip me-1"></i> {msg.isSending ? "Đang tải file lên..." : "Xem file đính kèm"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "20px", borderTop: "1px solid rgba(63, 63, 70, 0.4)", backgroundColor: "transparent" }}>
              {selectedTicket.status === "Closed" ? (
                <div style={{ textAlign: "center", color: "#10b981", padding: "10px" }}>Ticket này đã đóng. Cảm ơn bạn!</div>
              ) : (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                    {replyFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "rgba(39, 39, 42, 0.8)", borderRadius: "6px", width: "max-content", fontSize: "13px", border: "1px solid rgba(82, 82, 91, 0.5)" }}>
                        <span style={{ color: "#f97316" }}><i className="bi bi-paperclip me-1"></i>{replyFile.name}</span>
                        <button onClick={() => { setReplyFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0" }}><i className="bi bi-x-lg"></i></button>
                      </div>
                    )}
                    <textarea rows="2" placeholder="Nhắn tin cho shop..." style={{ ...s.input, resize: "none" }} value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setReplyFile(e.target.files[0])} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.5)", backgroundColor: "rgba(39, 39, 42, 0.8)", color: "#a1a1aa", cursor: "pointer", transition: "0.2s" }}><i className="bi bi-paperclip" style={{ fontSize: '1.1rem' }}></i></button>
                  <button onClick={handleSendReply} disabled={!replyText.trim() && !replyFile} style={{ padding: "12px 24px", borderRadius: "8px", backgroundColor: (!replyText.trim() && !replyFile) ? "rgba(39, 39, 42, 0.8)" : "#f97316", color: (!replyText.trim() && !replyFile) ? "#71717a" : "white", border: "none", cursor: (!replyText.trim() && !replyFile) ? "not-allowed" : "pointer", fontWeight: "600", transition: "0.2s", boxShadow: (!replyText.trim() && !replyFile) ? "none" : "0 4px 14px rgba(249,115,22,0.3)" }}>Gửi <i className="bi bi-send-fill ms-1"></i></button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}