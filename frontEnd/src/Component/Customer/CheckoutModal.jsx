import React, { useState } from "react";
import { customerAPI } from "../../services/api";
import { unwrapResponse } from "../../services/apiHelpers";
import { formatPrice, getProductImageUrl } from "../../services/formatters";
import "../../Style/Payment.css";

const CheckoutModal = ({ product, selectedTier, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!product || !selectedTier) return null;

  const tierId = selectedTier.tierId;
  const tierName = selectedTier.tierName;
  const price = selectedTier.price;
  const productId = product.id ?? product.productId;

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await customerAPI.createCheckout({
        productId: productId,
        tierId: tierId,
      });
      const data = unwrapResponse(res) ?? res.data;

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError("Không thể tạo link thanh toán. Vui lòng thử lại.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data
        ?? "Có lỗi xảy ra. Vui lòng thử lại.";
      setError(typeof msg === "string" ? msg : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal__header">
          <h2 className="checkout-modal__title">Xác nhận mua hàng</h2>
          <p className="checkout-modal__subtitle">
            Vui lòng kiểm tra thông tin sản phẩm trước khi thanh toán
          </p>
        </div>

        <div className="checkout-modal__product">
          <img
            className="checkout-modal__image"
            src={getProductImageUrl(product)}
            alt={product.name}
            onError={(e) => { e.target.src = "/placeholder-product.png"; }}
          />
          <div className="checkout-modal__details">
            <h3 className="checkout-modal__product-name">{product.name}</h3>
            <p className="checkout-modal__tier-name">Gói: {tierName}</p>
            <p className="checkout-modal__price">Giá: {formatPrice(price)}</p>
            <p className="checkout-modal__quantity">Số lượng: 1</p>
            <p className="checkout-modal__delivery">Giao hàng: License Key</p>
          </div>
        </div>

        <div className="checkout-modal__total">
          <span>Số tiền cần thanh toán</span>
          <span className="checkout-modal__total-amount">{formatPrice(price)}</span>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="checkout-modal__actions">
          <button
            className="btn btn--outline"
            onClick={onClose}
            disabled={loading}
          >
            Đóng
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Xác nhận mua hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
