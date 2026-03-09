import React from "react";
import { formatPrice, getProductImageUrl } from "../../services/formatters";

const ProductCard = ({ product, onViewDetails }) => {
  const id = product.productId ?? product.id;
  const name = product.productName ?? product.name;
  const description = product.description;
  const basePrice = product.basePrice ?? product.price;
  const categoryName = product.categoryName ?? product.category;
  const tags = product.tags ?? [];

  const handleClick = (e) => {
    e?.stopPropagation?.();
    if (id != null && onViewDetails) onViewDetails(id);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img
        className="product-card__image"
        src={getProductImageUrl(product)}
        alt={name}
      />
      <div className="product-card__body">
        <h3 className="product-card__name">{name || "—"}</h3>
        <p className="product-card__desc">{description || "—"}</p>

        <div className="product-card__tags">
          {categoryName && <span className="chip">{categoryName}</span>}
        </div>

        <div className="product-card__tags">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="chip chip--accent">
              {typeof tag === "string" ? tag : tag?.name ?? tag}
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
