import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchBar from "../Component/Customer/SearchBar";
import FilterPanel from "../Component/Customer/FilterPanel";
import ProductGrid from "../Component/Customer/ProductGrid";
import { customerAPI } from "../services/api";

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    limit: 10,
  });

  const PRICE_MAX = 1000000;
  const [filters, setFilters] = useState({
    categoryIds: [],
    tags: [],
    priceRange: { min: 0, max: PRICE_MAX },
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const [showFilters, setShowFilters] = useState(!isMobile);
  const filterDebounceRef = useRef(null);

  useEffect(() => {
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const initialFilters = {
      categoryIds: category ? [Number(category)] : [],
      tags: tag ? [tag] : [],
      priceRange: { min: 0, max: PRICE_MAX },
      sortBy: "createdAt",
      sortDir: "desc",
    };
    setFilters(initialFilters);
    searchProducts("", 1, initialFilters);
  }, []);

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  const searchProducts = async (query = searchQuery, page = 1, filtersOverride = null) => {
    const f = filtersOverride ?? filters;
    setLoading(true);
    setError("");

    try {
      const params = {
        q: (query ?? searchQuery).trim() || undefined,
        page: page - 1,
        size: pagination.limit,
        sortBy: f.sortBy || "createdAt",
        sortDir: f.sortDir || "desc",
      };
      if (f.priceRange?.min != null && f.priceRange.min > 0) {
        params.minPrice = f.priceRange.min;
      }
      if (f.priceRange?.max != null && f.priceRange.max < PRICE_MAX) {
        params.maxPrice = f.priceRange.max;
      }
      if (Array.isArray(f.categoryIds) && f.categoryIds.length > 0) {
        params.categoryIds = f.categoryIds;
      }
      if (Array.isArray(f.tags) && f.tags.length > 0) {
        params.tags = f.tags;
      }

      const response = await customerAPI.getProducts(params);
      const data = response.data?.data ?? response.data;
      const content = data?.content ?? data?.products ?? [];
      const totalElements = data?.totalElements ?? data?.totalItems ?? content.length;
      const totalPages = data?.totalPages ?? (Math.ceil(totalElements / pagination.limit) || 1);
      const currentPage = data?.page != null ? data.page + 1 : page;

      setProducts(content);
      setPagination({
        currentPage,
        totalPages,
        totalItems: totalElements,
        limit: pagination.limit,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    searchProducts(query, 1);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      searchProducts(searchQuery, 1, newFilters);
      filterDebounceRef.current = null;
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, []);

  const handleClearFilters = () => {
    const defaultFilters = {
      categoryIds: [],
      tags: [],
      priceRange: { min: 0, max: PRICE_MAX },
      sortBy: "createdAt",
      sortDir: "desc",
    };
    setFilters(defaultFilters);
    searchProducts(searchQuery, 1, defaultFilters);
  };

  const handlePageChange = (page) => {
    searchProducts(searchQuery, page);
  };

  const handleSortChange = (sortValue) => {
    const [sortBy, sortDir] = (sortValue || "createdAt_desc").split("_");
    const newFilters = { ...filters, sortBy: sortBy || "createdAt", sortDir: sortDir || "desc" };
    setFilters(newFilters);
    searchProducts(searchQuery, 1, newFilters);
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Box
      sx={{
        maxWidth: 1400,
        mx: "auto",
        p: { xs: 2, sm: 3 },
        minHeight: "80vh",
      }}
    >
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            color: "#e6edf3",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            textShadow: "0 0 24px rgba(248, 97, 21, 0.15)",
          }}
        >
          Software Marketplace
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "#8b949e",
            mb: 3,
            fontWeight: 400,
          }}
        >
          Discover the perfect software for your needs
        </Typography>
        <Box sx={{ maxWidth: 600, mx: "auto", mb: 3 }}>
          <SearchBar onSearch={handleSearch} />
        </Box>
        {isMobile && (
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={toggleFilters}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: "rgba(248, 81, 73, 0.15)",
            color: "#f85149",
            border: "1px solid rgba(248, 81, 73, 0.4)",
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "flex-start",
          gap: 3,
          mt: 4,
        }}
      >
        {(showFilters || !isMobile) && (
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: 280 },
              position: { md: "sticky" },
              top: { md: 24 },
            }}
          >
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0, width: "100%", mt: { xs: 0, md: 2 } }}>
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
        </Box>
      </Box>

      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1300,
          }}
        >
          <CircularProgress size={60} sx={{ color: "rgb(248, 97, 21)" }} />
        </Box>
      )}
    </Box>
  );
};

export default Marketplace;
