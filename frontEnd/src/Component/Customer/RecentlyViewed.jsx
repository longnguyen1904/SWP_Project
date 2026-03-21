import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice, getProductImageUrl } from "../../services/formatters";

const STORAGE_KEY = "recentlyViewedProducts";
const MAX_ITEMS = 10;

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23282830'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

export const saveRecentlyViewed = (product) => {
  if (!product?.productId) return;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = stored.filter((p) => p.productId !== product.productId);
    const item = {
      productId: product.productId,
      productName: product.productName,
      basePrice: product.basePrice,
      categoryName: product.categoryName,
      thumbnailUrl: product.thumbnailUrl || getProductImageUrl(product),
      averageRating: product.averageRating ?? 0,
      reviewCount: product.reviewCount ?? 0,
      soldCount: product.soldCount ?? 0,
    };
    filtered.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch { /* ignore */ }
};

const RecentlyViewed = ({ excludeProductId } = {}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const filtered = excludeProductId
        ? stored.filter((p) => p.productId !== Number(excludeProductId))
        : stored;
      setItems(filtered);
    } catch { setItems([]); }
  }, [excludeProductId]);

  if (items.length === 0) return null;

  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER;
  };

  return (
    <div className="recently-viewed">
      <h2 className="recently-viewed__title">Sản phẩm đã xem gần đây</h2>
      <div className="recently-viewed__scroll">
        {items.map((product) => (
          <div
            key={product.productId}
            className="recently-viewed__card"
            onClick={() => navigate(`/products/${product.productId}`)}
          >
            <img
              className="recently-viewed__img"
              src={product.thumbnailUrl || PLACEHOLDER}
              alt={product.productName}
              onError={handleImgError}
            />
            <div className="recently-viewed__info">
              <h4 className="recently-viewed__name">{product.productName}</h4>
              <div className="recently-viewed__meta">
                <span className="product-card__stars">★</span>
                <span className="product-card__avg">{(product.averageRating ?? 0).toFixed(1)}</span>
                <span className="product-card__review-count">({product.reviewCount ?? 0})</span>
                <span className="product-card__sold" style={{ marginLeft: "auto" }}>{product.soldCount ?? 0} sold</span>
              </div>
              <p className="recently-viewed__price">{formatPrice(product.basePrice)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;
