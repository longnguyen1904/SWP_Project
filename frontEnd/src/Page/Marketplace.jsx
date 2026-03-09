import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchBar from "../Component/Customer/SearchBar";
import FilterPanel from "../Component/Customer/FilterPanel";
import ProductGrid from "../Component/Customer/ProductGrid";
import { customerAPI } from "../services/api";
import { unwrapResponse } from "../services/apiHelpers";
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


const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isMobile, setIsMobile] = useState(window.innerWidth < MD_BREAKPOINT);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MD_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 0, totalItems: 0, limit: PAGE_SIZE,
  });

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const initialFilters = {
      ...DEFAULT_FILTERS,
      categoryIds: category ? [Number(category)] : [],
      tags: tag ? [tag] : [],
    };
    setFilters(initialFilters);
    fetchProducts("", 1, initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setShowFilters(!isMobile); }, [isMobile]);


  const fetchProducts = async (query = searchQuery, page = 1, filtersOverride = null) => {
    const activeFilters = filtersOverride ?? filters;
    setLoading(true);
    setError("");

    try {
      const requestParams = {
        q: (query ?? searchQuery).trim() || undefined,
        page: page - 1,
        size: PAGE_SIZE,
        sortBy: activeFilters.sortBy || "createdAt",
        sortDir: activeFilters.sortDir || "desc",
      };
      if (activeFilters.priceRange?.min > 0) requestParams.minPrice = activeFilters.priceRange.min;
      if (activeFilters.priceRange?.max != null && activeFilters.priceRange.max < PRICE_MAX) requestParams.maxPrice = activeFilters.priceRange.max;
      if (activeFilters.categoryIds?.length > 0) requestParams.categoryIds = activeFilters.categoryIds;
      if (activeFilters.tags?.length > 0) requestParams.tags = activeFilters.tags;

      const response = await customerAPI.getProducts(requestParams);
      const data = unwrapResponse(response) ?? response.data;
      const content = data?.content ?? data?.products ?? [];
      const totalElements = data?.totalElements ?? data?.totalItems ?? content.length;
      const totalPages = data?.totalPages ?? (Math.ceil(totalElements / PAGE_SIZE) || 1);
      const currentPage = data?.page != null ? data.page + 1 : page;

      setProducts(content);
      setPagination({ currentPage, totalPages, totalItems: totalElements, limit: PAGE_SIZE });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (q) => { setSearchQuery(q); fetchProducts(q, 1); };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchProducts(searchQuery, 1, newFilters);
  };

  const handleClearFilters = () => { setFilters(DEFAULT_FILTERS); fetchProducts(searchQuery, 1, DEFAULT_FILTERS); };
  const handlePageChange = (page) => { fetchProducts(searchQuery, page); };

  const handleSortChange = (sortValue) => {
    const [sortBy, sortDir] = (sortValue || "createdAt_desc").split("_");
    const nf = { ...filters, sortBy: sortBy || "createdAt", sortDir: sortDir || "desc" };
    setFilters(nf);
    fetchProducts(searchQuery, 1, nf);
  };

  const handleViewDetails = (productId) => { navigate(`/products/${productId}`); };

  return (
    <div className="marketplace">
      <div className="marketplace__header">
        <h1 className="marketplace__title">Software Marketplace</h1>
        <p className="marketplace__subtitle">Discover the perfect software for your needs</p>
        <div className="marketplace__search-wrapper">
          <SearchBar onSearch={handleSearch} />
        </div>
        {isMobile && (
          <button className="marketplace__filter-toggle" onClick={() => setShowFilters((p) => !p)}>
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="marketplace__body">
        {(showFilters || !isMobile) && (
          <div className="marketplace__sidebar">
            <FilterPanel filters={filters} onApplyFilters={handleApplyFilters} onClearFilters={handleClearFilters} />
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

export default Marketplace;
