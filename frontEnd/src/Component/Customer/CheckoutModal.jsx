import React, { useState } from "react";
import { customerAPI } from "../../services/api";
import { unwrapResponse, getApiErrorMessage } from "../../services/apiHelpers";
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
      setCouponApplied(unwrapResponse(res));
    } catch (err) {
      setCouponError(getApiErrorMessage(err, "Invalid coupon code"));
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
      const data = unwrapResponse(res);

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setError("Unable to create payment link. Please try again.");
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal__header">
          <h2 className="checkout-modal__title">Confirm Purchase</h2>
          <p className="checkout-modal__subtitle">
            Please review the product details before proceeding to payment
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
            <p className="checkout-modal__tier-name">Tier: {tierName}</p>
            <p className="checkout-modal__price">Price: {formatPrice(price)}</p>
            <p className="checkout-modal__quantity">Quantity: 1</p>
            <p className="checkout-modal__delivery">Delivery: License Key</p>
          </div>
        </div>

        <div className="checkout-modal__coupon">
          <label className="checkout-modal__coupon-label">Coupon Code</label>
          <div className="checkout-modal__coupon-input-row">
            <input
              type="text"
              className="checkout-modal__coupon-input"
              placeholder="Enter coupon code..."
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
                Remove
              </button>
            ) : (
              <button
                className="btn btn--primary checkout-modal__coupon-btn"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                type="button"
              >
                {couponLoading ? "..." : "Apply"}
              </button>
            )}
          </div>
          {couponError && <p className="checkout-modal__coupon-error">{couponError}</p>}
          {couponApplied && (
            <p className="checkout-modal__coupon-success">
              ✅ {couponApplied.discountPercent}% off — You save {formatPrice(discountAmount)}
            </p>
          )}
        </div>

        <div className="checkout-modal__total">
          <span>Total Amount</span>
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
            Close
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
