import React, { useState, useEffect, useMemo } from "react";
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

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isLoggedIn = !!(currentUser.userID || currentUser.userId);
  const currentUserId = String(currentUser.userID || currentUser.userId || "");
  const isOwnShop = isLoggedIn && vendor && String(vendor.userId ?? "") === currentUserId;

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

        try {
          const followRes = await customerAPI.checkFollowVendor(vendorId);
          const followData = followRes.data?.data ?? followRes.data;
          setFollowing(followData.following ?? false);
          setFollowerCount(followData.followerCount ?? 0);
        } catch {}
      } catch (err) {
        setError(getApiErrorMessage(err, "Vendor not found."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId]);

  const handleToggleFollow = async () => {
    if (!isLoggedIn) {
      alert("Please log in to follow this vendor.");
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
      const msg = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message || "Action failed.";
      alert(msg);
    } finally {
      setFollowLoading(false);
    }
  };

  /* ── Derived product lists ── */
  const bestSellers = useMemo(() => {
    return [...products]
      .filter((p) => (p.soldCount ?? 0) > 0)
      .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
      .slice(0, 4);
  }, [products]);

  const topRated = useMemo(() => {
    return [...products]
      .filter((p) => (p.averageRating ?? 0) > 0)
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
      .slice(0, 4);
  }, [products]);

  const otherProducts = useMemo(() => {
    const featuredIds = new Set([
      ...bestSellers.map((p) => p.productId ?? p.productID),
      ...topRated.map((p) => p.productId ?? p.productID),
    ]);
    return products.filter((p) => !featuredIds.has(p.productId ?? p.productID));
  }, [products, bestSellers, topRated]);

  const renderCard = (p) => {
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
        className="vendor-shop__card"
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
        <div className="alert alert--error">{error || "Vendor not found"}</div>
        <Link to="/marketplace" className="btn btn--outline" style={{ marginTop: 16 }}>
          ← Back to Marketplace
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
            <span>{vendor.type === "COMPANY" ? "Company" : "Individual"}</span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>
              Joined{" "}
              {vendor.createdAt
                ? new Date(vendor.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>{products.length} products</span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>{followerCount} followers</span>
          </div>

          {!isOwnShop && (
            !following ? (
              <button
                className="btn vendor-shop__follow-btn"
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {followLoading ? "..." : "+ Follow"}
              </button>
            ) : (
              <div className="vendor-shop__follow-wrapper">
                <button
                  className="btn vendor-shop__follow-btn vendor-shop__follow-btn--active"
                  onClick={() => setShowUnfollowOption((p) => !p)}
                  disabled={followLoading}
                >
                  {followLoading ? "..." : "✓ Following"}
                </button>
                {showUnfollowOption && (
                  <button
                    className="btn vendor-shop__unfollow-btn"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to unfollow this vendor?")) {
                        handleToggleFollow();
                        setShowUnfollowOption(false);
                      }
                    }}
                  >
                    ✕ Unfollow
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="vendor-shop__empty">
          <p>This vendor has no products yet.</p>
        </div>
      ) : (
        <>
          {/* ── Section 1: Best Sellers ── */}
          {bestSellers.length > 0 && (
            <>
              <h2 className="vendor-shop__section-title">Best Sellers</h2>
              <div className="vendor-shop__grid">
                {bestSellers.map((p) => renderCard(p))}
              </div>
            </>
          )}

          {/* ── Section 2: Top Rated ── */}
          {topRated.length > 0 && (
            <>
              <h2 className="vendor-shop__section-title">Top Rated</h2>
              <div className="vendor-shop__grid">
                {topRated.map((p) => renderCard(p))}
              </div>
            </>
          )}

          {/* ── Section 3: Other Products ── */}
          {otherProducts.length > 0 && (
            <>
              <h2 className="vendor-shop__section-title">All Products</h2>
              <div className="vendor-shop__grid">
                {otherProducts
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((p) => renderCard(p))}
              </div>
              {otherProducts.length > PAGE_SIZE && (
                <div className="vendor-shop__pagination">
                  {Array.from({ length: Math.ceil(otherProducts.length / PAGE_SIZE) }, (_, i) => (
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
