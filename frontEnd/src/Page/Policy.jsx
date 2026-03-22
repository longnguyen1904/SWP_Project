import React, { useEffect, useState } from "react";
// import "../Style/Events_Traditions.css"; // Not strictly necessary unless it has global styles

function getRole() {
  const role = localStorage.getItem("role");
  if (role) return role.toUpperCase().replace("ROLE_", "");
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const r = user.roleName || user.role;
    return r ? String(r).toUpperCase().replace("ROLE_", "") : null;
  } catch {
    return null;
  }
}

export default function Policy() {
  const [role, setRole] = useState(getRole());

  useEffect(() => {
    const updateAuth = () => setRole(getRole());
    window.addEventListener("authChanged", updateAuth);
    return () => window.removeEventListener("authChanged", updateAuth);
  }, []);

  const isVendor = role === "VENDOR";

  return (
    <div style={{ padding: "40px", minHeight: "100vh", background: "linear-gradient(135deg,#1e1e2f,#2c2c3a)", color: "white" }}>
      <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "2.5rem", color: "#ff7a18" }}>
        {isVendor ? "Chính Sách & Hướng Dẫn Bán Hàng (Dành cho Vendor)" : "Chính Sách Mua Hàng & Sử Dụng (Dành cho Khách Hàng)"}
      </h2>

      <div style={{ maxWidth: "800px", margin: "0 auto", background: "rgba(255,255,255,0.05)", padding: "40px", borderRadius: "10px", backdropFilter: "blur(8px)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)" }}>
        
        {isVendor ? (
          <>
            <section style={{ marginBottom: "35px" }}>
              <h3 style={{ color: "#4caf50", borderBottom: "1px solid #4caf50", paddingBottom: "10px", marginBottom: "15px" }}>1. Chính Sách Đăng Bán Sản Phẩm (Dapp)</h3>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>📍 Các sản phẩm phần mềm (Dapp) được phép đăng bán trên hệ thống phải là phần mềm hợp pháp, hữu ích và tuyệt đối không chứa mã độc (malware/virus/trojan).</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>📍 Vendor có trách nhiệm cập nhật thông tin giới thiệu, hình ảnh, tài liệu kỹ thuật chi tiết rõ ràng. Ban Quản Trị có quyền yêu cầu nộp tài liệu chứng minh nguồn gốc hoặc mã nguồn kiểm duyệt (nếu có dấu hiệu khả nghi) trước khi sản phẩm được "Public" hiển thị lên Sàn Giao Dịch.</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>📍 Các giao dịch bán hàng thành công sẽ bị tính chiết khấu phí nền tảng theo hợp đồng điện tử đã ký kết giữa TALLT Market và Vendor.</p>
            </section>

            <section style={{ marginBottom: "35px" }}>
              <h3 style={{ color: "#4caf50", borderBottom: "1px solid #4caf50", paddingBottom: "10px", marginBottom: "15px" }}>2. Quy Định Bắt Buộc Tích Hợp SDK <code>TalltLicenseGuard</code></h3>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>📍 Để duy trì tính công bằng thu nhập và bảo vệ bản quyền tài sản trí tuệ của Vendor, mọi phần mềm (Dapp) đăng bán trên sàn <b>BẮT BUỘC</b> phải tích hợp bộ thư viện kiểm tra Cấp Phép Bản Quyền <code>TalltLicenseGuard</code> của TALLT Market.</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px", color: "#ff9800" }}>⚠️ Nếu phần mềm đăng bán cố tình gỡ bỏ tính năng hoặc không có màn hình yêu cầu khách hàng nhập hợp lệ `License Key` do TALLT cấp phát sau khi thanh toán, sản phẩm sẽ bị gỡ bỏ ngay lập tức và Vendor có thể bị cấm vĩnh viễn.</p>
            </section>

            <section>
              <h3 style={{ color: "#4caf50", borderBottom: "1px solid #4caf50", paddingBottom: "10px", marginBottom: "15px" }}>3. Hướng Dẫn Kỹ Thuật: Import File <code>.jar</code></h3>
              <p style={{ lineHeight: "1.6", marginBottom: "15px" }}>Để tích hợp hàng rào bảo vệ `TalltLicenseGuard`, vui lòng tải file `.jar` SDK do Đại diện TALLT cung cấp. Thêm thư viện này vào cấu hình build của dự án (ví dụ: IntelliJ Libs hoặc Maven POM). Dưới đây là đoạn code mẫu Java siêu nhỏ gọn giúp bạn ép Khách Hàng phải xác thực qua Server mới được dùng phần mềm:</p>
              <pre style={{ background: "#222", padding: "18px", borderRadius: "8px", color: "#4caf50", overflowX: "auto", fontFamily: "monospace", fontSize: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
{`// Ở trong hàm main() của phần mềm Vendor:
import com.tallt.sdk.TalltLicenseGuard;

public static void main(String[] args) {
    // 1. Khởi tạo Guard với Mã Sản Phẩm của ứng dụng bạn (Lấy trên Web)
    TalltLicenseGuard guard = new TalltLicenseGuard("VD: SP001");

    // 2. Chặn khởi chạy phần mềm, bắt buộc nhập Key Kích Hoạt
    guard.requireLicenseToLaunch(() -> {
        
        // 3. Nếu Key đúng Server trả về Hợp lệ, thân hàm này mới được chạy!
        System.out.println("Bản quyền hợp lệ! Bắt đầu mở App chính...");
        CuaSoChinhCuaBan.hienThiLen(); 
        
    });
}`}
              </pre>
            </section>
          </>
        ) : (
          <>
            <section style={{ marginBottom: "35px" }}>
              <h3 style={{ color: "#03a9f4", borderBottom: "1px solid #03a9f4", paddingBottom: "10px", marginBottom: "15px" }}>1. Chính Sách Mua Hàng & Thanh Toán</h3>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>✅ Quý khách hàng/Khách vãng lai cần đăng ký và đăng nhập tài khoản một cách minh bạch để thực hiện giao dịch mua phần mềm.</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>✅ Mọi giao dịch thông qua cổng thanh toán mã QR (VNPay) đều được mã hóa bảo vệ an toàn cao nhất. TALLT Market chỉ chấp nhận hoàn tiền trong trường hợp lỗi mạng hệ thống phát sinh hoặc Key cấp phát bị lỗi do máy chủ xác thực của chúng tôi hỏng hóc gây cản trở trải nghiệm.</p>
            </section>

            <section style={{ marginBottom: "35px" }}>
              <h3 style={{ color: "#03a9f4", borderBottom: "1px solid #03a9f4", paddingBottom: "10px", marginBottom: "15px" }}>2. Quy Định Về Sử Dụng License Key</h3>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>✅ <b>Bảo mật License:</b> License Key cấp ra là chuỗi mã định danh cá nhân độc quyền cho từng đơn hàng. Quý khách vui lòng lưu trữ cẩn thận.</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>✅ <b>Giới hạn thiết bị:</b> Tùy thuộc vào Bậc Gói (Tier) quý khách đã chọn mua, License có thể bị giới hạn số máy tính (Max Devices) được phép hoạt động cùng lúc. Khi đăng nhập vào PC thứ 2 vượt quá hạn mức, thiết bị thứ 1 sẽ bị "đá" đăng xuất tự động để đảm bảo môi trường 1 Key / 1 Máy (nếu Tier là 1).</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px", color: "#e91e63" }}>✅ <b>Nghiêm cấm chia sẻ tản mác:</b> Nghiêm cấm tuyệt đối mọi hành vi chia sẻ mượn, phát tán License Key công khai trên Internet. Các thuật toán của Server sẽ ghi nhận sự nhảy vọt IP. Vi phạm lạm dụng sẽ dẫn tới việc Key bị khóa vĩnh viễn không từ chối hoàn tiền.</p>
            </section>

            <section>
              <h3 style={{ color: "#03a9f4", borderBottom: "1px solid #03a9f4", paddingBottom: "10px", marginBottom: "15px" }}>3. Cam Kết Sử Dụng Nền Tảng Hợp Lệ</h3>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>✅ Người dùng sử dụng các Sản phẩm Dapp được tải về với mục đích tối ưu công việc của pháp luật dân sự và không xâm phạm bản quyền.</p>
              <p style={{ lineHeight: "1.6", marginBottom: "8px" }}>✅ Người dùng cam kết không sử dụng bất kỳ công cụ thứ ba (Hex Editor, Memory Injector) nào nhằm mục đích dịch ngược (Decompile), bẻ khóa (Crack) hoặc cố tình chọc phá vào thư viện hệ thống xác thực `TalltLicenseGuard`.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
