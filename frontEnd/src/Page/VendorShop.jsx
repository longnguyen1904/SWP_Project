import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SearchBar from "../Component/Customer/SearchBar";
import FilterPanel from "../Component/Customer/FilterPanel";
import ProductGrid from "../Component/Customer/ProductGrid";
import { customerAPI } from "../services/api";
import {
  unwrapResponse,
  normalizePageResponse,
  getApiErrorMessage,
} from "../services/apiHelpers";
import { PRICE_MAX } from "../services/theme";
import "../Style/Marketplace.css";

const MD_BREAKPOINT = 900;

const DEFAULT_FILTERS = {
  categoryIds: [],
  tags: [],
  priceRange: { min: 0, max: PRICE_MAX },
  sortBy: "createdAt",
  sortDir: "desc",
};

const PAGE_SIZE = 10;

const VendorShop = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MD_BREAKPOINT);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MD_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [vendor, setVendor] = useState(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [vendorError, setVendorError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    limit: PAGE_SIZE,
  });

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (!vendorId) return;
    const loadVendor = async () => {
      setVendorLoading(true);
      try {
        const res = await customerAPI.getVendorShop(vendorId);
        setVendor(unwrapResponse(res));
      } catch (err) {
        setVendorError(getApiErrorMessage(err, "Không tìm thấy vendor."));
      } finally {
        setVendorLoading(false);
      }
    };
    loadVendor();
  }, [vendorId]);

  const fetchProducts = async (
    query = searchQuery,
    page = 1,
    filtersOverride = null,
  ) => {
    const activeFilters = filtersOverride || filters;
    setLoading(true);
    setError("");

    try {
      const requestParams = {
        q: query.trim() || undefined,
        page: page - 1,
        size: PAGE_SIZE,
        sortBy: activeFilters.sortBy || "createdAt",
        sortDir: activeFilters.sortDir || "desc",
      };
      if (activeFilters.priceRange.min > 0)
        requestParams.minPrice = activeFilters.priceRange.min;
      if (activeFilters.priceRange.max < PRICE_MAX)
        requestParams.maxPrice = activeFilters.priceRange.max;
      if (activeFilters.categoryIds.length > 0)
        requestParams.categoryId = activeFilters.categoryIds[0];
      if (activeFilters.tags.length > 0)
        requestParams.tag = activeFilters.tags[0];

      const response = await customerAPI.getVendorShopProducts(vendorId, requestParams);
      const { content, totalElements, totalPages, currentPage } =
        normalizePageResponse(response);

      setProducts(content);
      setPagination({
        currentPage,
        totalPages,
        totalItems: totalElements,
        limit: PAGE_SIZE,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Không thể tải sản phẩm."));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) fetchProducts("", 1);
  }, [vendorId]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    fetchProducts(q, 1);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchProducts(searchQuery, 1, newFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    fetchProducts(searchQuery, 1, DEFAULT_FILTERS);
  };

  const handlePageChange = (page) => fetchProducts(searchQuery, page);

  const handleSortChange = (sortValue) => {
    const [sortBy, sortDir] = (sortValue || "createdAt_desc").split("_");
    const nf = {
      ...filters,
      sortBy: sortBy || "createdAt",
      sortDir: sortDir || "desc",
    };
    setFilters(nf);
    fetchProducts(searchQuery, 1, nf);
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (vendorLoading) {
    return (
      <div className="loading-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (vendorError && !vendor) {
    return (
      <div className="vendor-shop">
        <div className="alert alert--error">{vendorError}</div>
        <Link to="/marketplace" className="btn btn--outline" style={{ marginTop: 16 }}>
          ← Về Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="marketplace">
      {vendor && (
        <div className="vendor-shop__header">
          <div className="vendor-shop__avatar">
            {(vendor.displayName || "V").charAt(0).toUpperCase()}
          </div>
          <div className="vendor-shop__info">
            <h1 className="vendor-shop__name">
              {vendor.displayName || "Vendor"}
              {vendor.isVerified && (
                <span className="vendor-shop__verified" title="Đã xác minh">✓</span>
              )}
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
              <span>{pagination.totalItems} sản phẩm</span>
            </div>
          </div>
        </div>
      )}

      <div className="marketplace__header" style={{ paddingTop: 0 }}>
        <div className="marketplace__search-wrapper">
          <SearchBar onSearch={handleSearch} placeholder="Tìm trong cửa hàng..." />
        </div>
        {isMobile && (
          <button
            className="marketplace__filter-toggle"
            onClick={() => setShowFilters((p) => !p)}
          >
            {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="marketplace__body">
        {(showFilters || !isMobile) && (
          <div className="marketplace__sidebar">
            <FilterPanel
              filters={filters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}
        <div className="marketplace__content">
          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner spinner--large"></div>
        </div>
      )}
    </div>
  );
};

export default VendorShop;
