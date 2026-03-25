import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { customerAPI } from "../services/api";
import { unwrapResponse, normalizePageResponse, getApiErrorMessage } from "../services/apiHelpers";
import { formatPrice, getProductImageUrl } from "../services/formatters";
import "../Style/Marketplace.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23282830'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

const PAGE_SIZE = 8;

const VendorShop = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showUnfollowOption, setShowUnfollowOption] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  const isLoggedIn = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return !!(u.userID || u.userId);
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (!vendorId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [vendorRes, productsRes] = await Promise.all([
          customerAPI.getVendorShop(vendorId),
          customerAPI.getVendorShopProducts(vendorId, { size: 50 }),
        ]);
        setVendor(unwrapResponse(vendorRes));
        const { content } = normalizePageResponse(productsRes);
        setProducts(content);

        // Check follow status
        try {
          const followRes = await customerAPI.checkFollowVendor(vendorId);
          const followData = followRes.data?.data ?? followRes.data;
          setFollowing(followData.following ?? false);
          setFollowerCount(followData.followerCount ?? 0);
        } catch {
          // Ignore — user might not be logged in
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Không tìm thấy vendor."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId]);

  const handleToggleFollow = async () => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để theo dõi vendor.");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await customerAPI.followVendor(vendorId);
      const data = res.data?.data ?? res.data;
      setFollowing(data.following ?? false);
      setFollowerCount(data.followerCount ?? 0);
    } catch (err) {
      console.error("Follow error:", err, err.response);
      const msg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || "Không thể thực hiện.";
      alert(msg);
    } finally {
      setFollowLoading(false);
    }
  };

  const bestSellers = useMemo(() => {
    return [...products]
      .filter((p) => (p.soldCount ?? 0) > 0)
      .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
      .slice(0, 3);
  }, [products]);

  const bannerPrev = useCallback(() => {
    setBannerIndex((i) => (i <= 0 ? bestSellers.length - 1 : i - 1));
  }, [bestSellers.length]);

  const bannerNext = useCallback(() => {
    setBannerIndex((i) => (i >= bestSellers.length - 1 ? 0 : i + 1));
  }, [bestSellers.length]);

  useEffect(() => {
    if (bestSellers.length <= 1) return;
    const timer = setInterval(bannerNext, 5000);
    return () => clearInterval(timer);
  }, [bestSellers.length, bannerNext]);

  const remaining = useMemo(() => {
    const bestSellerIds = new Set(bestSellers.map((p) => p.productId ?? p.productID));
    return products.filter((p) => !bestSellerIds.has(p.productId ?? p.productID));
  }, [products, bestSellers]);

  const renderCard = (p, featured) => {
    const id = p.productId ?? p.productID;
    const name = p.productName ?? p.name;
    const price = p.basePrice ?? p.price ?? 0;
    const rating = p.averageRating ?? 0;
    const reviewCount = p.reviewCount ?? 0;
    const sold = p.soldCount ?? 0;
    const img = getProductImageUrl(p) || p.thumbnailUrl || PLACEHOLDER;

    return (
      <div
        key={id}
        className={`vendor-shop__card ${featured ? "vendor-shop__card--featured" : ""}`}
        onClick={() => navigate(`/products/${id}`)}
      >
        <img
          className="vendor-shop__card-img"
          src={img}
          alt={name}
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        <div className="vendor-shop__card-body">
          <h3 className="vendor-shop__card-name">{name}</h3>
          <div className="vendor-shop__card-meta">
            <span className="vendor-shop__card-rating">★ {rating.toFixed(1)}</span>
            <span className="vendor-shop__card-reviews">({reviewCount})</span>
            <span className="vendor-shop__card-sold">{sold} sold</span>
          </div>
          <p className="vendor-shop__card-price">{formatPrice(price)}</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="vendor-shop" style={{ padding: 40 }}>
        <div className="alert alert--error">{error || "Không tìm thấy vendor"}</div>
        <Link to="/marketplace" className="btn btn--outline" style={{ marginTop: 16 }}>
          ← Về Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="vendor-shop">
      <div className="vendor-shop__header">
        <div className="vendor-shop__avatar">
          {(vendor.displayName || "V").charAt(0).toUpperCase()}
        </div>
        <div className="vendor-shop__info">
          <h1 className="vendor-shop__name">
            {vendor.displayName || "Vendor"}
          </h1>
          {vendor.companyName && (
            <p className="vendor-shop__company">{vendor.companyName}</p>
          )}
          {vendor.description && (
            <p className="vendor-shop__description">{vendor.description}</p>
          )}
          <div className="vendor-shop__meta">
            <span>{vendor.type === "COMPANY" ? "Doanh nghiệp" : "Cá nhân"}</span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>
              Tham gia{" "}
              {vendor.createdAt
                ? new Date(vendor.createdAt).toLocaleDateString("vi-VN", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>{products.length} sản phẩm</span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>{followerCount} người theo dõi</span>
          </div>

          {!following ? (
            <button
              className="btn vendor-shop__follow-btn"
              onClick={handleToggleFollow}
              disabled={followLoading}
            >
              {followLoading ? "..." : "+ Theo dõi"}
            </button>
          ) : (
            <div className="vendor-shop__follow-wrapper">
              <button
                className="btn vendor-shop__follow-btn vendor-shop__follow-btn--active"
                onClick={() => setShowUnfollowOption((p) => !p)}
                disabled={followLoading}
              >
                {followLoading ? "..." : "✓ Đang theo dõi"}
              </button>
              {showUnfollowOption && (
                <button
                  className="btn vendor-shop__unfollow-btn"
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn bỏ theo dõi vendor này?")) {
                      handleToggleFollow();
                      setShowUnfollowOption(false);
                    }
                  }}
                >
                  ✕ Bỏ theo dõi
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="vendor-shop__empty">
          <p>Vendor này chưa có sản phẩm nào.</p>
        </div>
      ) : (
        <>
          {bestSellers.length > 0 && (
            <>
              <h2 className="vendor-shop__section-title">🔥 Sản phẩm bán chạy</h2>
              <div className="vendor-shop__carousel">
                {bestSellers.length > 1 && (
                  <button className="vendor-shop__carousel-arrow vendor-shop__carousel-arrow--left" onClick={bannerPrev}>‹</button>
                )}
                <div className="vendor-shop__carousel-track" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
                  {bestSellers.map((p) => {
                    const id = p.productId ?? p.productID;
                    const name = p.productName ?? p.name;
                    const price = p.basePrice ?? p.price ?? 0;
                    const sold = p.soldCount ?? 0;
                    const rating = p.averageRating ?? 0;
                    const img = getProductImageUrl(p) || p.thumbnailUrl || PLACEHOLDER;
                    return (
                      <div key={id} className="vendor-shop__carousel-slide">
                        <img src={img} alt={name} className="vendor-shop__carousel-bg" onError={(e) => { e.target.src = PLACEHOLDER; }} />
                        <div className="vendor-shop__carousel-overlay">
                          <h3 className="vendor-shop__carousel-name">{name}</h3>
                          <div className="vendor-shop__carousel-stats">
                            <span>🔥 {sold} đã bán</span>
                            <span>★ {rating.toFixed(1)}</span>
                          </div>
                          <p className="vendor-shop__carousel-price">{formatPrice(price)}</p>
                          <button className="btn vendor-shop__carousel-cta" onClick={() => navigate(`/products/${id}`)}>Xem chi tiết →</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {bestSellers.length > 1 && (
                  <button className="vendor-shop__carousel-arrow vendor-shop__carousel-arrow--right" onClick={bannerNext}>›</button>
                )}
                {bestSellers.length > 1 && (
                  <div className="vendor-shop__carousel-dots">
                    {bestSellers.map((_, i) => (
                      <button key={i} className={`vendor-shop__carousel-dot ${i === bannerIndex ? "active" : ""}`} onClick={() => setBannerIndex(i)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {remaining.length > 0 && (
            <>
              <h2 className="vendor-shop__section-title">📦 Tất cả sản phẩm</h2>
              <div className="vendor-shop__grid">
                {remaining
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((p) => renderCard(p, false))}
              </div>
              {remaining.length > PAGE_SIZE && (
                <div className="vendor-shop__pagination">
                  {Array.from({ length: Math.ceil(remaining.length / PAGE_SIZE) }, (_, i) => (
                    <button
                      key={i}
                      className={`vendor-shop__page-btn ${currentPage === i + 1 ? "active" : ""}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default VendorShop;
