import React, { useState, useEffect } from "react";
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
      } catch (err) {
        setError(getApiErrorMessage(err, "Không tìm thấy vendor."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId]);

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
        <div className="alert alert--error">{error || "Không tìm thấy vendor"}</div>
        <Link to="/marketplace" className="btn btn--outline" style={{ marginTop: 16 }}>
          ← Về Marketplace
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
            <span>{vendor.type === "COMPANY" ? "Doanh nghiệp" : "Cá nhân"}</span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>
              Tham gia{" "}
              {vendor.createdAt
                ? new Date(vendor.createdAt).toLocaleDateString("vi-VN", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span className="vendor-shop__meta-sep">•</span>
            <span>{products.length} sản phẩm</span>
          </div>
        </div>
      </div>

      <h2 className="vendor-shop__section-title">Sản phẩm của cửa hàng</h2>

      {products.length === 0 ? (
        <div className="vendor-shop__empty">
          <p>Vendor này chưa có sản phẩm nào.</p>
        </div>
      ) : (
        <>
          <div className="vendor-shop__grid">
            {products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((p) => {
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
            })}
          </div>

          {products.length > PAGE_SIZE && (
            <div className="vendor-shop__pagination">
              {Array.from({ length: Math.ceil(products.length / PAGE_SIZE) }, (_, i) => (
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
    </div>
  );
};

export default VendorShop;
