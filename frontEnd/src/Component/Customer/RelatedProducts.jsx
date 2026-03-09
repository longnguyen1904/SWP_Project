import React from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../../services/formatters";

const RelatedProducts = ({ products = [] }) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  return (
    <div className="related-products">
      <h2 className="related-products__title">Related Products</h2>
      <div className="related-products__grid">
        {products.slice(0, 5).map((related) => {
          const id = related.productId ?? related.id;
          const name = related.productName ?? related.name;
          const price = related.basePrice ?? related.price;
          const img =
            related.images?.[0]?.imageUrl ?? related.images?.[0] ?? "/placeholder-product.jpg";

          return (
            <div
              key={id}
              className="related-card"
              onClick={() => navigate(`/products/${id}`)}
            >
              <img
                className="related-card__image"
                src={typeof img === "string" ? img : "/placeholder-product.jpg"}
                alt={name}
              />
              <div className="related-card__body">
                <h3 className="related-card__name">{name}</h3>
                <p className="related-card__price">{formatPrice(price)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
