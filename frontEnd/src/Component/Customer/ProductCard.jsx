import React from "react";
import { formatPrice, getProductImageUrl } from "../../services/formatters";

const ProductCard = ({ product, onViewDetails }) => {
  const { productId, productName, description, basePrice, categoryName, tags = [] } = product;

  const handleClick = (e) => {
    e?.stopPropagation?.();
    if (productId != null && onViewDetails) onViewDetails(productId);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img
        className="product-card__image"
        src={getProductImageUrl(product)}
        alt={productName}
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
