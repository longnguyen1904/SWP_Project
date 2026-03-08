import React, { useState } from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { formatPrice } from "../../services/formatters";

const ProductInfoSection = ({ product, showBuyButton, onBuyNow }) => {
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);

  if (!product) return null;

  const tiers = product.licenseTiers ?? [];
  const selectedTier = tiers[selectedTierIndex] ?? null;

  const handleBuyClick = () => {
    if (onBuyNow && selectedTier) {
      onBuyNow(selectedTier);
    }
  };

  return (
    <div className="product-info">
      <h1 className="product-info__name">{product.name}</h1>

      <p className="product-info__vendor">
        by <span>{product.vendorName ?? "Vendor"}</span>
      </p>

      <div className="product-info__rating-box">
        <StarRating value={product.averageRating ?? 0} readOnly />
        <span className="product-info__rating-count">
          ({product.reviewCount ?? 0} reviews)
        </span>
      </div>

      <p className="product-info__price">{formatPrice(product.basePrice)}</p>

      {showBuyButton && tiers.length > 0 && (
        <button
          className="btn btn--primary product-info__buy-btn"
          onClick={handleBuyClick}
        >
          Mua ngay
        </button>
      )}

      <p className="product-info__description">
        {product.description || "No description."}
      </p>

      {product.tags?.length > 0 && (
        <div className="product-info__tags">
          <span className="product-info__tags-label">Tags:</span>
          {product.tags.map((tag) => {
            const tagName = typeof tag === "string" ? tag : tag?.name ?? tag;
            return (
              <Link
                key={tagName}
                className="tag-link"
                to={`/marketplace?tag=${encodeURIComponent(tagName)}`}
              >
                {tagName}
              </Link>
            );
          })}
        </div>
      )}

      {tiers.length > 0 && (
        <div>
          <h3 className="product-info__tiers-title">Chọn gói License</h3>
          <div className="product-info__tiers">
            {tiers.map((tier, index) => {
              const isSelected = index === selectedTierIndex;
              return (
                <button
                  key={tier.tierId ?? tier.tierID ?? index}
                  className={`btn btn--outline ${isSelected ? "btn--selected" : ""}`}
                  onClick={() => setSelectedTierIndex(index)}
                >
                  {tier.tierName ?? tier.name} — {formatPrice(tier.price)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showBuyButton && product.hasTrial && (
        <button className="btn btn--outline" disabled>
          Start Free Trial (coming soon)
        </button>
      )}
    </div>
  );
};

export default ProductInfoSection;
