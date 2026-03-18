import React from "react";
import { formatPrice, getProductImageUrl } from "../../services/formatters";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23282830'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

const ProductCard = ({ product, onViewDetails }) => {
  const { productId, productName, description, basePrice, categoryName, tags = [] } = product;

  const handleClick = (e) => {
    e?.stopPropagation?.();
    if (productId != null && onViewDetails) onViewDetails(productId);
  };

  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER;
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img
        className="product-card__image"
        src={getProductImageUrl(product)}
        alt={productName}
        onError={handleImgError}
      />
      <div className="product-card__body">
        <h3 className="product-card__name">{productName || "—"}</h3>
        <p className="product-card__desc">{description || "—"}</p>

        <div className="product-card__tags">
          {categoryName && <span className="chip">{categoryName}</span>}
        </div>

        <div className="product-card__tags">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="chip chip--accent">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="chip">+{tags.length - 3}</span>
          )}
        </div>

        <div className="product-card__price">{formatPrice(basePrice)}</div>
      </div>
    </div>
  );
};

export default ProductCard;
