import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
  const navigate = useNavigate();

  // ===== STATE =====
  const [activeFaq, setActiveFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const faqSectionRef = useRef(null);

  // ===== FAQ DATA =====
  const faqs = [
    { category: 'shopping', q: "Làm sao để mua phần mềm trên TALLT Market?", a: "Bạn chỉ cần: 1) Tìm phần mềm trên Marketplace → 2) Chọn Gói License (Tier) phù hợp → 3) Thêm vào giỏ hàng → 4) Thanh toán qua VNPay (quét QR). Sau khi thanh toán thành công, hệ thống sẽ tự động cấp License Key cho bạn." },
    { category: 'shopping', q: "Tôi đã thanh toán qua VNPay nhưng chưa nhận được Key?", a: "Đôi khi hệ thống ngân hàng bị trễ vài phút. Bạn vui lòng kiểm tra trang 'Sản phẩm đã mua' hoặc email. Nếu sau 15 phút vẫn chưa nhận được, hãy vào mục 'Tạo Ticket Hỗ Trợ' → chọn 'Vấn đề khi mua' → cung cấp mã đơn hàng để chúng tôi duyệt thủ công ngay lập tức." },
    { category: 'shopping', q: "Phần mềm có tương thích với máy tôi không?", a: "Trong trang chi tiết của mỗi phần mềm, Vendor luôn cung cấp mục 'Yêu cầu hệ thống'. Bạn có thể kiểm tra dung lượng RAM, hệ điều hành (Windows/Mac/Linux) và cấu hình tối thiểu trước khi quyết định mua." },
    { category: 'license', q: "Làm sao để kích hoạt License Key?", a: "Sau khi mua, bạn vào 'Sản phẩm đã mua' → sao chép License Key → mở phần mềm đã tải → dán Key vào ô 'Nhập License Key' khi được yêu cầu. Hệ thống sẽ xác thực Key qua server TALLT và cho phép bạn sử dụng." },
    { category: 'license', q: "Tôi có thể đổi máy tính và dùng lại Key cũ không?", a: "Tùy thuộc vào Gói (Tier) bạn mua. Nếu gói chỉ cho phép 1 thiết bị, bạn cần vào mục 'Sản phẩm đã mua' → nhấn 'Thu hồi Key' (Revoke) trên máy cũ trước khi nhập Key vào máy mới. Nếu gói cho phép nhiều thiết bị, bạn có thể dùng song song." },
    { category: 'license', q: "Key đã hết hạn, tôi có thể gia hạn không?", a: "Hiện tại hệ thống chưa hỗ trợ gia hạn tự động. Bạn cần mua lại gói License mới. Nếu cần hỗ trợ đặc biệt (ví dụ: Key hết hạn sớm hơn cam kết), hãy tạo Ticket hỗ trợ để Vendor xem xét." },
    { category: 'technical', q: "Phần mềm bị lỗi khi cài đặt, phải làm sao?", a: "Bạn vui lòng: 1) Kiểm tra lại yêu cầu hệ thống → 2) Tắt phần mềm antivirus tạm thời → 3) Chạy file cài đặt với quyền Administrator. Nếu vẫn lỗi, hãy tạo Support Ticket, đính kèm ảnh màn hình lỗi để Vendor trực tiếp hướng dẫn." },
    { category: 'technical', q: "Phần mềm bị treo / crash khi sử dụng?", a: "Hãy thử: 1) Khởi động lại máy tính → 2) Cập nhật driver đồ họa → 3) Kiểm tra xem có phần mềm xung đột không. Nếu vẫn bị crash, tạo Ticket hỗ trợ kèm file log (nếu có) để Vendor phân tích nguyên nhân." },
    { category: 'technical', q: "Làm sao để báo cáo phần mềm có chứa mã độc?", a: "Hệ thống TALLT quét virus tự động trước khi duyệt sản phẩm. Tuy nhiên, nếu bạn phát hiện bất thường (CPU/RAM tăng cao bất thường, pop-up lạ...), hãy: 1) Gỡ cài đặt phần mềm ngay → 2) Dùng Chatbot hoặc gửi Email cho Admin để chúng tôi gỡ sản phẩm khỏi Marketplace." },
    { category: 'policy', q: "Chính sách hoàn tiền của TALLT Market như thế nào?", a: "TALLT chỉ hoàn tiền trong các trường hợp: 1) Lỗi mạng hệ thống khiến thanh toán bị trừ tiền nhưng không nhận Key → 2) Key được cấp phát bị lỗi do server xác thực của TALLT. Không hoàn tiền cho các trường hợp: máy tính không tương thích, đổi ý sau khi mua." },
    { category: 'policy', q: "Tôi có thể chia sẻ License Key cho người khác không?", a: "🚫 Nghiêm cấm! License Key là mã định danh cá nhân cho từng đơn hàng. Hệ thống sẽ tự động phát hiện nếu Key được dùng trên quá nhiều IP khác nhau. Vi phạm sẽ dẫn đến Key bị khóa vĩnh viễn và không được hoàn tiền." },
  ];

  const categories = [
    { id: 'all', label: 'Tất cả', icon: 'bi-grid-fill' },
    { id: 'shopping', label: 'Mua hàng', icon: 'bi-bag-check-fill' },
    { id: 'license', label: 'License', icon: 'bi-key-fill' },
    { id: 'technical', label: 'Kỹ thuật', icon: 'bi-bug-fill' },
    { id: 'policy', label: 'Chính sách', icon: 'bi-shield-check' },
  ];

  const topicCards = [
    { id: 'shopping', title: 'Hướng dẫn mua hàng', desc: 'Thanh toán, đơn hàng, VNPay', icon: 'bi-bag-check-fill', colorClass: 'orange' },
    { id: 'license', title: 'Kích hoạt License', desc: 'Key, thu hồi, đổi thiết bị', icon: 'bi-key-fill', colorClass: 'info' },
    { id: 'technical', title: 'Báo lỗi phần mềm', desc: 'Cài đặt, crash, mã độc', icon: 'bi-bug-fill', colorClass: 'danger' },
    { id: 'policy', title: 'Chính sách bảo mật', desc: 'Hoàn tiền, bảo hành, quy định', icon: 'bi-shield-check', colorClass: 'success' },
  ];

  // ===== FILTER FAQ =====
  const filteredFaqs = faqs.filter(faq => {
    const matchCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchSearch = searchTerm.trim() === '' ||
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleTopicClick = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchTerm('');
    setActiveFaq(null);
    if (faqSectionRef.current) {
      faqSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ===== RENDER =====
  return (
    <div className="hc-layout">

      {/* ============ HERO SECTION ============ */}
      <div className="hc-hero">
        <div className="hc-hero-content">
          <span className="hc-badge fade-in">
            <i className="bi bi-headset me-2"></i>Trung tâm trợ giúp & FAQ
          </span>
          <h1 className="hc-title fade-in">Chúng tôi có thể giúp gì cho bạn?</h1>
          <p className="hc-subtitle fade-in">Tìm kiếm hướng dẫn, chính sách bảo hành, hoặc trò chuyện với trợ lý ảo.</p>

          <div className="hc-search-box fade-in">
            <i className="bi bi-search hc-search-icon"></i>
            <input
              type="text"
              className="hc-search-input"
              placeholder="Tìm kiếm FAQ... (VD: Lỗi cài đặt, VNPay, Thu hồi Key)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveCategory('all');
                setActiveFaq(null);
              }}
            />
            {searchTerm && (
              <button className="hc-search-clear" onClick={() => setSearchTerm('')}>
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="hc-search-result fade-in">
              Tìm thấy <strong>{filteredFaqs.length}</strong> kết quả cho "<em>{searchTerm}</em>"
            </p>
          )}
        </div>
      </div>

      {/* ============ TOPIC CARDS ============ */}
      <div className="hc-section">
        <div className="hc-topic-grid">
          {topicCards.map((card, idx) => (
            <div
              key={card.id}
              className={`hc-topic-card fade-in ${activeCategory === card.id ? 'active' : ''}`}
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => handleTopicClick(card.id)}
            >
              <div className={`hc-topic-icon hc-icon-${card.colorClass}`}>
                <i className={`bi ${card.icon}`}></i>
              </div>
              <h5 className="hc-topic-title">{card.title}</h5>
              <p className="hc-topic-desc">{card.desc}</p>
              <div className="hc-topic-arrow">
                <i className="bi bi-arrow-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ FAQ SECTION ============ */}
      <div className="hc-section" ref={faqSectionRef}>
        <div className="hc-faq-wrapper">
          <div className="hc-section-header">
            <h3 className="hc-section-title">
              <i className="bi bi-chat-square-text me-2 text-orange"></i>
              Câu hỏi thường gặp
            </h3>
            <p className="hc-section-subtitle">Chọn chủ đề hoặc tìm kiếm để lọc câu hỏi phù hợp</p>
          </div>

          <div className="hc-category-tabs">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`hc-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); setActiveFaq(null); }}
              >
                <i className={`bi ${cat.icon} me-1`}></i>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="hc-accordion">
            {filteredFaqs.length === 0 ? (
              <div className="hc-empty-state">
                <i className="bi bi-search" style={{ fontSize: '2.5rem', color: '#52525b' }}></i>
                <p>Không tìm thấy câu hỏi nào phù hợp.</p>
                <button className="hc-btn-reset" onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}>
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => {
                const globalIndex = faqs.indexOf(faq);
                return (
                  <div className={`hc-accordion-item ${activeFaq === globalIndex ? 'active' : ''}`} key={globalIndex}>
                    <div className="hc-accordion-header" onClick={() => toggleFaq(globalIndex)}>
                      <div className="hc-accordion-left">
                        <span className={`hc-faq-tag hc-tag-${faq.category}`}>
                          {categories.find(c => c.id === faq.category)?.label}
                        </span>
                        <span className="hc-accordion-q">{faq.q}</span>
                      </div>
                      <i className={`bi bi-chevron-down hc-accordion-arrow ${activeFaq === globalIndex ? 'rotated' : ''}`}></i>
                    </div>
                    <div className="hc-accordion-body" style={{ maxHeight: activeFaq === globalIndex ? '300px' : '0' }}>
                      <div className="hc-accordion-content">{faq.a}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============ CONTACT CHANNELS ============ */}
      <div className="hc-section">
        <div className="hc-section-header">
          <h3 className="hc-section-title">
            <i className="bi bi-telephone me-2 text-orange"></i>
            Kênh liên hệ hỗ trợ
          </h3>
          <p className="hc-section-subtitle">Chọn phương thức liên hệ phù hợp nhất với bạn</p>
        </div>
        <div className="hc-contact-grid">
          <div className="hc-contact-card">
            <div className="hc-contact-icon hc-icon-orange">
              <i className="bi bi-envelope-fill"></i>
            </div>
            <h5>Email hỗ trợ</h5>
            <p>Gửi email mô tả vấn đề, chúng tôi phản hồi trong 24h.</p>
            <a href="mailto:support@talltmarket.com" className="hc-contact-link">
              support@talltmarket.com
              <i className="bi bi-arrow-up-right ms-1"></i>
            </a>
          </div>

          <div className="hc-contact-card" onClick={() => navigate('/Page/Customer/CreateSupportTicket')} style={{ cursor: 'pointer' }}>
            <div className="hc-contact-icon hc-icon-info">
              <i className="bi bi-ticket-detailed-fill"></i>
            </div>
            <h5>Tạo Ticket hỗ trợ</h5>
            <p>Gửi yêu cầu trực tiếp đến Vendor phụ trách sản phẩm.</p>
            <span className="hc-contact-link">
              Tạo Ticket ngay
              <i className="bi bi-arrow-right ms-1"></i>
            </span>
          </div>

          <div className="hc-contact-card">
            <div className="hc-contact-icon hc-icon-success">
              <i className="bi bi-robot"></i>
            </div>
            <h5>Trợ lý ảo (Chatbot)</h5>
            <p>Trả lời tức thì 24/7, bấm nút chat ở góc phải màn hình.</p>
            <span className="hc-contact-link">
              Luôn sẵn sàng hỗ trợ
              <i className="bi bi-chat-dots ms-1"></i>
            </span>
          </div>
        </div>
      </div>

      {/* ============ CSS ============ */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hc-layout {
          background-color: transparent;
          color: #f4f4f5;
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          padding-bottom: 80px;
        }
        .text-orange { color: #f97316 !important; }

        /* HERO */
        .hc-hero {
          padding: 60px 20px 50px;
          background: radial-gradient(ellipse at center top, rgba(249, 115, 22, 0.12) 0%, transparent 65%);
          text-align: center;
        }
        .hc-hero-content { max-width: 700px; margin: 0 auto; }
        .hc-badge {
          display: inline-block;
          background: rgba(249,115,22,0.12);
          color: #f97316;
          padding: 6px 18px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid rgba(249,115,22,0.25);
          margin-bottom: 20px;
        }
        .hc-title {
          font-size: 2.6rem;
          font-weight: 800;
          color: #fff;
          margin-bottom: 14px;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }
        .hc-subtitle { font-size: 1.05rem; color: #a1a1aa; margin-bottom: 32px; }

        .hc-search-box {
          position: relative;
          max-width: 580px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          background: #09090b;
          border: 1px solid #3f3f46;
          border-radius: 14px;
          padding: 6px 10px 6px 6px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          transition: 0.3s;
        }
        .hc-search-box:focus-within {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.15), 0 10px 30px rgba(0,0,0,0.4);
        }
        .hc-search-icon { position: absolute; left: 20px; color: #71717a; font-size: 1.15rem; }
        .hc-search-input {
          width: 100%; background: transparent; border: none; color: white;
          padding: 14px 40px 14px 48px; font-size: 1rem; outline: none;
        }
        .hc-search-input::placeholder { color: #52525b; }
        .hc-search-clear {
          background: rgba(255,255,255,0.08); border: none; color: #a1a1aa;
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.2s; flex-shrink: 0;
        }
        .hc-search-clear:hover { background: rgba(239,68,68,0.2); color: #ef4444; }
        .hc-search-result { margin-top: 14px; font-size: 0.9rem; color: #a1a1aa; }

        /* SECTION */
        .hc-section { max-width: 900px; margin: 0 auto; padding: 0 20px; margin-top: 40px; }
        .hc-section-header { text-align: center; margin-bottom: 28px; }
        .hc-section-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
        .hc-section-subtitle { font-size: 0.95rem; color: #71717a; margin: 0; }

        /* TOPIC CARDS */
        .hc-topic-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 768px) {
          .hc-topic-grid { grid-template-columns: repeat(2, 1fr); }
          .hc-title { font-size: 2rem; }
        }
        .hc-topic-card {
          background: #09090b; border: 1px solid #27272a; border-radius: 16px;
          padding: 24px 18px 20px; text-align: center; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative; overflow: hidden;
        }
        .hc-topic-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0;
          height: 3px; background: transparent; transition: 0.3s;
        }
        .hc-topic-card:hover {
          transform: translateY(-4px); border-color: #3f3f46; background: #18181b;
          box-shadow: 0 12px 24px rgba(0,0,0,0.3);
        }
        .hc-topic-card.active { border-color: #f97316; }
        .hc-topic-card.active::before { background: #f97316; }

        .hc-topic-icon {
          width: 52px; height: 52px; margin: 0 auto 14px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem; transition: 0.3s;
        }
        .hc-icon-orange { background: rgba(249,115,22,0.12); color: #f97316; }
        .hc-icon-info { background: rgba(14,165,233,0.12); color: #0ea5e9; }
        .hc-icon-danger { background: rgba(239,68,68,0.12); color: #ef4444; }
        .hc-icon-success { background: rgba(16,185,129,0.12); color: #10b981; }

        .hc-topic-title { font-size: 0.95rem; font-weight: 600; color: #fff; margin: 0 0 6px; }
        .hc-topic-desc { font-size: 0.8rem; color: #71717a; margin: 0 0 10px; }
        .hc-topic-arrow { color: #52525b; font-size: 0.9rem; transition: 0.3s; }
        .hc-topic-card:hover .hc-topic-arrow { color: #f97316; transform: translateX(3px); }

        /* FAQ */
        .hc-faq-wrapper { max-width: 800px; margin: 0 auto; }
        .hc-category-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center; }
        .hc-cat-btn {
          background: #18181b; border: 1px solid #27272a; color: #a1a1aa;
          padding: 8px 18px; border-radius: 10px; font-size: 0.85rem;
          font-weight: 600; cursor: pointer; transition: 0.25s;
        }
        .hc-cat-btn:hover { border-color: #3f3f46; color: #fff; background: #27272a; }
        .hc-cat-btn.active {
          background: #f97316; border-color: #f97316; color: white;
          box-shadow: 0 4px 12px rgba(249,115,22,0.25);
        }

        .hc-accordion { display: flex; flex-direction: column; gap: 10px; }
        .hc-accordion-item {
          background: #09090b; border: 1px solid #27272a; border-radius: 12px;
          overflow: hidden; transition: 0.3s;
        }
        .hc-accordion-item.active { border-color: rgba(249,115,22,0.5); background: #0c0c0e; }
        .hc-accordion-header {
          padding: 16px 18px; display: flex; justify-content: space-between;
          align-items: center; cursor: pointer; user-select: none; gap: 12px;
        }
        .hc-accordion-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
        .hc-faq-tag {
          font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 6px;
          text-transform: uppercase; flex-shrink: 0; letter-spacing: 0.3px;
        }
        .hc-tag-shopping { background: rgba(249,115,22,0.12); color: #f97316; }
        .hc-tag-license { background: rgba(14,165,233,0.12); color: #0ea5e9; }
        .hc-tag-technical { background: rgba(239,68,68,0.12); color: #ef4444; }
        .hc-tag-policy { background: rgba(16,185,129,0.12); color: #10b981; }

        .hc-accordion-q { font-weight: 600; color: #e4e4e7; font-size: 0.95rem; line-height: 1.4; }
        .hc-accordion-arrow { color: #52525b; transition: 0.3s; flex-shrink: 0; font-size: 0.85rem; }
        .hc-accordion-arrow.rotated { transform: rotate(180deg); color: #f97316; }
        .hc-accordion-body { overflow: hidden; transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        .hc-accordion-content {
          padding: 0 18px 18px 18px; color: #a1a1aa; line-height: 1.7;
          font-size: 0.92rem; border-top: 1px solid #1a1a1e; padding-top: 14px;
        }

        .hc-empty-state {
          text-align: center; padding: 48px 20px; background: #09090b;
          border: 1px dashed #27272a; border-radius: 14px; color: #71717a;
        }
        .hc-empty-state p { margin: 14px 0; font-size: 1rem; }
        .hc-btn-reset {
          background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.3);
          color: #f97316; padding: 8px 20px; border-radius: 8px;
          font-weight: 600; cursor: pointer; transition: 0.2s;
        }
        .hc-btn-reset:hover { background: rgba(249,115,22,0.2); }

        /* CONTACT CARDS */
        .hc-contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) { .hc-contact-grid { grid-template-columns: 1fr; } }
        .hc-contact-card {
          background: #09090b; border: 1px solid #27272a; border-radius: 16px;
          padding: 28px 22px; text-align: center; transition: 0.3s;
        }
        .hc-contact-card:hover {
          transform: translateY(-3px); border-color: #3f3f46; background: #18181b;
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        }
        .hc-contact-icon {
          width: 52px; height: 52px; margin: 0 auto 16px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
        }
        .hc-contact-card h5 { font-size: 1rem; font-weight: 600; color: #fff; margin: 0 0 8px; }
        .hc-contact-card p { font-size: 0.85rem; color: #71717a; margin: 0 0 14px; line-height: 1.5; }
        .hc-contact-link {
          color: #f97316; font-size: 0.88rem; font-weight: 600;
          text-decoration: none; transition: 0.2s;
        }
        .hc-contact-link:hover { color: #ea580c; }

        /* Animations */
        .fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default HelpCenter;