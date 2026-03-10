import React from "react";
import ProductCard from "./ProductCard";

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "productName_asc", label: "Name A–Z" },
  { value: "basePrice_asc", label: "Price: Low to High" },
  { value: "basePrice_desc", label: "Price: High to Low" },
];

const ProductGrid = ({
  products,
  loading,
  error,
  pagination,
  onPageChange,
  onSortChange,
  sortBy,
  sortDir,
  onViewDetails,
}) => {
  const sortValue = `${sortBy || "createdAt"}_${sortDir || "desc"}`;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert--error">{error}</div>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="product-grid__empty">
        <h3>No products found</h3>
        <p>Try adjusting your search terms or filters</p>
      </div>
    );
  }

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { currentPage, totalPages } = pagination;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return (
      <div className="pagination">
        <button className="pagination__btn" disabled={currentPage === 1} onClick={() => onPageChange(1)}>«</button>
        <button className="pagination__btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>‹</button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`e${idx}`} className="pagination__ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pagination__btn ${p === currentPage ? "pagination__btn--active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button className="pagination__btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>›</button>
        <button className="pagination__btn" disabled={currentPage === totalPages} onClick={() => onPageChange(totalPages)}>»</button>
      </div>
    );
  };

  return (
    <div>
      <div className="product-grid__toolbar">
        <span className="product-grid__count">
          {pagination?.totalItems ?? products.length} products found
        </span>
        <select
          className="product-grid__sort"
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="product-grid__cards">
        {products.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {renderPagination()}
    </div>
  );
};

export default ProductGrid;
