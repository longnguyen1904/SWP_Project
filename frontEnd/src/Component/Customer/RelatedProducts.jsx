import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice, getProductImageUrl } from "../../services/formatters";

const RelatedProducts = ({ products = [] }) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

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
