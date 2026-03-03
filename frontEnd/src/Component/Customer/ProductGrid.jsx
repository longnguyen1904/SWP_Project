import React from "react";
import {
  Box,
  Grid,
  CircularProgress,
  Typography,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { productAPI } from "../../services/customerAPI";
import ProductCard from "./ProductCard";

const ProductGrid = ({
  products,
  loading,
  error,
  pagination,
  onPageChange,
  onSortChange,
  sortBy,
  onViewDetails,
  onQuickView,
}) => {
  const handlePageChange = (event, value) => {
    onPageChange(value);
  };

  const handleSortChange = (event) => {
    onSortChange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No products found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Try adjusting your search terms or filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Sort Options */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {pagination?.totalItems || products.length} products found
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy || "relevance"}
            onChange={handleSortChange}
            label="Sort by"
          >
            <MenuItem value="relevance">Most Relevant</MenuItem>
            <MenuItem value="price_low">Price: Low to High</MenuItem>
            <MenuItem value="price_high">Price: High to Low</MenuItem>
            <MenuItem value="rating">Highest Rated</MenuItem>
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="downloads">Most Downloaded</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Products Grid */}
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <ProductCard
              product={product}
              onViewDetails={onViewDetails}
              onQuickView={onQuickView}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage || 1}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default ProductGrid;
