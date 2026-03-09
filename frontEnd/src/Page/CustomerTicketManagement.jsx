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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:8081/api/tickets/customer", { headers: { Authorization: `Bearer ${token}` } });
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
      const newMsg = { messageId: Date.now(), senderId: currentUserId, senderName: "Bạn", messageContent: replyText, attachmentUrl: res.data.fileUrl || (replyFile ? URL.createObjectURL(replyFile) : null), createdAt: new Date().toISOString() };
      setMessages([...messages, newMsg]); setReplyText(""); setReplyFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { alert("Lỗi gửi tin!"); }
  };

  const handleCloseTicket = async () => {
    if(!window.confirm("Bạn xác nhận vấn đề đã được giải quyết?")) return;
    try {
      await axios.put(`http://localhost:8081/api/tickets/${selectedTicket.ticketId}/status`, { status: "Closed" }, { headers: { Authorization: `Bearer ${token}` }});
      setSelectedTicket({...selectedTicket, status: "Closed"});
      setTickets(tickets.map(t => t.ticketId === selectedTicket.ticketId ? {...t, status: "Closed"} : t));
    } catch (err) { alert("Lỗi đóng ticket!"); }
  };

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

  // CSS BẢN CHUẨN XÁC: XÁM TRUNG TÍNH (NEUTRAL GRAY) KHÔNG ÁM XANH
  const s = {
    bg: { minHeight: "100vh", backgroundColor: "transparent", color: "#f8fafc", fontFamily: 'Inter, system-ui, sans-serif', display: "flex", padding: "24px", gap: "24px" },
    panel: { backgroundColor: "rgba(24, 24, 27, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(63, 63, 70, 0.4)", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" },
    input: { background: "rgba(39, 39, 42, 0.8)", border: "1px solid rgba(82, 82, 91, 0.5)", color: "white", padding: "10px 14px", borderRadius: "8px", width: "100%", outline: "none" },
    badge: (status) => ({
      padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
      backgroundColor: status === "Closed" ? "rgba(113, 113, 122, 0.2)" : status === "Resolved" ? "rgba(16, 185, 129, 0.2)" : "rgba(249, 115, 22, 0.15)",
      color: status === "Closed" ? "#a1a1aa" : status === "Resolved" ? "#10b981" : "#f97316",
    })
  };

  return (
    <div style={s.bg}>
      <div style={{ ...s.panel, width: "35%", minWidth: "320px", height: "calc(100vh - 48px)" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 16px 0", color: "#f9fafb" }}>Lịch sử Hỗ trợ của bạn</h2>
          <input type="text" placeholder="Tìm theo Tiêu đề hoặc #ID..." style={s.input} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{...s.input, padding: "8px", fontSize: "12px", color: startDate ? "white" : "#a1a1aa"}} />
            <span style={{color: "#71717a"}}>-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{...s.input, padding: "8px", fontSize: "12px", color: endDate ? "white" : "#a1a1aa"}} />
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            {["All", "Open", "Resolved", "Closed"].map(st => (
              <button key={st} onClick={() => setFilterStatus(st)}
                style={{ flex: 1, padding: "6px 0", borderRadius: "6px", fontSize: "12px", cursor: "pointer", border: "none", fontWeight: "600",
                  backgroundColor: filterStatus === st ? "#f97316" : "rgba(39, 39, 42, 0.8)", color: filterStatus === st ? "white" : "#a1a1aa" }}>
                {st}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {isLoading ? <div style={{ textAlign: "center", color: "#a1a1aa", marginTop: "40px" }}>Đang tải...</div> : 
           filteredTickets.length === 0 ? <div style={{ textAlign: "center", color: "#a1a1aa", marginTop: "40px", fontSize: "14px" }}>Không có dữ liệu.</div> :
           filteredTickets.map(t => (
            <div key={t.ticketId} onClick={() => handleSelectTicket(t)}
              style={{ padding: "16px", borderRadius: "10px", marginBottom: "8px", cursor: "pointer", transition: "0.2s",
                backgroundColor: selectedTicket?.ticketId === t.ticketId ? "rgba(249, 115, 22, 0.15)" : "transparent",
                border: `1px solid ${selectedTicket?.ticketId === t.ticketId ? "#f97316" : "transparent"}` }}
              onMouseOver={(e) => { if(selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "rgba(63, 63, 70, 0.4)" }}
              onMouseOut={(e) => { if(selectedTicket?.ticketId !== t.ticketId) e.currentTarget.style.backgroundColor = "transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "#a1a1aa", fontWeight: "600" }}>#TCK-{t.ticketId}</span>
                <span style={s.badge(t.status)}>{t.status === "Resolved" ? "Có phản hồi" : t.status === "Open" ? "Đang xử lý" : t.status}</span>
              </div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", color: "#f4f4f5" }}>{t.subject}</h4>
              <div style={{ fontSize: "12px", color: "#a1a1aa", textAlign: "right" }}>{new Date(t.createdAt).toLocaleDateString("vi-VN")}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...s.panel, flex: 1, height: "calc(100vh - 48px)" }}>
        {!selectedTicket ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#71717a" }}><h3>Chọn một Ticket để xem phản hồi</h3></div>
        ) : (
          <>
            <div style={{ padding: "20px", borderBottom: "1px solid rgba(63, 63, 70, 0.4)", display: "flex", justifyContent: "space-between", backgroundColor: "transparent", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0", color: "#f4f4f5" }}>{selectedTicket.subject}</h2>
                <span style={{ fontSize: "13px", color: "#a1a1aa" }}>Shop: <strong style={{color: "#f97316"}}>{selectedTicket.vendorName}</strong></span>
              </div>
              
              {selectedTicket.status !== "Closed" && (
                <button onClick={handleCloseTicket}
                  style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#f97316", color: "white", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 14px 0 rgba(249, 115, 22, 0.39)" }}>
                   Xác nhận đã giải quyết
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {sortedMessages.map((msg) => {
                const isMine = String(msg.senderId) === String(currentUserId); 
                return (
                 <div key={msg.messageId} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <span style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "4px" }}>{isMine ? "Bạn" : msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}</span>
                    
                    {msg.messageContent && (
                      <div style={{ 
                        maxWidth: "75%", padding: "12px 16px", borderRadius: "12px", 
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
                        {msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) != null ? (
                          <img src={`http://localhost:8081${msg.attachmentUrl}`} alt="attachment" style={{ maxWidth: "100%", maxHeight: "300px", display: "block", objectFit: "cover" }} />
                        ) : (
                          <a href={`http://localhost:8081${msg.attachmentUrl}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", padding: "12px 16px", color: "white", textDecoration: "none", fontSize: "13px", backgroundColor: isMine ? "#f97316" : "rgba(39, 39, 42, 0.8)" }}>
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

            <div style={{ padding: "20px", borderTop: "1px solid rgba(63, 63, 70, 0.4)", backgroundColor: "transparent" }}>
              {selectedTicket.status === "Closed" ? (
                 <div style={{ textAlign: "center", color: "#10b981", padding: "10px" }}>Ticket này đã đóng. Cảm ơn bạn!</div>
              ) : (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
                    {replyFile && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "rgba(39, 39, 42, 0.8)", borderRadius: "6px", width: "max-content", fontSize: "13px", border: "1px solid rgba(82, 82, 91, 0.5)" }}>
                        <span style={{color: "#f97316"}}>📎 {replyFile.name}</span>
                        <button onClick={() => {setReplyFile(null); if(fileInputRef.current) fileInputRef.current.value = ""}} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0" }}>✖</button>
                      </div>
                    )}
                    <textarea rows="2" placeholder="Nhắn tin cho shop..." style={{ ...s.input, resize: "none" }} value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }} />
                  </div>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={(e) => setReplyFile(e.target.files[0])} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ padding: "12px", borderRadius: "8px", border: "1px solid rgba(82, 82, 91, 0.5)", backgroundColor: "rgba(39, 39, 42, 0.8)", color: "#a1a1aa", cursor: "pointer" }}>📎</button>
                  <button onClick={handleSendReply} disabled={!replyText.trim() && !replyFile} style={{ padding: "12px 24px", borderRadius: "8px", backgroundColor: (!replyText.trim() && !replyFile) ? "rgba(39, 39, 42, 0.8)" : "#f97316", color: (!replyText.trim() && !replyFile) ? "#71717a" : "white", border: "none", cursor: (!replyText.trim() && !replyFile) ? "not-allowed" : "pointer", fontWeight: "600" }}>Gửi 📤</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}