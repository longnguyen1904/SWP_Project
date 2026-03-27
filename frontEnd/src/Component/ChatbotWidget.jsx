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

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const getBotReply = (msg) => {
    const lower = msg.toLowerCase().normalize("NFC");

    // ===== 0. TÍNH TOÁN / MATH =====
    const mathExpr = msg.replace(/\s/g, '');
    // Nhận diện biểu thức toán: 1+1, 2*3, 100/4, 2^10, sqrt(9), (2+3)*4, v.v.
    if (/^[\d+\-*/().^%sqrtpowabsceilfloor,]+$/i.test(mathExpr) && /\d/.test(mathExpr) && /[+\-*/^%()]/.test(mathExpr)) {
      try {
        // Thay thế các ký hiệu phổ biến
        let expr = msg
          .replace(/x/gi, '*')
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/\^/g, '**')
          .replace(/sqrt\(/gi, 'Math.sqrt(')
          .replace(/pow\(/gi, 'Math.pow(')
          .replace(/abs\(/gi, 'Math.abs(')
          .replace(/ceil\(/gi, 'Math.ceil(')
          .replace(/floor\(/gi, 'Math.floor(');

        // Chỉ cho phép các ký tự an toàn
        if (/^[\d+\-*/().,%\s]|(Math\.(sqrt|pow|abs|ceil|floor))/g.test(expr.replace(/Math\.\w+/g, '').replace(/[\d+\-*/().,%\s]/g, '')) === false || expr.includes('import') || expr.includes('require') || expr.includes('fetch') || expr.includes('eval')) {
          throw new Error('Biểu thức không hợp lệ');
        }

        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + expr)();

        if (typeof result === 'number' && isFinite(result)) {
          const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
          return `🧮 Kết quả: ${msg.trim()} = **${formatted}**\n\nBạn có muốn tính thêm gì không? Hoặc hỏi tôi về TALLT Market nhé! 😊`;
        }
      } catch (e) {
        // Không phải biểu thức hợp lệ → bỏ qua, tiếp tục xử lý keyword
      }
    }
    // Nhận diện câu hỏi tính toán bằng tiếng Việt: "tính 1+1", "bằng bao nhiêu 2*3"
    if (/^(tính|tính giúp|bao nhiêu|= bao nhiêu|bằng mấy|kết quả)/.test(lower)) {
      const numbers = msg.match(/[\d+\-*/().^]+/g);
      if (numbers) {
        try {
          const expr = numbers.join('').replace(/\^/g, '**');
          // eslint-disable-next-line no-new-func
          const result = new Function('return ' + expr)();
          if (typeof result === 'number' && isFinite(result)) {
            const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
            return `🧮 Kết quả: ${numbers.join('')} = **${formatted}**\n\nCần tính thêm gì không? 😊`;
          }
        } catch (e) { /* bỏ qua */ }
      }
    }

    if (/^(hi|hello|hey|xin chào|chào|ê|alo|yo)\b/.test(lower) || lower === 'hi' || lower === 'hello') {
      return pick([
        "👋 Xin chào! Rất vui được hỗ trợ bạn. Bạn có thể hỏi tôi về: mua hàng, kích hoạt License, lỗi phần mềm, hoàn tiền, hoặc bất kỳ vấn đề nào khác!",
        "👋 Chào bạn! Tôi là Trợ lý ảo TALLT. Hãy cho tôi biết bạn cần giúp gì nhé!",
        "🙌 Xin chào! Bạn cần tôi hỗ trợ vấn đề gì hôm nay?",
      ]);
    }

    // ===== 2. CẢM ƠN / KHEN =====
    if (lower.includes('cảm ơn') || lower.includes('thank') || lower.includes('tks') || lower.includes('tuyệt vời') || lower.includes('giỏi quá')) {
      return pick([
        "😊 Không có gì! Rất vui vì đã giúp được bạn. Nếu cần thêm hỗ trợ, đừng ngần ngại hỏi lại nhé!",
        "🥰 Cảm ơn bạn đã tin tưởng TALLT! Hãy quay lại bất cứ khi nào bạn cần nhé!",
        "😄 Rất vui vì đã hỗ trợ được bạn! Chúc bạn có trải nghiệm tuyệt vời với TALLT Market!",
      ]);
    }

    // ===== 3. TẠM BIỆT =====
    if (lower.includes('tạm biệt') || lower.includes('bye') || lower.includes('goodbye') || lower.includes('thoát') || lower.includes('hẹn gặp lại')) {
      return pick([
        "👋 Tạm biệt bạn! Chúc bạn một ngày tốt lành. Hẹn gặp lại!",
        "🌟 Hẹn gặp lại! Nếu cần hỗ trợ thêm, tôi luôn ở đây nhé!",
        "😊 Bye bye! Cảm ơn bạn đã sử dụng TALLT Market!",
      ]);
    }

    // ===== 4. MUA HÀNG / THANH TOÁN / GIỎ HÀNG =====
    if (lower.includes('mua') || lower.includes('thanh toán') || lower.includes('giỏ hàng') || lower.includes('đặt hàng') || lower.includes('order') || lower.includes('checkout') || lower.includes('đơn hàng')) {
      if (lower.includes('theo dõi') || lower.includes('trạng thái') || lower.includes('tracking') || lower.includes('kiểm tra đơn')) {
        return "📦 Để theo dõi đơn hàng: vào Dashboard → 'Đơn hàng của tôi'. Tại đây bạn sẽ thấy trạng thái từng đơn (Đang xử lý / Hoàn tất / Đã hủy). Nếu đơn hàng bị treo quá lâu, hãy tạo Ticket hỗ trợ nhé!";
      }
      if (lower.includes('hủy') || lower.includes('cancel')) {
        return "❌ Hiện tại TALLT không hỗ trợ tự hủy đơn hàng sau khi thanh toán thành công. Nếu bạn cần hủy, vui lòng tạo Ticket hỗ trợ kèm mã đơn hàng để Admin xem xét hoàn trả!";
      }
      return "🛒 Để mua phần mềm trên TALLT:\n1️⃣ Tìm sản phẩm trên Marketplace\n2️⃣ Chọn gói License phù hợp\n3️⃣ Thêm vào giỏ hàng\n4️⃣ Thanh toán qua VNPay (quét QR)\n\nSau khi thanh toán, License Key sẽ có ngay trong mục 'Sản phẩm đã mua'. Nếu gặp lỗi, hãy tạo Ticket hỗ trợ nhé!";
    }

    // ===== 5. GIÁ CẢ / CHI PHÍ =====
    if (lower.includes('giá') || lower.includes('bao nhiêu tiền') || lower.includes('chi phí') || lower.includes('price') || lower.includes('phí') || lower.includes('rẻ') || lower.includes('đắt') || lower.includes('miễn phí') || lower.includes('free')) {
      if (lower.includes('miễn phí') || lower.includes('free')) {
        return "🆓 Một số phần mềm trên TALLT có phiên bản dùng thử miễn phí (Trial). Bạn có thể lọc theo 'Miễn phí' trên Marketplace để tìm. Tuy nhiên, bản đầy đủ sẽ cần mua License!";
      }
      return "💰 Giá phần mềm trên TALLT do từng Vendor tự quy định. Mỗi sản phẩm có thể có nhiều gói License khác nhau (1 thiết bị, 3 thiết bị, không giới hạn...). Bạn xem chi tiết giá tại trang sản phẩm trên Marketplace nhé!";
    }

    // ===== 6. LICENSE KEY / KÍCH HOẠT =====
    if (lower.includes('key') || lower.includes('license') || lower.includes('kích hoạt') || lower.includes('bản quyền') || lower.includes('activate') || lower.includes('serial')) {
      if (lower.includes('hết hạn') || lower.includes('gia hạn') || lower.includes('expired') || lower.includes('renew')) {
        return "⏰ License Key có thể có thời hạn tùy gói bạn mua. Khi sắp hết hạn, hệ thống sẽ gửi thông báo qua email. Bạn có thể gia hạn bằng cách mua lại gói License mới trên Marketplace!";
      }
      if (lower.includes('đổi máy') || lower.includes('chuyển máy') || lower.includes('thu hồi') || lower.includes('máy mới')) {
        return "🔄 Để chuyển License sang máy mới:\n1️⃣ Vào 'Sản phẩm đã mua'\n2️⃣ Chọn sản phẩm → 'Thu hồi Key' trên máy cũ\n3️⃣ Cài phần mềm trên máy mới → dán Key vào\n\nGói 1 thiết bị chỉ cho phép 1 máy hoạt động cùng lúc nhé!";
      }
      if (lower.includes('không nhận') || lower.includes('chưa nhận') || lower.includes('không thấy')) {
        return "⚠️ Nếu bạn đã thanh toán nhưng chưa nhận được License Key:\n1️⃣ Kiểm tra mục 'Sản phẩm đã mua' trong Dashboard\n2️⃣ Chờ 5-15 phút để hệ thống xử lý\n3️⃣ Nếu vẫn chưa có, tạo Ticket hỗ trợ kèm mã đơn hàng để Admin kiểm tra!";
      }
      return "🔑 Sau khi mua, vào 'Sản phẩm đã mua' → sao chép Key → dán vào phần mềm khi được yêu cầu. Nếu muốn đổi máy, hãy 'Thu hồi Key' trên máy cũ trước. Gói 1 thiết bị chỉ cho phép 1 máy hoạt động cùng lúc.";
    }

    // ===== 7. LỖI / BUG / CRASH =====
    if (lower.includes('lỗi') || lower.includes('crash') || lower.includes('treo') || lower.includes('không chạy') || lower.includes('bug') || lower.includes('sập') || lower.includes('đơ') || lower.includes('không mở được') || lower.includes('bị kẹt')) {
      if (lower.includes('thanh toán') || lower.includes('trừ tiền')) {
        return "⚠️ Nếu bạn bị trừ tiền nhưng giao dịch thất bại:\n1️⃣ Chờ 15-30 phút để VNPay hoàn tiền tự động\n2️⃣ Kiểm tra lịch sử giao dịch ngân hàng\n3️⃣ Nếu chưa hoàn, tạo Ticket kèm ảnh chụp biên lai ngân hàng để Admin xử lý nhanh nhé!";
      }
      return "🐛 Phần mềm bị lỗi? Hãy thử:\n1️⃣ Kiểm tra yêu cầu hệ thống (CPU, RAM, OS)\n2️⃣ Tắt tạm phần mềm antivirus\n3️⃣ Chạy với quyền Administrator (chuột phải → Run as Admin)\n4️⃣ Gỡ cài đặt và cài lại phiên bản mới nhất\n\nNếu vẫn lỗi, tạo Support Ticket kèm ảnh màn hình lỗi để Vendor hỗ trợ trực tiếp nhé!";
    }

    // ===== 8. CÀI ĐẶT / TẢI VỀ =====
    if (lower.includes('cài đặt') || lower.includes('tải') || lower.includes('download') || lower.includes('install') || lower.includes('setup') || lower.includes('cài') || lower.includes('tải về')) {
      if (lower.includes('cách') || lower.includes('hướng dẫn') || lower.includes('how')) {
        return "📥 Hướng dẫn cài đặt phần mềm:\n1️⃣ Vào Dashboard → 'Sản phẩm đã mua'\n2️⃣ Nhấn 'Tải xuống' bên cạnh sản phẩm\n3️⃣ Mở file tải về, chuột phải → 'Run as Administrator'\n4️⃣ Làm theo hướng dẫn cài đặt trên màn hình\n5️⃣ Nhập License Key khi được yêu cầu\n\nNếu bị antivirus chặn, thêm file vào whitelist (ngoại lệ) nhé!";
      }
      return "⚙️ Sau khi thanh toán, phần mềm sẽ có link tải trong mục 'Sản phẩm đã mua'. Khi cài đặt, hãy chạy file với quyền Administrator. Nếu bị chặn bởi antivirus, thêm vào danh sách ngoại lệ (whitelist).";
    }

    // ===== 9. HOÀN TIỀN / REFUND =====
    if (lower.includes('hoàn tiền') || lower.includes('refund') || lower.includes('trả tiền') || lower.includes('hoàn lại') || lower.includes('trả lại tiền')) {
      return "💰 Chính sách hoàn tiền TALLT:\n✅ Hoàn tiền khi: Lỗi hệ thống khiến trừ tiền nhưng không nhận Key, hoặc Key bị lỗi do server TALLT\n❌ Không hoàn khi: Máy không tương thích, đổi ý sau khi mua, hoặc đã sử dụng Key\n\n📋 Cách yêu cầu hoàn tiền: Tạo Ticket hỗ trợ → chọn 'Yêu cầu hoàn tiền' → kèm mã đơn hàng → Admin sẽ xem xét trong 3-5 ngày làm việc!";
    }

    // ===== 10. VNPAY / QR / NGÂN HÀNG =====
    if (lower.includes('vnpay') || lower.includes('qr') || lower.includes('ngân hàng') || lower.includes('chuyển khoản') || lower.includes('quét mã') || lower.includes('bank')) {
      return "💳 Thanh toán trên TALLT qua VNPay:\n1️⃣ Chọn sản phẩm → 'Thanh toán'\n2️⃣ Quét mã QR bằng app ngân hàng hoặc VNPay\n3️⃣ Xác nhận trên app ngân hàng\n4️⃣ Hệ thống xác nhận trong vài giây\n\n⚠️ Nếu đã trừ tiền nhưng chưa nhận Key sau 15 phút, tạo Ticket kèm mã đơn hàng nhé!";
    }

    // ===== 11. VIRUS / MÃ ĐỘC / BẢO MẬT =====
    if (lower.includes('mã độc') || lower.includes('virus') || lower.includes('malware') || lower.includes('độc hại') || lower.includes('bảo mật') || lower.includes('an toàn') || lower.includes('security') || lower.includes('trojan') || lower.includes('spyware')) {
      return "🛡️ Bảo mật trên TALLT Market:\n• Mọi phần mềm đều được quét virus tự động trước khi duyệt lên sàn\n• Admin kiểm duyệt thủ công trước khi phê duyệt\n• Hệ thống giám sát báo cáo từ người dùng\n\n🚨 Nếu phát hiện dấu hiệu mã độc (CPU/RAM tăng bất thường, pop-up lạ), hãy: Gỡ cài đặt ngay → Báo cáo cho Admin qua Ticket!";
    }

    // ===== 12. TÀI KHOẢN / ĐĂNG NHẬP / MẬT KHẨU =====
    if (lower.includes('tài khoản') || lower.includes('đăng nhập') || lower.includes('mật khẩu') || lower.includes('đăng ký') || lower.includes('login') || lower.includes('register') || lower.includes('sign up') || lower.includes('sign in') || lower.includes('profile') || lower.includes('hồ sơ')) {
      if (lower.includes('quên') || lower.includes('forgot') || lower.includes('reset')) {
        return "🔐 Quên mật khẩu?\n1️⃣ Nhấn 'Quên mật khẩu' trên trang đăng nhập\n2️⃣ Nhập email đã đăng ký\n3️⃣ Kiểm tra hộp thư (cả Spam) → nhấn link đặt lại\n4️⃣ Tạo mật khẩu mới (ít nhất 8 ký tự, gồm chữ hoa + số)\n\nNếu không nhận được email, liên hệ Admin qua Ticket hỗ trợ nhé!";
      }
      if (lower.includes('đổi') || lower.includes('cập nhật') || lower.includes('thay đổi') || lower.includes('chỉnh sửa')) {
        return "✏️ Để cập nhật thông tin tài khoản:\n1️⃣ Đăng nhập → vào 'Hồ sơ cá nhân'\n2️⃣ Chỉnh sửa: Tên, Số điện thoại, Avatar, v.v.\n3️⃣ Nhấn 'Lưu thay đổi'\n\nLưu ý: Email đăng ký không thể thay đổi. Nếu cần đổi email, liên hệ Admin!";
      }
      if (lower.includes('khóa') || lower.includes('bị khóa') || lower.includes('locked') || lower.includes('bị ban') || lower.includes('chặn')) {
        return "🔒 Tài khoản bị khóa có thể do: vi phạm điều khoản sử dụng, đăng nhập sai quá nhiều lần, hoặc phát hiện hoạt động bất thường. Vui lòng liên hệ Admin qua email hỗ trợ hoặc tạo Ticket (đăng nhập tài khoản khác) để được mở khóa!";
      }
      return "👤 Hướng dẫn tài khoản TALLT:\n📝 Đăng ký: Nhấn 'Đăng ký' → điền thông tin → xác thực email\n🔑 Đăng nhập: Nhập email + mật khẩu đã đăng ký\n🔐 Quên mật khẩu: Nhấn 'Quên mật khẩu' → reset qua email\n\nNếu gặp vấn đề, hãy cho tôi biết chi tiết hơn nhé!";
    }

    // ===== 13. VENDOR / BÁN HÀNG =====
    if (lower.includes('vendor') || lower.includes('bán hàng') || lower.includes('nhà cung cấp') || lower.includes('đăng bán') || lower.includes('người bán') || lower.includes('seller') || lower.includes('đăng sản phẩm')) {
      if (lower.includes('đăng ký') || lower.includes('trở thành') || lower.includes('register')) {
        return "🏪 Để trở thành Vendor trên TALLT:\n1️⃣ Vào trang 'Đăng ký Vendor'\n2️⃣ Điền thông tin doanh nghiệp/cá nhân\n3️⃣ Chờ Admin duyệt (1-3 ngày làm việc)\n4️⃣ Sau khi duyệt, đăng sản phẩm lên Marketplace\n\n⚠️ Lưu ý: Phần mềm bắt buộc phải tích hợp SDK TalltLicenseGuard để quản lý bản quyền!";
      }
      if (lower.includes('doanh thu') || lower.includes('thu nhập') || lower.includes('revenue') || lower.includes('tiền')) {
        return "💵 Vendor có thể xem doanh thu trong Dashboard Vendor:\n📊 Tổng doanh thu theo ngày/tháng/năm\n📈 Biểu đồ xu hướng bán hàng\n🏆 Top sản phẩm bán chạy nhất\n\nTALLT giữ lại phí hoa hồng theo chính sách nền tảng. Chi tiết xem trong 'Điều khoản Vendor'!";
      }
      return "🏪 Thông tin dành cho Vendor:\n• Đăng ký: Vào trang 'Đăng ký Vendor' → chờ Admin duyệt\n• Đăng sản phẩm: Dashboard → 'Thêm sản phẩm mới'\n• Quản lý: Xem doanh thu, đánh giá, và ticket hỗ trợ từ khách hàng\n• SDK: Tích hợp TalltLicenseGuard để quản lý License Key\n\nBạn cần hỗ trợ thêm về vấn đề gì?";
    }

    // ===== 14. TICKET / HỖ TRỢ =====
    if (lower.includes('ticket') || lower.includes('hỗ trợ') || lower.includes('support') || lower.includes('liên hệ') || lower.includes('contact') || lower.includes('khiếu nại') || lower.includes('phản hồi') || lower.includes('góp ý')) {
      return "📋 Hệ thống Ticket hỗ trợ TALLT:\n\n📝 Tạo Ticket: Dashboard → 'Tạo Ticket hỗ trợ' → chọn sản phẩm → mô tả vấn đề → gửi\n👀 Theo dõi: Vào 'Quản lý Ticket' để xem trạng thái (Mới / Đang xử lý / Đã giải quyết)\n⏱️ Thời gian: Vendor thường phản hồi trong 24-48 giờ\n\n💡 Mẹo: Mô tả chi tiết vấn đề kèm ảnh chụp màn hình sẽ giúp xử lý nhanh hơn!";
    }

    // ===== 15. ĐÁNH GIÁ / REVIEW / SAO =====  
    if (lower.includes('đánh giá') || lower.includes('review') || lower.includes('nhận xét') || lower.includes('rating') || lower.includes('sao') || lower.includes('feedback') || lower.includes('comment')) {
      return "⭐ Về đánh giá sản phẩm:\n• Bạn chỉ có thể đánh giá sản phẩm đã mua\n• Chọn số sao (1-5) và viết nhận xét\n• Đánh giá giúp cộng đồng và Vendor cải thiện chất lượng\n• Vendor có thể phản hồi đánh giá của bạn\n\nĐánh giá trung thực giúp TALLT Market ngày càng tốt hơn! 🙏";
    }

    // ===== 16. SẢN PHẨM / TÌM KIẾM / PHẦN MỀM =====
    if (lower.includes('sản phẩm') || lower.includes('tìm kiếm') || lower.includes('tìm') || lower.includes('phần mềm') || lower.includes('search') || lower.includes('marketplace') || lower.includes('danh mục') || lower.includes('category')) {
      return "🔍 Để tìm sản phẩm trên TALLT:\n• Dùng thanh tìm kiếm trên Marketplace\n• Lọc theo danh mục: Office, Design, Security, Dev Tools...\n• Sắp xếp theo: Phổ biến, Đánh giá cao, Mới nhất, Giá\n• Xem chi tiết: Mô tả, ảnh, đánh giá, yêu cầu hệ thống\n\nMỗi sản phẩm đều có thông tin chi tiết và đánh giá từ người dùng khác!";
    }

    // ===== 17. CẬP NHẬT / UPDATE =====
    if (lower.includes('cập nhật') || lower.includes('update') || lower.includes('phiên bản mới') || lower.includes('version') || lower.includes('nâng cấp') || lower.includes('upgrade')) {
      return "🔄 Về cập nhật phần mềm:\n• Vendor tự phát hành phiên bản mới trên Marketplace\n• Bạn sẽ nhận thông báo khi có bản cập nhật\n• Vào 'Sản phẩm đã mua' → nhấn 'Cập nhật' để tải bản mới\n• License Key vẫn giữ nguyên khi cập nhật\n\nNếu bản mới gặp lỗi, tạo Ticket để Vendor hỗ trợ nhé!";
    }

    // ===== 18. THIẾT BỊ / MÁY TÍNH / HỆ THỐNG =====
    if (lower.includes('thiết bị') || lower.includes('máy tính') || lower.includes('windows') || lower.includes('mac') || lower.includes('linux') || lower.includes('yêu cầu hệ thống') || lower.includes('cấu hình') || lower.includes('tương thích')) {
      return "💻 Về yêu cầu hệ thống:\n• Mỗi phần mềm có yêu cầu cấu hình riêng (CPU, RAM, OS)\n• Xem chi tiết tại trang sản phẩm → mục 'Yêu cầu hệ thống'\n• Hầu hết phần mềm hỗ trợ Windows 10/11\n• Một số có phiên bản macOS/Linux\n\n⚠️ Kiểm tra kỹ yêu cầu trước khi mua, vì không hoàn tiền do không tương thích thiết bị!";
    }

    // ===== 19. KHUYẾN MÃI / GIẢM GIÁ / COUPON =====
    if (lower.includes('khuyến mãi') || lower.includes('giảm giá') || lower.includes('coupon') || lower.includes('voucher') || lower.includes('mã giảm') || lower.includes('promotion') || lower.includes('sale') || lower.includes('discount')) {
      return "🎁 Về khuyến mãi trên TALLT:\n• Vendor có thể chạy chương trình giảm giá riêng\n• Theo dõi trang chủ Marketplace để cập nhật ưu đãi\n• Một số dịp lễ (Tết, Black Friday...) sẽ có chương trình giảm giá lớn\n• Hiện TALLT chưa hỗ trợ mã coupon/voucher\n\nHãy theo dõi Marketplace thường xuyên để không bỏ lỡ ưu đãi nhé! 🔥";
    }

    // ===== 20. QUYỀN RIÊNG TƯ / DỮ LIỆU CÁ NHÂN =====
    if (lower.includes('quyền riêng tư') || lower.includes('privacy') || lower.includes('dữ liệu cá nhân') || lower.includes('thông tin cá nhân') || lower.includes('data')) {
      return "🔒 Chính sách bảo mật TALLT:\n• Không chia sẻ thông tin cá nhân cho bên thứ ba\n• Dữ liệu thanh toán được mã hóa và xử lý qua VNPay\n• Bạn có quyền yêu cầu xóa tài khoản và dữ liệu\n• Chi tiết xem tại trang 'Chính sách bảo mật' ở footer\n\nNếu phát hiện rò rỉ thông tin, liên hệ Admin ngay qua Ticket!";
    }

    // ===== 21. ADMIN / QUẢN TRỊ =====
    if (lower.includes('admin') || lower.includes('quản trị') || lower.includes('quản lý')) {
      return "👨‍💼 Về Admin TALLT:\n• Admin quản lý toàn bộ hệ thống: duyệt sản phẩm, xử lý khiếu nại, quản lý người dùng\n• Liên hệ Admin: Tạo Ticket hỗ trợ hoặc gửi email\n• Thời gian phản hồi: 1-3 ngày làm việc\n\nNếu vấn đề khẩn cấp (bảo mật, thanh toán lỗi), hãy ghi rõ 'KHẨN CẤP' trong tiêu đề Ticket!";
    }

    // ===== 22. SDK / API / DEVELOPER =====
    if (lower.includes('sdk') || lower.includes('api') || lower.includes('developer') || lower.includes('lập trình') || lower.includes('tích hợp') || lower.includes('talltlicenseguard')) {
      return "👨‍💻 Dành cho Developer/Vendor:\n• TalltLicenseGuard SDK: Tích hợp vào phần mềm để quản lý License\n• Tài liệu API: Có tại trang 'Developer Docs' trong Dashboard Vendor\n• Hỗ trợ ngôn ngữ: Java, C#, Python, JavaScript\n• Sandbox: Môi trường test trước khi đăng bán\n\nCần hỗ trợ kỹ thuật? Tạo Ticket với danh mục 'Hỗ trợ Developer'!";
    }

    // ===== 23. ĐIỀU KHOẢN / CHÍNH SÁCH =====
    if (lower.includes('điều khoản') || lower.includes('chính sách') || lower.includes('terms') || lower.includes('policy') || lower.includes('quy định') || lower.includes('luật')) {
      return "📜 Các chính sách quan trọng của TALLT:\n• 📋 Điều khoản sử dụng: Quy định quyền và nghĩa vụ người dùng\n• 💰 Chính sách hoàn tiền: Điều kiện và quy trình hoàn tiền\n• 🔒 Chính sách bảo mật: Bảo vệ thông tin cá nhân\n• 🏪 Điều khoản Vendor: Quy định cho nhà cung cấp\n\nXem đầy đủ tại phần footer cuối trang web TALLT Market!";
    }

    // ===== 24. EMAIL / THÔNG BÁO =====
    if (lower.includes('email') || lower.includes('thông báo') || lower.includes('notification') || lower.includes('mail') || lower.includes('tin nhắn')) {
      return "📧 Hệ thống thông báo TALLT:\n• Email: Xác nhận đơn hàng, License Key, cập nhật sản phẩm\n• Dashboard: Thông báo in-app (ticket mới, phản hồi...)\n• Kiểm tra cả hộp thư Spam nếu không nhận được email\n\nĐể tắt/bật thông báo, vào 'Cài đặt tài khoản' → 'Thông báo'!";
    }

    // ===== 25. SO SÁNH / GỢI Ý SẢN PHẨM =====
    if (lower.includes('so sánh') || lower.includes('nên mua') || lower.includes('gợi ý') || lower.includes('tốt nhất') || lower.includes('recommend') || lower.includes('suggest') || lower.includes('khuyên') || lower.includes('nên dùng')) {
      return "🎯 Để chọn sản phẩm phù hợp:\n• Xem đánh giá từ người dùng khác (số sao + nhận xét)\n• So sánh tính năng giữa các sản phẩm cùng danh mục\n• Kiểm tra yêu cầu hệ thống trước khi mua\n• Ưu tiên sản phẩm có nhiều lượt bán và đánh giá cao\n\nTôi không thể gợi ý sản phẩm cụ thể, nhưng bạn có thể lọc 'Phổ biến nhất' trên Marketplace!";
    }

    // ===== 26. TALLT LÀ GÌ =====
    if (lower.includes('tallt là gì') || lower.includes('tallt market') || lower.includes('giới thiệu') || lower.includes('about') || lower.includes('nền tảng này') || lower.includes('marketplace là gì')) {
      return "🌐 TALLT Market là nền tảng mua bán phần mềm bản quyền trực tuyến:\n• 🛒 Marketplace: Hàng trăm phần mềm chất lượng từ các Vendor uy tín\n• 🔑 License Key: Hệ thống quản lý bản quyền tự động\n• 💳 Thanh toán: An toàn qua VNPay\n• 📋 Hỗ trợ: Hệ thống Ticket giữa Khách hàng và Vendor\n\nTALLT cam kết mang đến trải nghiệm mua phần mềm an toàn, tiện lợi!";
    }

    // ===== 27. THỜI GIAN / GIỜ PHỤC VỤ =====
    if (lower.includes('giờ làm việc') || lower.includes('mấy giờ') || lower.includes('phục vụ') || lower.includes('khi nào') || lower.includes('thời gian') || lower.includes('bao lâu')) {
      return "⏰ Thông tin hoạt động TALLT:\n• 🌐 Website: Hoạt động 24/7\n• 🤖 Trợ lý ảo: Luôn sẵn sàng hỗ trợ 24/7\n• 👨‍💼 Admin/Vendor: Phản hồi Ticket trong giờ hành chính (8:00 - 17:30, T2-T6)\n• ⏱️ Thời gian xử lý Ticket: 24-48 giờ làm việc\n\nNgoài giờ hành chính, bạn vẫn có thể tạo Ticket và sẽ được phản hồi vào ngày làm việc tiếp theo!";
    }

    // ===== 28. NGÔN NGỮ / LANGUAGE =====
    if (lower.includes('tiếng anh') || lower.includes('english') || lower.includes('ngôn ngữ') || lower.includes('language')) {
      return "🌍 Hiện tại TALLT Market hỗ trợ giao diện tiếng Việt là chính. Một số sản phẩm phần mềm có thể hỗ trợ đa ngôn ngữ tùy Vendor. Chúng tôi đang phát triển phiên bản tiếng Anh trong tương lai!";
    }

    // ===== 29. MOBILE / ỨNG DỤNG DI ĐỘNG =====
    if (lower.includes('điện thoại') || lower.includes('mobile') || lower.includes('app') || lower.includes('android') || lower.includes('ios') || lower.includes('iphone')) {
      return "📱 Hiện tại TALLT Market hoạt động chủ yếu trên trình duyệt web (responsive trên mobile). Chúng tôi chưa có ứng dụng riêng cho Android/iOS nhưng đang trong kế hoạch phát triển. Bạn có thể truy cập đầy đủ tính năng qua trình duyệt trên điện thoại!";
    }

    // ===== 30. VUI VẺ / HÀI HƯỚC =====
    if (lower.includes('haha') || lower.includes('vui') || lower.includes('buồn cười') || lower.includes('kể chuyện') || lower.includes('joke') || lower.includes('đùa')) {
      return pick([
        "😄 Haha, tôi là bot hỗ trợ nên không giỏi kể chuyện lắm. Nhưng tôi rất giỏi giải đáp thắc mắc về TALLT Market đó! Bạn thử hỏi tôi đi! 🤖",
        "😂 Tôi chỉ là trợ lý ảo thôi, nhưng nếu giúp bạn giải quyết được vấn đề thì đó mới là 'joke' hay nhất! Hỏi tôi gì đi nào! 🎉",
      ]);
    }

    // ===== 31. BẠN LÀ AI / BẠN TÊN GÌ =====
    if (lower.includes('bạn là ai') || lower.includes('tên gì') || lower.includes('who are you') || lower.includes('bạn là gì') || lower.includes('bot') || lower.includes('trợ lý')) {
      return "🤖 Tôi là Trợ Lý Ảo TALLT – chatbot hỗ trợ khách hàng tự động của TALLT Market! Tôi có thể giúp bạn:\n• 🛒 Hướng dẫn mua hàng & thanh toán\n• 🔑 Kích hoạt & quản lý License Key\n• 🐛 Xử lý lỗi phần mềm\n• 💰 Chính sách hoàn tiền\n• 📋 Tạo Ticket hỗ trợ\n\nHãy hỏi tôi bất cứ điều gì!";
    }

    // ===== 33. TRẢ GÓP / ĐĂNG KÝ (SUBSCRIPTION) =====
    if (lower.includes('trả góp') || lower.includes('thuê') || lower.includes('subscription') || lower.includes('đăng ký tháng') || lower.includes('trả theo tháng')) {
      return "📅 Tùy thuộc vào thiết lập của Vendor, phần mềm có thể bán dạng mua đứt 1 lần (Lifetime) hoặc thuê bao gia hạn theo tháng/năm. Hiện tại TALLT Market thanh toán trả thẳng, chưa hỗ trợ trả góp qua thẻ tín dụng nhé!";
    }

    // ===== 34. HÓA ĐƠN / VAT / INVOICE =====
    if (lower.includes('hóa đơn') || lower.includes('vat') || lower.includes('biên lai') || lower.includes('invoice') || lower.includes('xuất hóa đơn')) {
      return "🧾 Đối với yêu cầu xuất hóa đơn VAT, bạn vui lòng liên hệ trực tiếp với Vendor (Nhà cung cấp) của phần mềm đó qua hệ thống Ticket để họ phát hành hóa đơn đỏ cho bạn, vì TALLT chỉ đóng vai trò nền tảng trung gian.";
    }

    // ===== 35. SCAM / GIAN LẬN / BÁO CÁO XẤU =====
    if (lower.includes('lừa đảo') || lower.includes('báo cáo') || lower.includes('scam') || lower.includes('fake') || lower.includes('gian lận') || lower.includes('chứa virus') || lower.includes('report')) {
      return "🚨 TALLT rất nghiêm khắc với các hành vi gian lận. Nếu bạn phát hiện phần mềm có chứa mã độc, lừa đảo, hoặc Vendor không cung cấp dịch vụ như cam kết: Vui lòng Tạo Ticket → Chọn chủ đề 'Báo cáo vi phạm (Scam)' để Admin khóa ngay tài khoản Vendor đó!";
    }

    // ===== 36. MOMO / ZALOPAY / PAYPAL =====
    if (lower.includes('momo') || lower.includes('zalopay') || lower.includes('paypal') || lower.includes('mã thẻ') || lower.includes('visa') || lower.includes('mastercard')) {
      return "💳 Hiện tại hệ thống TALLT Market hỗ trợ phương thức thanh toán cổng VNPay (hỗ trợ quét mã QR qua ứng dụng ngân hàng và thẻ ATM nội địa). Các cổng khác như Momo, ZaloPay hoặc PayPal đang được tích hợp thêm trong tương lai.";
    }

    // ===== 37. CHẾ ĐỘ OFFLINE / KHÔNG CÓ MẠNG =====
    if (lower.includes('offline') || lower.includes('không có mạng') || lower.includes('không internet') || lower.includes('mất mạng') || lower.includes('cúp mạng')) {
      return "🌐 Phần mềm trên nền tảng TALLT yêu cầu xác thực License qua Server của chúng tôi (sử dụng SDK TalltLicenseGuard). Do đó, bạn cần có kết nối Internet ít nhất 1 lần khi mở ứng dụng để phần mềm check Key. Một số phần mềm có thể hoạt động offline sau khi đã xác thực tùy thuộc vào Vendor.";
    }

    // ===== 38. MUA SỈ / SỐ LƯỢNG LỚN =====
    if (lower.includes('mua nhiều') || lower.includes('mua sỉ') || lower.includes('số lượng lớn') || lower.includes('doanh nghiệp') || lower.includes('giá sỉ') || lower.includes('mua chung')) {
      return "🏢 Bạn muốn mua phần mềm với số lượng lớn cho công ty/doanh nghiệp? Hãy tạo Ticket để nhắn tin trực tiếp với Vendor và xin mã giảm giá (Discount Coupon) cấu hình riêng cho doanh nghiệp của bạn nhé!";
    }

    // ===== 39. TẶNG QUÀ / CHUYỂN NHƯỢNG =====
    if (lower.includes('tặng quà') || lower.includes('tặng') || lower.includes('gift') || lower.includes('gửi cho bạn') || lower.includes('chuyển nhượng')) {
      return "🎁 TALLT hiện chưa ra mắt tính năng 'Mua tặng quà' (Gift). Tuy nhiên, bạn có thể mua bình thường, sau đó sao chép (copy) đoạn License Key đó gửi cho bạn bè để họ dán vào ứng dụng là được nhé!";
    }

    // ===== 40. HỢP TÁC / ĐỐI TÁC =====
    if (lower.includes('hợp tác') || lower.includes('đối tác') || lower.includes('partnership') || lower.includes('affiliate') || lower.includes('tiếp thị liên kết')) {
      return "🤝 Rất cảm ơn bạn đã quan tâm đến việc hợp tác cùng TALLT! Nếu bạn muốn đề xuất hợp tác Vendor lớn, hoặc chương trình Affiliate, vui lòng gửi email về `partner@tallt-market.com` để đội ngũ phát triển liên hệ lại nhé.";
    }

    // ===== 41. QUẢNG CÁO / ADS =====
    if (lower.includes('quảng cáo') || lower.includes('ads') || lower.includes('chèn quảng cáo') || lower.includes('ẩn quảng cáo')) {
      return "🚫 Platform TALLT Market đặc biệt nói KHÔNG với việc chèn quảng cáo vào góc màn hình người dùng. Các ứng dụng bán trên sàn cũng được yêu cầu không lạm dụng quảng cáo gây gián đoạn trải nghiệm của khách hàng.";
    }

    // ===== 42. MÃ NGUỒN MỞ / OPEN SOURCE =====
    if (lower.includes('mã nguồn mở') || lower.includes('open source') || lower.includes('mã nguồn') || lower.includes('code') || lower.includes('source code')) {
      return "📜 Đa số sản phẩm trên TALLT là phần mềm đã biên dịch nguyên bản (Compiled). Tuy nhiên, một số Vendor có cung cấp gói mua kèm mã nguồn mở (có giá trị cao hơn). Bạn hãy kiểm tra kỹ mô tả sản phẩm và EULA (thỏa thuận người dùng) nhé!";
    }

    // ===== 43. MÀN HÌNH XANH / DEAD / BSOD =====
    if (lower.includes('màn hình xanh') || lower.includes('bsod') || lower.includes('chết máy') || lower.includes('đứng máy') || lower.includes('khởi động lại máy')) {
      return "⚠️ Ops! Màn hình xanh (BSOD) thường xuất phát từ xung đột hệ điều hành (Driver) với tính năng cấp thấp của ứng dụng. Hãy tạo Ticket GẤP cho Vendor, kèm theo file ảnh chụp bằng điện thoại lỗi mã màn hình xanh để họ ra bản Patch bảo trì sớm nhất!";
    }

    // ===== 44.CỘNG ĐỒNG / FORUM / GROUP =====
    if (lower.includes('cộng đồng') || lower.includes('group') || lower.includes('nhóm') || lower.includes('forum') || lower.includes('diễn đàn') || lower.includes('discord') || lower.includes('facebook')) {
      return "🌐 TALLT có một cộng đồng hỗ trợ sôi nổi trên Discord và Nhóm Facebook dành cho cả Vendor lẫn Customer để thảo luận về phần mềm. Bạn kéo xuống thanh Footer (Dưới đáy trang web) để lấy link tham gia nhé!";
    }

    // ===== 45. CRACK / BẢN LẬU =====
    if (lower.includes('crack') || lower.includes('bản lậu') || lower.includes('bypass') || lower.includes('hack') || lower.includes('cheat')) {
      return "🛑 VI PHẠM: TALLT Market không cung cấp, không dung túng và quét sạch mã độc/phần mềm crack! Xin vui lòng mua bản quyền chính hãng để tôn trọng mồ hôi công sức của giới lập trình (Developer) cũng như bảo vệ máy tính của bạn khỏi mã độc tống tiền nhé.";
    }

    // ===== 46. TUYỂN DỤNG / JOB / VIỆC LÀM =====
    if (lower.includes('tuyển dụng') || lower.includes('việc làm') || lower.includes('job') || lower.includes('hr') || lower.includes('ứng tuyển') || lower.includes('join us')) {
      return "💼 TALLT luôn mở rộng cửa đón nhân tài IT chuyên môn cao (Backend Java, Frontend React, DevOps). Hãy theo dõi mục Career tại website chính thức công ty, hoặc gửi CV thẳng tới `hr@tallt-market.com` nhé!";
    }

    // ===== 47. LƯU TRỮ CLOUD / THẤT LẠC DỮ LIỆU =====
    if (lower.includes('đám mây') || lower.includes('cloud') || lower.includes('lưu trữ') || lower.includes('mất dữ liệu') || lower.includes('backup') || lower.includes('sao lưu')) {
      return "☁️ Đối với lưu trữ phần mềm: TALLT lưu trữ App Build an toàn qua Cloudinary/Server Backend. Đối với dữ liệu cá nhân bên trong phần mềm của bạn: Nó thuộc về Cloud/Local của Vendor phần mềm đó. TALLT không lưu trữ dữ liệu sinh ra từ App của bên thứ 3.";
    }

    // ===== 48. EVENT / LỄ HỘI / TẾT =====
    if (lower.includes('event') || lower.includes('sự kiện') || lower.includes('lễ hội') || lower.includes('tết') || lower.includes('black friday') || lower.includes('giáng sinh')) {
      return "🎉 Vào các dịp Lễ, Tết hoặc Black Friday, TALLT thường tổ chức các sự kiện hoàn tiền siêu khủng hoặc Flash Sale đồng giá toàn bộ sàn. Đừng quên đăng ký nhận bản tin qua Email để không bỏ lỡ đợt Sale nào nhé!";
    }

    // ===== 49. SAO KÊ / THUẾ / KẾ TOÁN =====
    if (lower.includes('sao kê') || lower.includes('thuế') || lower.includes('kế toán') || lower.includes('tài lộc') || lower.includes('đối soát')) {
      return "📊 Dành riêng cho Vendor: Hệ thống cung cấp Bảng kê giao dịch chi tiết từng miligiây. Vào mục Dashboard Analytics -> Kéo xuống Bảng kê -> Bấm Nút Xuất ZIP để tải file CSV & PDF đối soát với kế toán minh bạch 100%.";
    }

    // ===== 50. GÓP Ý TRỰC TIẾP CHO TALLT =====
    if (lower.includes('góp ý') || lower.includes('idea') || lower.includes('đề xuất') || lower.includes('ngu') || lower.includes('kém') || lower.includes('chậm') || lower.includes('khen')) {
      return "💌 Nếu hệ thống TALLT có bất kỳ tính năng nào chưa tốt (lag, chậm, UX/UI bất tiện...), xin đừng chần chừ mà hãy Email cho chúng tôi hoặc nhắn tin vào Chat box này kèm chữ 'GÓP Ý:'. Đội ngũ phát triển luôn túc trực để lắng nghe và tối ưu hệ thống hoàn hảo hơn!";
    }

    // ===== 51. CÂU HỎI THÔNG THƯỜNG (catch-all) =====
    return pick([
      "🤔 Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể thử hỏi về:\n• 🛒 Mua hàng / Thanh toán\n• 🔑 Kích hoạt License Key\n• 🐛 Lỗi phần mềm\n• 💰 Hoàn tiền\n• 📋 Tạo Ticket hỗ trợ\n• 👤 Tài khoản / Đăng ký\n\nHoặc tạo Ticket hỗ trợ để được tư vấn chi tiết hơn!",
      "🤖 Hmm, tôi chưa có câu trả lời cho câu hỏi này. Bạn hãy thử diễn đạt lại hoặc hỏi về các chủ đề: mua hàng, license, lỗi phần mềm, hoàn tiền, tài khoản. Hoặc tạo Ticket để nhân viên hỗ trợ trực tiếp nhé!",
      "💬 Câu hỏi thú vị! Nhưng tôi chỉ có thể hỗ trợ về các vấn đề liên quan đến TALLT Market. Hãy thử hỏi về: mua hàng, kích hoạt key, lỗi cài đặt, hoàn tiền, hoặc tạo Ticket hỗ trợ để nhân viên giúp bạn!",
    ]);
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
