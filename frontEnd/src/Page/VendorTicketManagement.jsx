import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function VendorTicketManagement() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.roleName;
  const token = localStorage.getItem('accessToken');
  
  // 🔥 TUYỆT CHIÊU BẮT ID TỪ TOKEN (VD: TOKEN_8_1234 -> lấy số 8)
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

  const handleSendReply = async () => {
    if (!replyText.trim() && !replyFile) return;
    try {
      const formData = new FormData();
      formData.append("content", replyText);
      if (replyFile) formData.append("file", replyFile);

      const res = await axios.post(`http://localhost:8081/api/tickets/${selectedTicket.ticketId}/reply`, formData, { headers: { Authorization: `Bearer ${token}` } });
      const newMsg = { messageId: Date.now(), senderId: currentUserId, senderName: "Bạn (Vendor)", messageContent: replyText, attachmentUrl: res.data.fileUrl || (replyFile ? URL.createObjectURL(replyFile) : null), createdAt: new Date().toISOString() };
      setMessages([...messages, newMsg]); setReplyText(""); setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { alert("Gửi thất bại!"); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`http://localhost:8081/api/tickets/${selectedTicket.ticketId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` }});
      setSelectedTicket({...selectedTicket, status: newStatus});
      setTickets(tickets.map(t => t.ticketId === selectedTicket.ticketId ? {...t, status: newStatus} : t));
    } catch (err) { alert(err.response?.data?.error || "Lỗi cập nhật"); }
  };

  if (role !== "VENDOR" && role !== "ADMIN") return <div style={{ minHeight: "100vh", background: "#0b0b0f", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}><h2>🚫 Không có quyền truy cập</h2></div>;

  const filteredTickets = tickets
    .filter(t => {
      const matchStatus = filterStatus === "All" || t.status === filterStatus;
      const matchSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || t.ticketId.toString().includes(searchTerm);
      const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
      const matchStart = startDate ? ticketDate >= startDate : true;
      const matchEnd = endDate ? ticketDate <= endDate : true;
      return matchStatus && matchSearch && matchStart && matchEnd;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f8fafc", fontFamily: 'Inter, system-ui, sans-serif', display: "flex", padding: "24px", gap: "24px" },
    panel: { backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" },
    input: { background: "#1f2937", border: "1px solid #374151", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%", outline: "none" },
    badge: (status) => ({
      padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
      backgroundColor: status === "Closed" ? "rgba(100, 116, 139, 0.2)" : status === "Resolved" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
      color: status === "Closed" ? "#94a3b8" : status === "Resolved" ? "#f59e0b" : "#10b981",
      border: `1px solid ${status === "Closed" ? "rgba(100, 116, 139, 0.3)" : status === "Resolved" ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
    })
  };

  return (
    <div style={s.bg}>
      <div style={{ ...s.panel, width: "35%", minWidth: "320px", height: "calc(100vh - 48px)" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #1f2937" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 16px 0" }}>Quản lý Ticket (Vendor)</h2>
          <input type="text" placeholder="Tìm theo Tiêu đề..." style={s.input} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{...s.input, padding: "8px", fontSize: "12px", color: startDate ? "white" : "#6b7280"}} />
            <span style={{color: "#4b5563"}}>-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{...s.input, padding: "8px", fontSize: "12px", color: endDate ? "white" : "#6b7280"}} />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            {["All", "Open", "Resolved", "Closed"].map(st => (
              <button key={st} onClick={() => setFilterStatus(st)}
                style={{ flex: 1, padding: "6px 0", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none", fontWeight: "600",
                  backgroundColor: filterStatus === st ? "#3b82f6" : "#1f2937", color: filterStatus === st ? "white" : "#9ca3af" }}>
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {filteredTickets.length === 0 ? <div style={{ textAlign: "center", color: "#6b7280", marginTop: "40px", fontSize: "14px" }}>Không có dữ liệu.</div> : 
          filteredTickets.map(t => (
            <div key={t.ticketId} onClick={() => handleSelectTicket(t)}
              style={{ padding: "16px", borderRadius: "10px", marginBottom: "8px", cursor: "pointer", transition: "0.2s",
                backgroundColor: selectedTicket?.ticketId === t.ticketId ? "rgba(59, 130, 246, 0.15)" : "transparent",
                border: `1px solid ${selectedTicket?.ticketId === t.ticketId ? "#3b82f6" : "transparent"}` }}
              onMouseOver={(e) => { if(selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "#1f2937" }}
              onMouseOut={(e) => { if(selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>#TCK-{t.ticketId}</span>
                <span style={s.badge(t.status)}>{t.status}</span>
              </div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#f3f4f6" }}>{t.subject}</h4>
              <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "right" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...s.panel, flex: 1, height: "calc(100vh - 48px)" }}>
        {!selectedTicket ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#4b5563" }}><h3>Chọn một Ticket để bắt đầu hỗ trợ</h3></div>
        ) : (
          <>
            <div style={{ padding: "20px", borderBottom: "1px solid #1f2937", display: "flex", justifyContent: "space-between", backgroundColor: "#111827" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0", color: "#f9fafb" }}>{selectedTicket.subject}</h2>
                <span style={{ fontSize: "13px", color: "#9ca3af" }}>Khách: <strong style={{color: "white"}}>{selectedTicket.customerName}</strong></span>
              </div>
              
              <select value={selectedTicket.status} disabled={selectedTicket.status === "Closed"} onChange={(e) => handleStatusChange(e.target.value)}
                style={{ ...s.input, width: "auto", cursor: selectedTicket.status === "Closed" ? "not-allowed" : "pointer" }}>
                {selectedTicket.status === "Closed" && <option value="Closed">🔒 Khách đã Đóng</option>}
                <option value="Open">🟢 Đang xử lý (Open)</option>
                <option value="Resolved">🟡 Đã trả lời (Resolved)</option>
              </select>
            </div>

           <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {sortedMessages.map((msg) => {
                // KIỂM TRA CHUẨN XÁC 100%
                const isMine = String(msg.senderId) === String(currentUserId); 
                return (
                  <div key={msg.messageId} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                      {isMine ? "Bạn" : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    
                    {/* BUBBLE CHỨA TEXT (Nếu có text thì mới render) */}
                    {msg.messageContent && (
                      <div style={{ 
                        maxWidth: "75%", padding: "12px 16px", borderRadius: "12px", 
                        backgroundColor: isMine ? "#3b82f6" : "#1f2937", // Default màu xanh dịu mắt cho Vendor
                        color: "white", 
                        borderBottomRightRadius: isMine && !msg.attachmentUrl ? "4px" : "12px",
                        borderBottomLeftRadius: !isMine && !msg.attachmentUrl ? "4px" : "12px",
                        border: isMine ? "none" : "1px solid #374151",
                        marginBottom: msg.attachmentUrl ? "6px" : "0" // Tạo khe hở nhỏ nếu bên dưới có ảnh
                      }}>
                        <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>{msg.messageContent}</div>
                      </div>
                    )}

                    {/* BUBBLE CHỨA ẢNH/FILE (Hiển thị Full, không có viền bao quanh) */}
                    {msg.attachmentUrl && (
                      <div style={{ 
                        maxWidth: "75%", 
                        borderRadius: "12px", 
                        overflow: "hidden",
                        borderBottomRightRadius: isMine ? "4px" : "12px",
                        borderBottomLeftRadius: !isMine ? "4px" : "12px",
                      }}>
                        {msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null ? (
                          <img 
                            src={`http://localhost:8081${msg.attachmentUrl}`} 
                            alt="attachment" 
                            style={{ maxWidth: "100%", maxHeight: "300px", display: "block", objectFit: "cover" }} 
                          />
                        ) : (
                          <a href={`http://localhost:8081${msg.attachmentUrl}`} target="_blank" rel="noreferrer" 
                             style={{ display: "flex", alignItems: "center", padding: "12px 16px", color: "white", textDecoration: "none", fontSize: "13px", backgroundColor: isMine ? "#3b82f6" : "#1f2937" }}>
                            📎 Xem file đính kèm
                          </a>
                        )}
                      </div>
                    )}

                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid #1f2937" }}>
              {selectedTicket.status === "Closed" ? (
                 <div style={{ textAlign: "center", color: "#10b981", padding: "10px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px" }}>Khách hàng đã xác nhận giải quyết và Đóng ticket này.</div>
              ) : (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                    {replyFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#1f2937", borderRadius: "6px", width: "max-content", fontSize: "13px" }}>
                        <span style={{color: "#3b82f6"}}>📎 {replyFile.name}</span>
                        <button onClick={() => {setReplyFile(null); if(fileInputRef.current) fileInputRef.current.value = ""}} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0" }}>✖</button>
                      </div>
                    )}
                    <textarea rows="2" placeholder="Nhập phản hồi..." style={{ ...s.input, resize: "none" }} value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setReplyFile(e.target.files[0])} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: "12px", borderRadius: "8px", border: "1px solid #374151", backgroundColor: "#1f2937", color: "#9ca3af", cursor: "pointer" }}>📎</button>
                  <button onClick={handleSendReply} disabled={!replyText.trim() && !replyFile} style={{ padding: "12px 24px", borderRadius: "8px", backgroundColor: (!replyText.trim() && !replyFile) ? "#1f2937" : "#3b82f6", color: (!replyText.trim() && !replyFile) ? "#4b5563" : "white", border: "none", cursor: (!replyText.trim() && !replyFile) ? "not-allowed" : "pointer", fontWeight: "600" }}>Gửi 📤</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}