import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
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

  const handlePageChange = (event, value) => {
    onPageChange(value);
  };

  const handleSortChange = (event) => {
    onSortChange(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress sx={{ color: "rgb(248, 97, 21)" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          mb: 2,
          bgcolor: "rgba(248, 81, 73, 0.15)",
          color: "#f85149",
          border: "1px solid rgba(248, 81, 73, 0.4)",
          borderRadius: 2,
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "#e6edf3" }}>
          No products found
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "#8b949e" }}>
          Try adjusting your search terms or filters
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3,
          py: 2,
          px: 2,
          borderRadius: 2,
          bgcolor: "rgba(22, 27, 34, 0.95)",
          border: "1px solid rgba(99, 102, 106, 0.4)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        <Typography variant="body1" fontWeight={500} sx={{ color: "#8b949e" }}>
          {pagination?.totalItems ?? products.length} products found
        </Typography>
        <FormControl
          size="small"
          sx={{
            minWidth: 200,
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(13, 17, 23, 0.8)",
              border: "1px solid rgba(99, 102, 106, 0.4)",
              color: "#e6edf3",
              "& fieldset": { border: "none" },
              "&:hover": { borderColor: "rgba(248, 97, 21, 0.5)" },
              "&.Mui-focused": { borderColor: "rgb(248, 97, 21)" },
            },
            "& .MuiInputLabel-root": { color: "#8b949e" },
            "& .MuiInputLabel-root.Mui-focused": { color: "rgb(248, 97, 21)" },
          }}
          variant="outlined"
        >
          <InputLabel id="sort-by-label">Sort by</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortValue}
            onChange={handleSortChange}
            label="Sort by"
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: "#161b22",
                  border: "1px solid rgba(99, 102, 106, 0.4)",
                  "& .MuiMenuItem-root": { color: "#e6edf3" },
                  "& .MuiMenuItem-root.Mui-selected": { bgcolor: "rgba(248, 97, 21, 0.2)" },
                },
              },
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(5, 1fr)",
          },
          gap: 3,
        }}
      >
        {products.map((product) => (
          <Box key={product.productId ?? product.id} sx={{ minWidth: 0 }}>
            <ProductCard
              product={product}
              onViewDetails={onViewDetails}
            />
          </Box>
        ))}
      </Box>

      {pagination && pagination.totalPages > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage ?? pagination.page ?? 1}
            onChange={handlePageChange}
            size="large"
            showFirstButton
            showLastButton
            showPrevButton
            showNextButton
            color="primary"
            siblingCount={1}
            boundaryCount={1}
            sx={{
              "& .MuiPaginationItem-root": { color: "#e6edf3" },
              "& .MuiPaginationItem-root.Mui-selected": {
                bgcolor: "rgb(248, 97, 21)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(248, 97, 21, 0.9)" },
              },
              "& .MuiPaginationItem-root:not(.Mui-selected):hover": {
                bgcolor: "rgba(248, 97, 21, 0.2)",
                color: "#e6edf3",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ProductGrid;
