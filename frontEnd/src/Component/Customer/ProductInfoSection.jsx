import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { formatPrice } from "../../services/formatters";
import { customerAPI } from "../../services/api";

const ProductInfoSection = ({ product, showBuyButton, onBuyNow, productId, latestVersion, isOwnProduct }) => {
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [trialLoading, setTrialLoading] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    customerAPI.checkWishlist(productId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data;
        setWished(Boolean(data));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [productId]);

  if (!product) return null;

  const tiers = product.licenseTiers ?? [];
  const selectedTier = tiers[selectedTierIndex] ?? null;

  const handleBuyClick = () => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

    if (!user.userID && !user.userId) {
      alert("You are not logged in. Please log in to complete this purchase.");
      return;
    }

    if (onBuyNow && selectedTier) {
      onBuyNow(selectedTier);
    }
  };

  const handleStartTrial = async () => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    if (!user.userID && !user.userId) {
      alert("You are not logged in. Please log in to start a trial.");
      return;
    }

    setTrialLoading(true);
    try {
      const res = await customerAPI.startTrial(product.productId);
      const data = res.data?.data;
      alert(
        `Trial activated successfully!\n\n` +
          `License Key: ${data.licenseKey}\n` +
          `Expires: ${new Date(data.expireAt).toLocaleDateString("en-US")}`,
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Could not activate trial.";
      alert(msg);
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <div className="product-info">
      {/* ── Section 1: Identity ── */}
      <h1 className="product-info__name">{product.name}</h1>

      <p className="product-info__vendor">
        by{" "}
        {product.vendorId ? (
          <Link to={`/vendors/${product.vendorId}`} className="vendor-link">
            {product.vendorName || "Vendor"}
          </Link>
        ) : (
          <span>{product.vendorName || "Vendor"}</span>
        )}
      </p>

      <div className="product-info__rating-box">
        <StarRating value={product.averageRating ?? 0} readOnly />
        <span className="product-info__rating-count">
          ({product.reviewCount ?? 0} reviews)
        </span>
      </div>

      <div className="product-info__divider" />

      {/* ── Section 2: Description & Tags ── */}
      <p className="product-info__description">
        {product.description || "No description."}
      </p>

      {product.tags?.length > 0 && (
        <div className="product-info__tags">
          <span className="product-info__tags-label">Tags:</span>
          {product.tags.map((tag) => (
            <Link
              key={tag}
              className="tag-link"
              to={`/marketplace?tag=${encodeURIComponent(tag)}`}
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {latestVersion && (
        <div className="product-info__version">
          <span className="product-info__version-badge">
            v{latestVersion.versionNumber}
          </span>
          {latestVersion.createdAt && (
            <span className="product-info__version-date">
              • Released {new Date(latestVersion.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
              })}
            </span>
          )}
          {latestVersion.releaseNotes && (
            <p className="product-info__version-notes">{latestVersion.releaseNotes}</p>
          )}
        </div>
      )}

      <div className="product-info__divider" />

      {/* ── Section 3: Price & Purchase ── */}
      <div className="product-info__price-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '24px' }}>
        <p className="product-info__price" style={{ margin: 0 }}>{formatPrice(product.basePrice)}</p>
        {productId && !isOwnProduct && (
          <button
            className="btn btn--outline"
            onClick={async (e) => {
              e.stopPropagation();
              if (wishBusy) return;
              setWished(prev => !prev);
              setWishBusy(true);
              try {
                await customerAPI.toggleWishlist(productId);
              } catch {
                setWished(prev => !prev);
              } finally {
                setWishBusy(false);
              }
            }}
            disabled={wishBusy}
          >
            {wished ? "Remove from Wishlist" : "Add to Wishlist"}
          </button>
        )}
      </div>

      {tiers.length > 0 && (
        <div className="product-info__tier-card">
          <h3 className="product-info__tiers-title">Select License Tier</h3>
          <div className="product-info__tiers">
            {tiers.map((tier, index) => {
              const isSelected = index === selectedTierIndex;
              return (
                <button
                  key={tier.tierId ?? index}
                  className={`product-info__tier-btn ${isSelected ? "product-info__tier-btn--active" : ""}`}
                  onClick={() => setSelectedTierIndex(index)}
                >
                  <span className="product-info__tier-name">{tier.tierName}</span>
                  <span className="product-info__tier-price">{formatPrice(tier.price)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="product-info__actions">
        {showBuyButton && tiers.length > 0 && (
          <button
            className="btn btn--primary product-info__buy-btn"
            onClick={handleBuyClick}
          >
            Buy Now
          </button>
        )}

        {showBuyButton && product.hasTrial && (
          <button
            className="btn btn--outline product-info__trial-btn"
            onClick={handleStartTrial}
            disabled={trialLoading}
          >
            {trialLoading
              ? "Processing..."
              : `Start Free Trial (${product.trialDurationDays ?? 7} days)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductInfoSection;
