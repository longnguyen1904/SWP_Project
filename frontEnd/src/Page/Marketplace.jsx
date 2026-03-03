import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
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
    limit: 12,
  });

  const [filters, setFilters] = useState({
    categories: [],
    programmingLanguages: [],
    priceRange: { min: 0, max: 1000 },
    ratings: [],
    sortBy: "relevance",
  });

  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    // Load initial products
    searchProducts();
  }, []);

  useEffect(() => {
    setShowFilters(!isMobile);
  }, [isMobile]);

  const searchProducts = async (query = searchQuery, page = 1) => {
    setLoading(true);
    setError("");

    try {
      const searchParams = {
        query: query.trim(),
        page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await searchAPI.searchProducts(searchParams);
      const data = response.data;

      setProducts(data.products || data || []);
      setPagination({
        currentPage: data.currentPage || page,
        totalPages: data.totalPages || Math.ceil((data.totalItems || 0) / pagination.limit),
        totalItems: data.totalItems || data.length || 0,
        limit: pagination.limit,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search products");
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
    // Auto-search when filters change
    searchProducts(searchQuery, 1);
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      categories: [],
      programmingLanguages: [],
      priceRange: { min: 0, max: 1000 },
      ratings: [],
      sortBy: "relevance",
    };
    setFilters(defaultFilters);
    searchProducts(searchQuery, 1);
  };

  const handlePageChange = (page) => {
    searchProducts(searchQuery, page);
  };

  const handleSortChange = (sortBy) => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    searchProducts(searchQuery, 1);
  };

  const handleViewDetails = (productId) => {
    // Navigate to product detail page
    window.location.href = `/products/${productId}`;
  };

  const handleQuickView = (product) => {
    // Implement quick view modal
    console.log("Quick view:", product);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h3" gutterBottom>
          Software Marketplace
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Discover the perfect software for your needs
        </Typography>

        {/* Search Bar */}
        <Box sx={{ maxWidth: 600, mx: "auto", mb: 3 }}>
          <SearchBar onSearch={handleSearch} />
        </Box>

        {/* Mobile Filter Toggle */}
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        {(showFilters || !isMobile) && (
          <Grid item xs={12} md={3}>
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
          </Grid>
        )}

        {/* Products Grid */}
        <Grid item xs={12} md={showFilters || !isMobile ? 9 : 12}>
          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            sortBy={filters.sortBy}
            onViewDetails={handleViewDetails}
            onQuickView={handleQuickView}
          />
        </Grid>
      </Grid>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1300,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};

export default Marketplace;
