import React, { useState } from "react";
import { customerAPI } from "../../services/api";
import { unwrapResponse } from "../../services/apiHelpers";
import { formatPrice, getProductImageUrl } from "../../services/formatters";
import "../../Style/Payment.css";

const CheckoutModal = ({ product, selectedTier, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  if (!product || !selectedTier) return null;

  const tierId = selectedTier.tierId;
  const tierName = selectedTier.tierName;
  const price = selectedTier.price;
  const productId = product.id ?? product.productId;

  const discountAmount = couponApplied
    ? (price * couponApplied.discountPercent) / 100
    : 0;
  const finalPrice = Math.max(price - discountAmount, 0);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponApplied(null);
    try {
      const res = await customerAPI.validateCoupon(couponCode.trim(), productId);
      const data = unwrapResponse(res) ?? res.data;
      setCouponApplied(data);
    } catch (err) {
      const raw = err?.response?.data;
      const msg = typeof raw === "string" ? raw : (raw?.message ?? "Mã coupon không hợp lệ");
      setCouponError(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await customerAPI.createCheckout({
        productId: productId,
        tierId: tierId,
        couponCode: couponApplied ? couponCode.trim() : null,
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

        <div className="checkout-modal__coupon">
          <label className="checkout-modal__coupon-label">Mã giảm giá</label>
          <div className="checkout-modal__coupon-input-row">
            <input
              type="text"
              className="checkout-modal__coupon-input"
              placeholder="Nhập mã coupon..."
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!couponApplied || couponLoading}
            />
            {couponApplied ? (
              <button
                className="btn btn--outline checkout-modal__coupon-btn"
                onClick={handleRemoveCoupon}
                type="button"
              >
                Hủy
              </button>
            ) : (
              <button
                className="btn btn--primary checkout-modal__coupon-btn"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                type="button"
              >
                {couponLoading ? "..." : "Áp dụng"}
              </button>
            )}
          </div>
          {couponError && <p className="checkout-modal__coupon-error">{couponError}</p>}
          {couponApplied && (
            <p className="checkout-modal__coupon-success">
              ✅ Giảm {couponApplied.discountPercent}% — Tiết kiệm {formatPrice(discountAmount)}
            </p>
          )}
        </div>

        <div className="checkout-modal__total">
          <span>Số tiền cần thanh toán</span>
          <span className="checkout-modal__total-amount">
            {couponApplied && (
              <span className="checkout-modal__original-price">{formatPrice(price)}</span>
            )}
            {formatPrice(finalPrice)}
          </span>
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
