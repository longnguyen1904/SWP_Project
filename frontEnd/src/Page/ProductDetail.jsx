import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Rating,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { customerAPI } from "../services/api";

const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    content: "",
    easeOfUse: 5,
    features: 5,
    valueForMoney: 5,
    support: 5,
  });

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await customerAPI.getProductById(productId);
      const data = response.data;

      setProduct(data.product || data);
      setReviews(data.reviews || []);
      setRelatedProducts(data.relatedProducts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (license) => {
    setSelectedLicense(license);
    setPurchaseDialogOpen(true);
  };

  const handleConfirmPurchase = async () => {
    try {
      const purchaseData = {
        productId: product.id,
        licenseType: selectedLicense.type,
        price: selectedLicense.price,
      };

      const response = await customerAPI.purchaseProduct(purchaseData);
      
      // Redirect to payment or success page
      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        alert("Purchase successful!");
        setPurchaseDialogOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Purchase failed");
    }
  };

  const handleTrialRequest = async () => {
    try {
      const response = await customerAPI.requestTrial(productId);
      alert("Trial requested successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Trial request failed");
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const reviewData = {
        productId,
        ...reviewForm,
      };

      await customerAPI.submitReview(reviewData);
      
      // Refresh reviews
      const response = await customerAPI.getProductReviews(productId);
      setReviews(response.data);
      
      setReviewDialogOpen(false);
      setReviewForm({
        rating: 5,
        title: "",
        content: "",
        easeOfUse: 5,
        features: 5,
        valueForMoney: 5,
        support: 5,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Review submission failed");
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await customerAPI.addToWishlist(productId);
      alert("Added to wishlist!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to wishlist");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="info">Product not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link href="/marketplace">Marketplace</Link>
        <Link href={`/category/${product.category}`}>{product.category}</Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      {/* Product Details */}
      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={product.imageUrl || "/placeholder-product.jpg"}
              alt={product.name}
            />
          </Card>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {product.name}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            by {product.vendorName}
          </Typography>

          {/* Rating */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Rating value={product.averageRating} precision={0.1} readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({product.reviewCount} reviews)
            </Typography>
          </Box>

          {/* Price */}
          <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
            ${product.basePrice}
          </Typography>

          {/* Description */}
          <Typography variant="body1" sx={{ mb: 3 }}>
            {product.description}
          </Typography>

          {/* Categories */}
          <Box sx={{ mb: 3 }}>
            {product.categories?.map((category) => (
              <Chip key={category} label={category} sx={{ mr: 1, mb: 1 }} />
            ))}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ mb: 3 }}>
            {product.licenses?.map((license) => (
              <Button
                key={license.type}
                variant="contained"
                sx={{ mr: 2, mb: 2 }}
                onClick={() => handlePurchase(license)}
              >
                Buy {license.type} - ${license.price}
              </Button>
            ))}
            
            {product.hasTrial && (
              <Button
                variant="outlined"
                sx={{ mr: 2, mb: 2 }}
                onClick={handleTrialRequest}
              >
                Start Free Trial
              </Button>
            )}
            
            <Button
              variant="outlined"
              sx={{ mr: 2, mb: 2 }}
              onClick={handleAddToWishlist}
            >
              Add to Wishlist
            </Button>
          </Box>

          {/* Features */}
          <Typography variant="h6" gutterBottom>
            Features
          </Typography>
          <Box sx={{ mb: 3 }}>
            {product.features?.map((feature) => (
              <Chip key={feature} label={feature} sx={{ mr: 1, mb: 1 }} />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Reviews Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Customer Reviews
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={() => setReviewDialogOpen(true)}
          >
            Write a Review
          </Button>
        </Box>

        {reviews.map((review) => (
          <Card key={review.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{review.title}</Typography>
              <Rating value={review.rating} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {review.author} - {new Date(review.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {review.content}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom>
            Related Products
          </Typography>
          <Grid container spacing={3}>
            {relatedProducts.map((relatedProduct) => (
              <Grid item xs={12} sm={6} md={4} key={relatedProduct.id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={relatedProduct.imageUrl || "/placeholder-product.jpg"}
                    alt={relatedProduct.name}
                  />
                  <CardContent>
                    <Typography variant="h6">{relatedProduct.name}</Typography>
                    <Typography variant="body2" color="primary">
                      ${relatedProduct.basePrice}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => window.location.href = `/products/${relatedProduct.id}`}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Review Title"
            value={reviewForm.title}
            onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Typography component="legend">Overall Rating</Typography>
            <Rating
              value={reviewForm.rating}
              onChange={(event, newValue) => {
                setReviewForm({ ...reviewForm, rating: newValue });
              }}
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Review Content"
            value={reviewForm.content}
            onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)}>
        <DialogTitle>Confirm Purchase</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to purchase {product.name} - {selectedLicense?.type} license for ${selectedLicense?.price}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmPurchase} variant="contained">
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductDetail;
