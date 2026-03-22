import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { customerAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import { formatPrice, getProductImageUrl } from "../services/formatters";
import "../Style/Wishlist.css";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23282830'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const WishlistPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await customerAPI.getWishlist();
      const data = unwrapResponse(res);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load wishlist."));
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const cat = item.product?.categoryName;
      if (cat) set.add(cat);
    });
    return [...set].sort();
  }, [items]);

  const tags = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      (item.product?.tags || []).forEach((t) => {
        if (t) set.add(t);
      });
    });
    return [...set].sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const product = item.product || {};
      const name = (product.productName ?? "").toLowerCase();
      const catName = product.categoryName ?? "";
      const productTags = product.tags || [];

      if (searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory && catName !== selectedCategory) return false;
      if (selectedTag && !productTags.includes(selectedTag)) return false;
      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedTag]);

  const sortedItems = useMemo(() => {
    const arr = [...filteredItems];
    switch (sortOption) {
      case "name_asc":
        arr.sort((a, b) =>
          (a.product?.productName ?? "").localeCompare(b.product?.productName ?? ""),
        );
        break;
      case "price_asc":
        arr.sort((a, b) => (a.product?.basePrice ?? 0) - (b.product?.basePrice ?? 0));
        break;
      case "price_desc":
        arr.sort((a, b) => (b.product?.basePrice ?? 0) - (a.product?.basePrice ?? 0));
        break;
      default:
        break;
    }
    return arr;
  }, [filteredItems, sortOption]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedTag, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  const pagedItems = sortedItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleRemove = async (productId) => {
    setRemovingIds((prev) => new Set(prev).add(productId));
    try {
      await customerAPI.toggleWishlist(productId);
      setItems((prev) => {
        const next = prev.filter((item) => {
          const pid = item.product?.productId;
          return pid !== productId;
        });
        return next;
      });
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not remove item from wishlist."));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedTag("");
  };

  const hasFilters = searchQuery || selectedCategory || selectedTag;

  if (loading) {
    return (
      <div className="wishlist-page">
        <h2 className="wishlist-page__title">My Wishlist</h2>
        <div className="wishlist-page__loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page">
        <h2 className="wishlist-page__title">My Wishlist</h2>
        <div className="alert alert--error">{error}</div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h2 className="wishlist-page__title">
        My Wishlist
        {items.length > 0 && (
          <span className="wishlist-page__count">{items.length}</span>
        )}
      </h2>

      {items.length > 0 && (
        <div className="wishlist-filters">
          <input
            type="text"
            className="wishlist-filters__search"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="wishlist-filters__select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            className="wishlist-filters__select"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
          <select
            className="wishlist-filters__select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {hasFilters && (
            <button className="btn btn--outline btn--sm" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="wishlist-page__empty">
          <div className="wishlist-page__empty-icon">♡</div>
          <p>Your wishlist is empty.</p>
          <button
            className="btn btn--primary"
            onClick={() => navigate("/marketplace")}
          >
            Browse Marketplace
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="wishlist-page__empty">
          <p>No matching products found.</p>
          <button className="btn btn--outline" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <table className="wishlist-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((item) => {
                const product = item.product || {};
                const pid = product.productId;
                const name = product.productName ?? "—";
                const price = product.basePrice;
                const catName = product.categoryName ?? "—";
                const imgUrl = product.imageUrl;
                const avgRating = product.averageRating ?? 0;
                const reviewCount = product.reviewCount ?? 0;
                const soldCount = product.soldCount ?? 0;
                const isRemoving = removingIds.has(pid);

                return (
                  <tr key={item.wishlistId ?? pid} className="wishlist-table__row">
                    <td className="wishlist-table__img-cell">
                      <img
                        className="wishlist-table__img"
                        src={imgUrl || PLACEHOLDER}
                        alt={name}
                        onClick={() => handleViewDetails(pid)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDER;
                        }}
                      />
                    </td>
                    <td>
                      <span
                        className="wishlist-table__name"
                        onClick={() => handleViewDetails(pid)}
                      >
                        {name}
                      </span>
                    </td>
                    <td className="wishlist-table__category">{catName}</td>
                    <td className="wishlist-table__price">
                      {formatPrice(price)}
                    </td>
                    <td>
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => handleRemove(pid)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 24 }}>
              <button
                className="pagination__btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination__btn ${page === currentPage ? "pagination__btn--active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination__btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WishlistPage;
