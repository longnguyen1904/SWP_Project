import React, { useEffect, useState } from "react";
import "../Style/PolicyPage.css";

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
    window.scrollTo(0, 0);
    const updateAuth = () => setRole(getRole());
    window.addEventListener("authChanged", updateAuth);
    return () => window.removeEventListener("authChanged", updateAuth);
  }, []);

  const isVendor = role === "VENDOR";

  return (
    <div className="policy-container">
      <div className="policy-header">
        <h1>{isVendor ? "Chính Sách Nhà Bán Hàng" : "Quy Định Khách Hàng"}</h1>
        <p style={{ color: "#bbbbbb", fontSize: "16px" }}>
          {isVendor ? "Cẩm nang hướng dẫn bán Dapp và tích hợp SDK an toàn." : "Cẩm nang hướng dẫn thanh toán và sử dụng phần mềm an toàn."}
        </p>
      </div>

      <div className="policy-content">
        {isVendor ? (
          <>
            <section className="policy-section">
              <h3><span>1</span> Chính Sách Đăng Bán Sản Phẩm (Dapp)</h3>
              <p>📍 Các sản phẩm phần mềm (Dapp) được phép đăng bán trên hệ thống phải là phần mềm hợp pháp, hữu ích và tuyệt đối không chứa mã độc (malware/virus/trojan).</p>
              <p>📍 Vendor có trách nhiệm cập nhật thông tin giới thiệu, hình ảnh, tài liệu kỹ thuật chi tiết rõ ràng. Ban Quản Trị có quyền yêu cầu nộp tài liệu chứng minh nguồn gốc hoặc mã nguồn kiểm duyệt (nếu có dấu hiệu khả nghi) trước khi sản phẩm được "Public" hiển thị lên Sàn Giao Dịch.</p>
              <p>📍 Các giao dịch bán hàng thành công sẽ bị tính chiết khấu phí nền tảng theo hợp đồng điện tử đã ký kết giữa TALLT Market và Vendor.</p>
            </section>

            <section className="policy-section">
              <h3><span>2</span> Quy Định Bắt Buộc Tích Hợp SDK <code>TalltLicenseGuard</code></h3>
              <p>📍 Để duy trì tính công bằng thu nhập và bảo vệ bản quyền tài sản trí tuệ của Vendor, mọi phần mềm (Dapp) đăng bán trên sàn <b>BẮT BUỘC</b> phải tích hợp bộ thư viện kiểm tra Cấp Phép Bản Quyền <code>TalltLicenseGuard</code> của TALLT Market.</p>
              <p style={{ color: "#ff4d4d" }}>⚠️ Nếu phần mềm đăng bán cố tình gỡ bỏ tính năng hoặc không có màn hình yêu cầu khách hàng nhập hợp lệ `License Key` do TALLT cấp phát sau khi thanh toán, sản phẩm sẽ bị gỡ bỏ ngay lập tức và Vendor có thể bị cấm vĩnh viễn.</p>
            </section>

            <section className="policy-section">
              <h3><span>3</span> Hướng Dẫn Kỹ Thuật: Import File <code>.jar</code></h3>
              <p>Để tích hợp hàng rào bảo vệ <code>TalltLicenseGuard</code>, vui lòng tải file <code>.jar</code> SDK do Đại diện TALLT cung cấp. Thêm thư viện này vào cấu hình build của dự án (ví dụ: IntelliJ Libs hoặc Maven POM). Dưới đây là đoạn code mẫu Java siêu nhỏ gọn giúp bạn ép Khách Hàng phải xác thực qua Server mới được dùng phần mềm:</p>
              <pre className="policy-code">
<span className="policy-code-keyword">import</span> com.tallt.sdk.TalltLicenseGuard;

<span className="policy-code-keyword">public class</span> MainApp {"{"}
    <span className="policy-code-keyword">public static void</span> main(String[] args) {"{"}
        <span className="policy-code-comment">// 1. Khởi tạo Guard với Mã Sản Phẩm của ứng dụng bạn (Lấy trên Web)</span>
        TalltLicenseGuard guard = <span className="policy-code-keyword">new</span> TalltLicenseGuard(<span className="policy-code-string">"VD: SP001"</span>);

        <span className="policy-code-comment">// 2. Chặn khởi chạy phần mềm, bắt buộc nhập Key Kích Hoạt</span>
        guard.requireLicenseToLaunch(() -{">"} {"{"}
            <span className="policy-code-comment">// 3. Nếu Key đúng Server trả về Hợp lệ, thân hàm này mới được chạy!</span>
            System.out.println(<span className="policy-code-string">"Bản quyền hợp lệ! Bắt đầu mở App chính..."</span>);
            CuaSoChinhCuaBan.hienThiLen(); 
        {"}"});
    {"}"}
{"}"}
              </pre>
            </section>
          </>
        ) : (
          <>
            <section className="policy-section">
              <h3><span>1</span> Chính Sách Mua Hàng & Thanh Toán</h3>
              <p>✅ Quý khách hàng cần đăng ký và đăng nhập tài khoản một cách minh bạch để thực hiện giao dịch mua phần mềm.</p>
              <p>✅ Mọi giao dịch thông qua cổng thanh toán mã QR (VNPay) đều được mã hóa bảo vệ an toàn cao nhất. TALLT Market chỉ chấp nhận hoàn tiền trong trường hợp lỗi mạng hệ thống phát sinh hoặc Key cấp phát bị lỗi do máy chủ xác thực của chúng tôi hỏng hóc gây cản trở trải nghiệm.</p>
            </section>

            <section className="policy-section">
              <h3><span>2</span> Quy Định Về Sử Dụng License Key</h3>
              <p>✅ <b>Bảo mật License:</b> License Key cấp ra là chuỗi mã định danh cá nhân độc quyền cho từng đơn hàng. Quý khách vui lòng lưu trữ cẩn thận.</p>
              <p>✅ <b>Giới hạn thiết bị:</b> Tùy thuộc vào Bậc Gói (Tier) quý khách đã chọn mua, License có thể bị giới hạn số máy tính (Max Devices) được phép hoạt động cùng lúc. Khi đăng nhập vào PC thứ 2 vượt quá hạn mức, thiết bị thứ 1 sẽ bị "đá" đăng xuất tự động để đảm bảo môi trường 1 Key / 1 Máy (nếu Tier là 1).</p>
              <p style={{ color: "#ff4d4d", fontWeight: "bold" }}>🚫 Nghiêm cấm chia sẻ tản mác: Nghiêm cấm tuyệt đối mọi hành vi chia sẻ mượn, phát tán License Key công khai trên Internet. Các thuật toán của Server sẽ ghi nhận sự nhảy vọt IP. Vi phạm lạm dụng sẽ dẫn tới việc Key bị khóa vĩnh viễn không từ chối hoàn tiền.</p>
            </section>

            <section className="policy-section">
              <h3><span>3</span> Cam Kết Sử Dụng Nền Tảng Hợp Lệ</h3>
              <p>✅ Người dùng sử dụng các Sản phẩm Dapp được tải về với mục đích tối ưu công việc hợp pháp và không xâm phạm bản quyền.</p>
              <p>✅ Người dùng cam kết không sử dụng bất kỳ công cụ thứ ba (Hex Editor, Memory Injector) nào nhằm mục đích dịch ngược (Decompile), bẻ khóa (Crack) hoặc cố tình chọc phá vào thư viện hệ thống xác thực <code>TalltLicenseGuard</code>.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
