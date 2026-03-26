import React, { useState, useRef, useEffect } from 'react';

const ChatbotWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [chatHistory, setChatHistory] = useState([
    { sender: 'bot', text: 'Xin chào! 👋 Tôi là trợ lý ảo của TALLT Market. Tôi có thể giúp bạn giải đáp thắc mắc về mua hàng, kích hoạt license, lỗi phần mềm và nhiều vấn đề khác. Hãy hỏi tôi bất cứ điều gì!' }
  ]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping, isChatOpen]);

  const quickReplies = [
    "Làm sao mua phần mềm?",
    "Kích hoạt License Key",
    "Lỗi thanh toán VNPay",
    "Phần mềm bị lỗi cài đặt",
    "Chính sách hoàn tiền",
  ];

  const getBotReply = (msg) => {
    const lower = msg.toLowerCase();

    if (lower.includes('mua') || lower.includes('thanh toán') || lower.includes('giỏ hàng') || lower.includes('đặt hàng')) {
      return "🛒 Để mua phần mềm, bạn tìm trên Marketplace → Chọn gói License → Thêm vào giỏ hàng → Thanh toán qua VNPay (quét QR). Nếu gặp lỗi thanh toán, hãy tạo Ticket hỗ trợ nhé!";
    }
    if (lower.includes('key') || lower.includes('license') || lower.includes('kích hoạt') || lower.includes('bản quyền')) {
      return "🔑 Sau khi mua, vào 'Sản phẩm đã mua' → sao chép Key → dán vào phần mềm khi được yêu cầu. Nếu muốn đổi máy, hãy 'Thu hồi Key' trên máy cũ trước. Gói 1 thiết bị chỉ cho phép 1 máy hoạt động cùng lúc.";
    }
    if (lower.includes('lỗi') || lower.includes('crash') || lower.includes('treo') || lower.includes('không chạy')) {
      return "🐛 Bạn vui lòng: 1) Kiểm tra yêu cầu hệ thống → 2) Tắt antivirus tạm → 3) Chạy với quyền Administrator. Nếu vẫn lỗi, tạo Support Ticket kèm ảnh màn hình để Vendor hướng dẫn trực tiếp nhé!";
    }
    if (lower.includes('cài đặt') || lower.includes('tải') || lower.includes('download') || lower.includes('install')) {
      return "⚙️ Sau khi thanh toán, phần mềm sẽ có link tải trong mục 'Sản phẩm đã mua'. Khi cài đặt, hãy chạy file với quyền Administrator. Nếu bị chặn bởi antivirus, thêm vào danh sách ngoại lệ (whitelist).";
    }
    if (lower.includes('hoàn tiền') || lower.includes('refund') || lower.includes('trả tiền')) {
      return "💰 TALLT hoàn tiền trong các trường hợp: lỗi hệ thống khiến trừ tiền nhưng không nhận Key, hoặc Key bị lỗi do server TALLT. Không hoàn tiền khi máy không tương thích hoặc đổi ý. Tạo Ticket để được xem xét!";
    }
    if (lower.includes('vnpay') || lower.includes('qr') || lower.includes('ngân hàng')) {
      return "💳 Thanh toán qua VNPay bằng cách quét mã QR. Hệ thống sẽ xác nhận trong vài giây. Nếu đã trừ tiền nhưng chưa nhận Key sau 15 phút, hãy tạo Ticket → 'Vấn đề khi mua' với mã đơn hàng nhé.";
    }
    if (lower.includes('mã độc') || lower.includes('virus') || lower.includes('malware') || lower.includes('độc hại')) {
      return "🛡️ TALLT quét virus tự động trước khi duyệt sản phẩm. Nếu bạn nghi ngờ phần mềm có mã độc (CPU/RAM tăng cao bất thường, pop-up lạ), hãy gỡ cài đặt ngay và báo cáo cho Admin qua Email hoặc Ticket!";
    }
    if (lower.includes('tài khoản') || lower.includes('đăng nhập') || lower.includes('mật khẩu') || lower.includes('đăng ký')) {
      return "👤 Để đăng ký tài khoản, nhấn 'Đăng ký' trên trang chủ → điền thông tin → xác thực email. Nếu quên mật khẩu, dùng chức năng 'Quên mật khẩu' để reset qua email đã đăng ký.";
    }
    if (lower.includes('vendor') || lower.includes('bán hàng') || lower.includes('nhà cung cấp')) {
      return "🏪 Nếu bạn muốn trở thành Vendor bán phần mềm trên TALLT, hãy vào trang 'Đăng ký Vendor' → điền thông tin doanh nghiệp → chờ Admin duyệt. Lưu ý: phần mềm bắt buộc phải tích hợp SDK TalltLicenseGuard.";
    }
    if (lower.includes('ticket') || lower.includes('hỗ trợ') || lower.includes('support')) {
      return "📋 Để tạo Ticket hỗ trợ: vào Dashboard → 'Tạo Ticket hỗ trợ' → chọn sản phẩm → mô tả vấn đề → gửi. Vendor sẽ phản hồi trong thời gian sớm nhất. Bạn có thể theo dõi tiến độ tại mục 'Quản lý Ticket'.";
    }
    if (lower.includes('xin chào') || lower.includes('hello') || lower.includes('hi') || lower.includes('chào')) {
      return "👋 Xin chào! Rất vui được hỗ trợ bạn. Bạn có thể hỏi tôi về: mua hàng, kích hoạt License, lỗi phần mềm, hoàn tiền, hoặc bất kỳ vấn đề nào khác!";
    }
    if (lower.includes('cảm ơn') || lower.includes('thank')) {
      return "😊 Không có gì! Rất vui vì đã giúp được bạn. Nếu cần thêm hỗ trợ, đừng ngần ngại hỏi lại hoặc tạo Ticket hỗ trợ nhé!";
    }

    return "🤔 Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể thử hỏi về: **mua hàng**, **kích hoạt License**, **lỗi phần mềm**, **hoàn tiền**, hoặc **chính sách bảo mật**. Hoặc tạo Ticket hỗ trợ để được tư vấn chi tiết hơn!";
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage.trim();
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotReply(userMsg);
      setChatHistory(prev => [...prev, { sender: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickReply = (text) => {
    setChatHistory(prev => [...prev, { sender: 'user', text }]);
    setIsTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text);
      setChatHistory(prev => [...prev, { sender: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <div className="cw-chatbot-wrapper">
        {/* Chat Window */}
        <div className={`cw-chat-window ${isChatOpen ? 'open' : ''}`}>
          <div className="cw-chat-header">
            <div className="d-flex align-items-center">
              <div className="cw-bot-avatar"><i className="bi bi-robot"></i></div>
              <div style={{ marginLeft: '10px' }}>
                <h6 style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Trợ Lý Ảo TALLT</h6>
                <small className="cw-online-dot">● Đang trực tuyến</small>
              </div>
            </div>
            <button className="cw-close-btn" onClick={() => setIsChatOpen(false)} title="Đóng chat">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="cw-chat-body cw-scrollbar">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`cw-msg-row ${msg.sender === 'user' ? 'cw-msg-right' : 'cw-msg-left'}`}>
                {msg.sender === 'bot' && (
                  <div className="cw-msg-avatar"><i className="bi bi-robot"></i></div>
                )}
                <div className={`cw-msg-bubble ${msg.sender === 'user' ? 'cw-msg-user' : 'cw-msg-bot'}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="cw-msg-row cw-msg-left">
                <div className="cw-msg-avatar"><i className="bi bi-robot"></i></div>
                <div className="cw-msg-bubble cw-msg-bot">
                  <div className="cw-typing-dots"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}

            {!isTyping && chatHistory.length <= 2 && (
              <div className="cw-quick-replies">
                <p className="cw-quick-label">Gợi ý câu hỏi:</p>
                {quickReplies.map((text, idx) => (
                  <button key={idx} className="cw-quick-btn" onClick={() => handleQuickReply(text)}>
                    {text}
                  </button>
                ))}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="cw-chat-footer">
            <form onSubmit={handleSendMessage} className="cw-chat-form">
              <input
                type="text"
                className="cw-chat-input"
                placeholder="Nhập câu hỏi của bạn..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="cw-chat-send" disabled={!chatMessage.trim() || isTyping}>
                <i className="bi bi-send-fill"></i>
              </button>
            </form>
          </div>
        </div>

        {/* Floating Toggle Button */}
        <button
          className={`cw-fab-btn ${isChatOpen ? 'cw-fab-active' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Đóng chat' : 'Mở chat hỗ trợ'}
        >
          <i className={`bi ${isChatOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
          {!isChatOpen && <span className="cw-fab-badge">1</span>}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* ===== CHATBOT WIDGET (GLOBAL) ===== */
        .cw-chatbot-wrapper {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 99999;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* FAB Button */
        .cw-fab-btn {
          width: 58px; height: 58px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          font-size: 1.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(249,115,22,0.4);
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          animation: cwPulse 2.5s ease-in-out infinite;
        }
        .cw-fab-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 28px rgba(249,115,22,0.5);
        }
        .cw-fab-btn.cw-fab-active {
          background: linear-gradient(135deg, #3f3f46, #27272a);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
          animation: none;
          font-size: 1.3rem;
        }
        .cw-fab-btn.cw-fab-active:hover {
          background: linear-gradient(135deg, #52525b, #3f3f46);
        }
        .cw-fab-btn i {
          transition: transform 0.3s ease;
        }
        .cw-fab-badge {
          position: absolute;
          top: -2px; right: -2px;
          width: 20px; height: 20px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #09090b;
        }

        @keyframes cwPulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(249,115,22,0.4); }
          50% { box-shadow: 0 8px 32px rgba(249,115,22,0.65); }
        }

        /* Chat Window */
        .cw-chat-window {
          position: absolute;
          bottom: 72px; right: 0;
          width: 380px; height: 520px;
          background: #09090b;
          border: 1px solid #3f3f46;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          transform-origin: bottom right;
          transform: scale(0);
          opacity: 0;
          transition: 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;
        }
        .cw-chat-window.open {
          transform: scale(1);
          opacity: 1;
          pointer-events: all;
        }

        @media (max-width: 480px) {
          .cw-chat-window {
            width: calc(100vw - 20px);
            height: calc(100vh - 100px);
            bottom: 72px;
            right: -18px;
            border-radius: 16px;
          }
        }

        /* Header */
        .cw-chat-header {
          background: linear-gradient(135deg, #18181b, #1c1c20);
          padding: 14px 18px;
          border-bottom: 1px solid #27272a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cw-bot-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(249,115,22,0.15);
          color: #f97316;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .cw-online-dot { color: #10b981; font-size: 0.72rem; }
        .cw-close-btn {
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 1.1rem;
          cursor: pointer;
          transition: 0.2s;
          padding: 4px 6px;
          border-radius: 6px;
        }
        .cw-close-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

        /* Body */
        .cw-chat-body {
          flex: 1;
          padding: 18px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #000;
        }
        .cw-msg-row { display: flex; align-items: flex-end; gap: 8px; width: 100%; }
        .cw-msg-left { justify-content: flex-start; }
        .cw-msg-right { justify-content: flex-end; }
        .cw-msg-avatar {
          width: 26px; height: 26px;
          border-radius: 50%;
          background: #27272a;
          color: #a1a1aa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .cw-msg-bubble {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.88rem;
          line-height: 1.55;
          word-wrap: break-word;
          animation: cwMsgSlide 0.25s ease-out;
        }
        .cw-msg-bot {
          background: #18181b;
          border: 1px solid #27272a;
          color: #e4e4e7;
          border-bottom-left-radius: 4px;
        }
        .cw-msg-user {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border-bottom-right-radius: 4px;
        }

        @keyframes cwMsgSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Quick Replies */
        .cw-quick-replies {
          padding: 8px 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cw-quick-label {
          width: 100%;
          font-size: 0.75rem;
          color: #52525b;
          margin: 0 0 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cw-quick-btn {
          background: #18181b;
          border: 1px solid #3f3f46;
          color: #e4e4e7;
          padding: 6px 12px;
          border-radius: 18px;
          font-size: 0.78rem;
          cursor: pointer;
          transition: 0.2s;
          font-weight: 500;
        }
        .cw-quick-btn:hover {
          border-color: #f97316;
          background: rgba(249,115,22,0.1);
          color: #f97316;
        }

        /* Footer */
        .cw-chat-footer {
          padding: 12px;
          background: #18181b;
          border-top: 1px solid #27272a;
        }
        .cw-chat-form {
          display: flex;
          gap: 8px;
          background: #000;
          border: 1px solid #3f3f46;
          border-radius: 24px;
          padding: 4px 6px 4px 16px;
          transition: 0.2s;
        }
        .cw-chat-form:focus-within { border-color: #f97316; }
        .cw-chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          outline: none;
          font-size: 0.9rem;
        }
        .cw-chat-input::placeholder { color: #52525b; }
        .cw-chat-send {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
          flex-shrink: 0;
          font-size: 0.85rem;
        }
        .cw-chat-send:hover:not(:disabled) { transform: scale(1.05); }
        .cw-chat-send:disabled { background: #3f3f46; color: #71717a; cursor: not-allowed; }

        /* Typing Dots */
        .cw-typing-dots { display: flex; gap: 4px; padding: 4px 2px; }
        .cw-typing-dots span {
          width: 6px; height: 6px;
          background: #71717a;
          border-radius: 50%;
          animation: cwTyping 1.4s infinite ease-in-out both;
        }
        .cw-typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .cw-typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes cwTyping { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

        /* Scrollbar */
        .cw-scrollbar::-webkit-scrollbar { width: 5px; }
        .cw-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .cw-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
        .cw-scrollbar::-webkit-scrollbar-thumb:hover { background: #52525b; }
      `}} />
    </>
  );
};

export default ChatbotWidget;
