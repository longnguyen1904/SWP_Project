import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  Button,
  Rating,
  IconButton,
} from "@mui/material";
import { productAPI } from "../../services/customerAPI";

const ProductCard = ({ product, onViewDetails, onQuickView }) => {
  const {
    id,
    name,
    description,
    price,
    basePrice,
    images,
    screenshots,
    category,
    programmingLanguage,
    averageRating,
    totalReviews,
    downloadCount,
    tags,
    status,
  } = product;

  const handleViewDetails = () => {
    onViewDetails(id);
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const handleStartTrial = async (e) => {
    e.stopPropagation();
    try {
      await productAPI.startFreeTrial(id);
      // Show success message or redirect
      console.log("Trial started successfully");
    } catch (error) {
      console.error("Failed to start trial:", error);
    }
  };

  const formatPrice = (price) => {
    if (price === 0 || !price) return "Free";
    return `$${price}`;
  };

  const getProductImage = () => {
    if (images && images.length > 0) {
      return images[0];
    }
    if (screenshots && screenshots.length > 0) {
      return screenshots[0];
    }
    return "/placeholder-product.png"; // Fallback image
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 4,
        },
      }}
      onClick={handleViewDetails}
    >
      {/* Product Image */}
      <CardMedia
        component="img"
        height="160"
        image={getProductImage()}
        alt={name}
        sx={{
          objectFit: "cover",
          backgroundColor: "grey.100",
        }}
      />

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Status Badge */}
        {status && (
          <Box sx={{ mb: 1 }}>
            <Chip
              label={status}
              color={getStatusColor(status)}
              size="small"
              variant="outlined"
            />
          </Box>
        )}

        {/* Product Name */}
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontSize: "1.1rem",
            fontWeight: 600,
            lineHeight: 1.3,
            height: "2.6rem",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {name}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            height: "3rem",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {description}
        </Typography>

        {/* Category and Language */}
        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {category && (
            <Chip label={category} size="small" variant="outlined" />
          )}
          {programmingLanguage && (
            <Chip label={programmingLanguage} size="small" variant="outlined" />
          )}
        </Box>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <Box sx={{ mb: 2, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {tags.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
            {tags.length > 3 && (
              <Chip
                label={`+${tags.length - 3}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        )}

        {/* Rating and Reviews */}
        {averageRating && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Rating
              value={averageRating}
              precision={0.1}
              size="small"
              readOnly
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {averageRating.toFixed(1)}
              {totalReviews && ` (${totalReviews})`}
            </Typography>
          </Box>
        )}

        {/* Download Count */}
        {downloadCount && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
            {downloadCount.toLocaleString()} downloads
          </Typography>
        )}

        {/* Price */}
        <Typography
          variant="h6"
          color="primary"
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {formatPrice(price || basePrice)}
        </Typography>
      </CardContent>

      {/* Action Buttons */}
      <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleViewDetails}
          sx={{ flexGrow: 1 }}
        >
          View Details
        </Button>
        
        {/* Quick View Button */}
        {onQuickView && (
          <IconButton
            size="small"
            onClick={handleQuickView}
            title="Quick View"
            sx={{
              border: 1,
              borderColor: "divider",
            }}
          >
            👁️
          </IconButton>
        )}

        {/* Free Trial Button */}
        {(price === 0 || basePrice === 0) && status === "APPROVED" && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleStartTrial}
            color="success"
          >
            Free Trial
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default ProductCard;
