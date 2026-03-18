import React, { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ProductImageGallery from "../Component/Customer/ProductImageGallery";
import ProductInfoSection from "../Component/Customer/ProductInfoSection";
import ReviewSection from "../Component/Customer/ReviewSection";
import RelatedProducts from "../Component/Customer/RelatedProducts";
import CheckoutModal from "../Component/Customer/CheckoutModal";
import WishlistButton from "../Component/Customer/WishlistButton";
import { saveRecentlyViewed } from "../Component/Customer/RecentlyViewed";
import useProductDetail from "../services/useProductDetail";
import "../Style/Marketplace.css";
import "../Style/Wishlist.css";

const ProductDetail = () => {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentFailed, setPaymentFailed] = useState(false);

  useEffect(() => {
    if (searchParams.get("paymentFailed") === "true") {
      setPaymentFailed(true);
      searchParams.delete("paymentFailed");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const {
    product,
    reviews,
    relatedProducts,
    loading,
    error,
    hasPurchased,
    role,
    isAdmin,
    isVendor,
    showBuyButton,
    refetchReviewsAndProduct,
  } = useProductDetail(productId);

  useEffect(() => {
    if (product) saveRecentlyViewed(product);
  }, [product]);

  const handleBuyNow = (tier) => {
    setSelectedTier(tier);
    setShowCheckoutModal(true);
  };

  const handleCloseModal = () => {
    setShowCheckoutModal(false);
    setSelectedTier(null);
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
        <div className="alert alert--error">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
        <div className="alert alert--info">Product not found</div>
      </div>
    );
  }

  const categoryName = product.categoryName;
  const categoryId = product.categoryId;

  return (
    <div className="product-detail">
      {paymentFailed && (
        <div className="checkout-overlay" onClick={() => setPaymentFailed(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-modal__header">
              <h2 className="checkout-modal__title" style={{ color: "var(--color-error, #f44)" }}>
                Thanh toán không thành công
              </h2>
              <p className="checkout-modal__subtitle">
                Giao dịch đã bị hủy hoặc xảy ra lỗi. Vui lòng thử lại.
              </p>
            </div>
            <div className="checkout-modal__actions">
              <button
                className="btn btn--primary"
                onClick={() => setPaymentFailed(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="breadcrumbs">
        <Link to="/marketplace">Marketplace</Link>
        <span className="breadcrumbs__separator">/</span>
        {categoryName && (
          <>
            <Link
              to={
                categoryId != null
                  ? `/marketplace?category=${categoryId}`
                  : "/marketplace"
              }
            >
              {categoryName}
            </Link>
            <span className="breadcrumbs__separator">/</span>
          </>
        )}
        <span className="breadcrumbs__current">{product.name}</span>
      </nav>

      <div className="product-detail__top">
        <ProductImageGallery
          images={product.images}
          productName={product.name}
        />
        <ProductInfoSection
          product={product}
          showBuyButton={showBuyButton}
          onBuyNow={handleBuyNow}
          productId={Number(productId)}
        />
      </div>

      <ReviewSection
        reviews={reviews}
        productId={productId}
        hasPurchased={hasPurchased}
        role={role}
        isAdmin={isAdmin}
        isVendor={isVendor}
        onReviewsChanged={refetchReviewsAndProduct}
      />

      <RelatedProducts products={relatedProducts} />

      {showCheckoutModal && (
        <CheckoutModal
          product={product}
          selectedTier={selectedTier}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ProductDetail;
