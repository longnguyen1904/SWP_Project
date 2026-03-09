/**
 * PaymentResult — Trang hiển thị kết quả thanh toán VNPay.
 * Đọc query params: ?status=success|failed&orderId=...
 */
import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../Style/Payment.css";
import axios from "axios";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");

  const isSuccess = status === "success";
  useEffect(() => {

  if (isSuccess && orderId) {

    axios.post(`http://localhost:8081/api/payment/success/${orderId}`)
      .then(() => console.log("License created"))
      .catch(err => console.error(err));

  }

}, [isSuccess, orderId]);
  return (
    <div className="payment-result">
      <div className="payment-result__card">
        {/* Icon */}
        <div className="payment-result__icon">
          {isSuccess ? "✅" : "❌"}
        </div> 

        {/* Title */}
        <h1 className="payment-result__title">
          {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
        </h1>                     

        {/* Message */}                      
        <p className="payment-result__message">
          {isSuccess
            ? "Đơn hàng của bạn đã được xử lý. License Key sẽ được gửi qua email."
            : "Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ."}
        </p>

        {/* Order ID */}
        {orderId && (
          <p className="payment-result__order-id">
            Mã đơn hàng: <strong>#{orderId}</strong>
          </p>
        )}

        {/* Actions */}
        <div className="payment-result__actions">
          <Link to="/marketplace" className="btn btn--outline">
            Về Marketplace
          </Link>
          {isSuccess && (
            <Link to="/Page/Customer/PurchasedProducts" className="btn btn--primary">
              Xem sản phẩm đã mua
            </Link>
          )}                
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;   
