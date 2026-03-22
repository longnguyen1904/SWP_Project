
import React, { useEffect } from "react";
import "../Style/EventPage.css";

export default function Event() {
  // Cuộn trang lên đầu khi mới vào
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const eventData = [
    {
      id: 1,
      title: "TALLT Hackathon 2026",
      date: "Tháng 04 - 15, 2026",
      desc: "Tham gia cùng các pháp sư lập trình hàng đầu để xây dựng những Dapp đột phá. Giải thưởng lớn, cơ hội gặp gỡ nhà đầu tư và đưa sản phẩm lên sàn TALLT ngay lập tức.",
      type: "card-dev",
      btnText: "ĐĂNG KÝ THI ĐẤU"
    },
    {
      id: 2,
      title: "Cyber Security & LicenseGuard",
      date: "Tháng 05 - 02, 2026",
      desc: "Khóa huấn luyện chuyên sâu về cách bảo vệ mã nguồn, chống decompile, chống bẻ khóa và cách vận dụng tối đa sức mạnh của SDK TalltLicenseGuard vào dự án.",
      type: "card-sec",
      btnText: "GIỮ CHỖ NGAY"
    },
    {
      id: 3,
      title: "Vendor Onboarding Webinar",
      date: "Tháng 05 - 20, 2026",
      desc: "Dành riêng cho các nhà phát triển mong muốn bắt đầu bán phần mềm. Hướng dẫn pháp lý, định giá sản phẩm và cách marketing đẩy Top Sale trên nền tảng.",
      type: "card-biz",
      btnText: "THAM GIA WEBINAR"
    }
  ];

  return (
    <div className="event-page-container">
      <div className="event-hero">
        <h1>TALLT Dev Summit & Events</h1>
        <p>
          Khám phá hệ sinh thái sự kiện dành riêng cho Cộng đồng Lập trình viên,
          Nhà phát triển phần mềm và Cựu chiến binh an ninh mạng.
        </p>
      </div>

      <div className="event-grid">
        {eventData.map((ev) => (
          <div className={`event-card ${ev.type}`} key={ev.id}>
            <span className="event-date">{ev.date}</span>
            <h3>{ev.title}</h3>
            <p>{ev.desc}</p>
            <button className="event-btn">
              {ev.btnText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}