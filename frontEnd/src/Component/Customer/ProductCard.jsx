import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
} from "@mui/material";

const ProductCard = ({ product, onViewDetails }) => {
  const id = product.productId ?? product.id;
  const name = product.productName ?? product.name;
  const description = product.description;
  const basePrice = product.basePrice ?? product.price;
  const categoryName = product.categoryName ?? product.category;
  const tags = product.tags ?? [];

  const handleViewDetails = (e) => {
    e?.stopPropagation?.();
    if (id != null && onViewDetails) onViewDetails(id);
  };

  const formatPrice = (price) => {
    if (price == null || price === 0) return "Miễn phí";
    return `${Number(price).toLocaleString("vi-VN")} ₫`;
  };

  const getProductImage = () => {
    if (product.images && product.images.length > 0) {
      const first = product.images[0];
      return typeof first === "string" ? first : first?.imageUrl ?? first?.url;
    }
    return "/placeholder-product.png";
  };

  return (
    <Card
      sx={{
        width: "100%",
        height: 380,
        maxHeight: 380,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        bgcolor: "rgba(22, 27, 34, 0.95)",
        border: "1px solid rgba(99, 102, 106, 0.4)",
        borderRadius: 2,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(248, 97, 21, 0.3)",
          borderColor: "rgba(248, 97, 21, 0.5)",
        },
      }}
      onClick={handleViewDetails}
    >
      <CardMedia
        component="img"
        height="140"
        image={getProductImage()}
        alt={name}
        sx={{
          objectFit: "cover",
          backgroundColor: "rgba(13, 17, 23, 0.9)",
          flexShrink: 0,
          borderBottom: "1px solid rgba(99, 102, 106, 0.2)",
        }}
      />
      <CardContent
        sx={{
          flex: 1,
          pb: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontSize: "1.1rem",
            fontWeight: 600,
            height: "2.6rem",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            flexShrink: 0,
            mb: 1,
            color: "#e6edf3",
          }}
        >
          {name || "—"}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            height: "2.5rem",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            flexShrink: 0,
            mb: 1,
            color: "#8b949e",
          }}
        >
          {description || "—"}
        </Typography>
        <Box sx={{ height: 28, mb: 1, display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", flexShrink: 0, overflow: "hidden" }}>
          {categoryName ? (
            <Chip
              label={categoryName}
              size="small"
              variant="outlined"
              sx={{
                color: "#8b949e",
                borderColor: "rgba(99, 102, 106, 0.5)",
              }}
            />
          ) : null}
        </Box>
        <Box sx={{ height: 28, mb: 1, display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", flexShrink: 0, overflow: "hidden" }}>
          {tags && tags.length > 0 ? (
            <>
              {tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  label={typeof tag === "string" ? tag : tag?.name ?? tag}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: "rgb(248, 97, 21)",
                    borderColor: "rgba(248, 97, 21, 0.5)",
                  }}
                />
              ))}
              {tags.length > 3 && (
                <Chip
                  label={`+${tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ color: "#8b949e", borderColor: "rgba(99, 102, 106, 0.5)" }}
                />
              )}
            </>
          ) : null}
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            flexShrink: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mt: "auto",
            color: "rgb(248, 97, 21)",
          }}
        >
          {formatPrice(basePrice)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
