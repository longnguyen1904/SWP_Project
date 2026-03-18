import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice, getProductImageUrl } from "../../services/formatters";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23282830'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

const RelatedProducts = ({ products = [] }) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER;
  };

  return (
    <div className="related-products">
      <h2 className="related-products__title">Related Products</h2>
      <div className="related-products__grid">
        {products.slice(0, 5).map((related) => (
          <div
            key={related.productId}
            className="related-card"
            onClick={() => navigate(`/products/${related.productId}`)}
          >
            <img
              className="related-card__image"
              src={getProductImageUrl(related)}
              alt={related.productName}
              onError={handleImgError}
            />
            <div className="related-card__body">
              <h3 className="related-card__name">{related.productName}</h3>
              <p className="related-card__price">{formatPrice(related.basePrice)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
