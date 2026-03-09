import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Rating,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  TextField,
} from "@mui/material";
import { customerAPI, vendorAPI } from "../services/api";

// Dark theme palette (Ä‘á»“ng bá»™ Marketplace)
const theme = {
  text: "#e6edf3",
  textMuted: "#8b949e",
  accent: "rgb(248, 97, 21)",
  surface: "#161b22",
  surfaceRaised: "#21262d",
  border: "rgba(230, 237, 243, 0.12)",
};

const getUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.userID ?? u.userId ?? localStorage.getItem("userId");
  } catch {
    return localStorage.getItem("userId");
  }
};

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR";
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  /** Index cá»§a áº£nh chÃ­nh Ä‘ang lá»—i (khÃ´ng load Ä‘Æ°á»£c). DÃ¹ng state Ä‘á»ƒ trÃ¡nh nhÃ¡y: React khÃ´ng ghi Ä‘Ã¨ src vá» URL lá»—i. */
  const [mainImageErrorIndex, setMainImageErrorIndex] = useState(null);
  /** VendorId cá»§a user hiá»‡n táº¡i (khi role = VENDOR), Ä‘á»ƒ áº©n form Ä‘Ã¡nh giÃ¡ khi xem sáº£n pháº©m cá»§a chÃ­nh mÃ¬nh. */
  const [currentVendorId, setCurrentVendorId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  /** Customer: Ä‘Ã£ mua sáº£n pháº©m (Order PaymentStatus != Pending) má»›i Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡. */
  const [hasPurchased, setHasPurchased] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [reviewUpdating, setReviewUpdating] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [reviewActionError, setReviewActionError] = useState("");

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (role === "CUSTOMER" && productId && getUserId()) {
      customerAPI
        .getProductPurchased(productId)
        .then((res) => {
          const data = res.data?.data ?? res.data;
          setHasPurchased(Boolean(data?.purchased));
        })
        .catch(() => setHasPurchased(false));
    } else {
      setHasPurchased(null);
    }
  }, [productId, role]);

  useEffect(() => {
    if (isVendor && getUserId()) {
      vendorAPI
        .getMe()
        .then((res) => {
          const data = res.data?.data ?? res.data;
          if (data?.vendorId != null) setCurrentVendorId(data.vendorId);
        })
        .catch(() => {});
    }
  }, [isVendor]);

  // Khi Ä‘á»•i thumbnail thÃ¬ thá»­ load láº¡i áº£nh Ä‘Ã³; khi Ä‘á»•i sáº£n pháº©m thÃ¬ xÃ³a tráº¡ng thÃ¡i lá»—i
  useEffect(() => {
    setMainImageErrorIndex(null);
  }, [selectedImageIndex, productId]);

  const fetchProductDetails = async () => {
    if (!productId) return;
    setLoading(true);
    setError("");

    try {
      const response = await customerAPI.getProductDetails(productId);
      const data = response.data?.data ?? response.data;
      if (!data) {
        setError("Product not found");
        setLoading(false);
        return;
      }

      const mainProduct = data.product ?? data;
      const merged = {
        ...mainProduct,
        id: mainProduct.productId ?? mainProduct.id,
        name: mainProduct.productName ?? mainProduct.name,
        averageRating: data.averageRating ?? mainProduct.averageRating ?? 0,
        reviewCount: data.reviewCount ?? mainProduct.reviewCount ?? 0,
        images: data.images ?? mainProduct.images ?? [],
        licenseTiers: data.licenseTiers ?? mainProduct.licenseTiers ?? [],
      };
      setProduct(merged);
      setRelatedProducts(data.relatedProducts ?? []);

      const reviewsRes = await customerAPI.getProductReviews(productId, { page: 0, size: 20 });
      const reviewsPayload = reviewsRes.data?.data ?? reviewsRes.data;
      const content = Array.isArray(reviewsPayload)
        ? reviewsPayload
        : (reviewsPayload?.content ?? reviewsPayload?.reviews ?? []);
      setReviews(Array.isArray(content) ? content : []);
    } catch (err) {
      setError(err.response?.data?.message || "Gửi đánh giá thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const refetchReviewsAndProduct = async () => {
    if (!productId) return;
    try {
      const [detailRes, reviewsRes] = await Promise.all([
        customerAPI.getProductDetails(productId),
        customerAPI.getProductReviews(productId, { page: 0, size: 20 }),
      ]);
      const data = detailRes.data?.data ?? detailRes.data;
      if (data) {
        const mainProduct = data.product ?? data;
        setProduct((p) => ({
          ...p,
          ...mainProduct,
          id: mainProduct.productId ?? mainProduct.id,
          name: mainProduct.productName ?? mainProduct.name,
          averageRating: data.averageRating ?? mainProduct.averageRating ?? 0,
          reviewCount: data.reviewCount ?? mainProduct.reviewCount ?? 0,
          images: data.images ?? mainProduct.images ?? [],
          licenseTiers: data.licenseTiers ?? mainProduct.licenseTiers ?? [],
        }));
      }
      const reviewsPayload = reviewsRes.data?.data ?? reviewsRes.data;
      const content = Array.isArray(reviewsPayload)
        ? reviewsPayload
        : (reviewsPayload?.content ?? reviewsPayload?.reviews ?? []);
      setReviews(Array.isArray(content) ? content : []);
      // Sau khi xÃ³a/sá»­a review, cáº­p nháº­t láº¡i hasPurchased Ä‘á»ƒ form "Viết đánh giá" hiá»‡n láº¡i Ä‘Ãºng cho customer Ä‘Ã£ mua
      if (role === "CUSTOMER" && getUserId()) {
        customerAPI
          .getProductPurchased(productId)
          .then((res) => {
            const purchasedData = res.data?.data ?? res.data;
            setHasPurchased(Boolean(purchasedData?.purchased));
          })
          .catch(() => {});
      }
    } catch (_) {}
  };

  const getImageUrlByIndex = (index) => {
    if (product?.images?.length > index) {
      const item = product.images[index];
      return typeof item === "string" ? item : item?.imageUrl ?? item?.url;
    }
    return "/placeholder-product.jpg";
  };

  const imageUrls = product
    ? [0, 1, 2].map((i) => getImageUrlByIndex(i))
    : [];

  const getApiErrorMessage = (err, fallback) =>
    (typeof err?.response?.data === "string"
      ? err.response.data
      : err?.response?.data?.message) || fallback;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
        <CircularProgress size={48} sx={{ color: theme.accent }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Alert severity="error" sx={{ bgcolor: theme.surfaceRaised, color: theme.text }}>{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Alert severity="info" sx={{ bgcolor: theme.surfaceRaised, color: theme.text }}>Product not found</Alert>
      </Box>
    );
  }

  const productVendorId = product.vendorId ?? product.vendorID;
  const isOwnProduct = isVendor && currentVendorId != null && String(productVendorId) === String(currentVendorId);
  const showBuyButton = !isAdmin && !isOwnProduct;

  const categoryName = product.categoryName ?? product.category;
  const categoryId = product.categoryId ?? product.categoryID;

  return (
    <Box
      className="product-detail-page"
      style={{ width: "100%", boxSizing: "border-box" }}
      sx={{ px: { xs: 2, sm: 3 }, py: 4, maxWidth: 1400, mx: "auto" }}
    >
      <Breadcrumbs
        sx={{
          mb: 4,
          "& a": {
            color: theme.textMuted,
            textDecoration: "none",
            fontWeight: 500,
            transition: "color 0.2s ease",
            "&:hover": { color: theme.accent },
          },
          "& .MuiTypography-root": { color: theme.text, fontWeight: 500 },
          "& .MuiBreadcrumbs-separator": { color: theme.textMuted, opacity: 0.7 },
        }}
      >
        <Link to="/marketplace">
          Marketplace
        </Link>
        {categoryName && (
          <Link to={categoryId != null ? `/marketplace?category=${categoryId}` : "/marketplace"}>
            {categoryName}
          </Link>
        )}
        <Typography>{product.name}</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
          width: "100%",
        }}
      >
        {/* Pháº§n áº£nh: 4 pháº§n - dark surface, khÃ´ng cÃ²n Ã´ tráº¯ng */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "4 4 0%" }, minWidth: 0 }}>
          <Card
            sx={{
              mb: 2,
              bgcolor: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: 520,
                width: "100%",
                bgcolor: theme.surfaceRaised,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src={
                  mainImageErrorIndex === selectedImageIndex
                    ? "/placeholder-product.jpg"
                    : getImageUrlByIndex(selectedImageIndex)
                }
                alt={product.name}
                onError={() => setMainImageErrorIndex(selectedImageIndex)}
                sx={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </Box>
          </Card>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {[0, 1, 2].map((i) => (
              <Card
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                sx={{
                  flex: 1,
                  cursor: "pointer",
                  border: 2,
                  borderRadius: 2,
                  borderColor: selectedImageIndex === i ? theme.accent : theme.border,
                  bgcolor: theme.surface,
                  overflow: "hidden",
                  "&:hover": { borderColor: theme.accent, opacity: 0.95 },
                }}
              >
                <Box
                  sx={{
                    height: 100,
                    bgcolor: theme.surfaceRaised,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={imageUrls[i] || "/placeholder-product.jpg"}
                    alt={`${product.name} ${i + 1}`}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
        {/* Pháº§n thÃ´ng tin: 6 pháº§n */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "6 6 0%" }, minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{ color: theme.text, fontWeight: 700, mb: 1, fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
          >
            {product.name}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.textMuted, mb: 2 }}>
            by <Box component="span" sx={{ color: theme.text, fontWeight: 500 }}>{product.vendorName ?? "Vendor"}</Box>
          </Typography>

          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              px: 2,
              py: 1,
              bgcolor: theme.surfaceRaised,
              borderRadius: 2,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Rating
              value={product.averageRating ?? 0}
              precision={0.1}
              readOnly
              sx={{
                "& .MuiRating-iconFilled": { color: theme.accent },
                "& .MuiRating-iconEmpty": { color: "rgba(230, 237, 243, 0.35)" },
              }}
            />
            <Typography variant="body2" sx={{ color: theme.text, fontWeight: 500 }}>
              ({product.reviewCount ?? 0} reviews)
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{ color: theme.accent, fontWeight: 700, mb: 2, fontSize: "1.5rem" }}
          >
            {product.basePrice != null && product.basePrice > 0
              ? `${Number(product.basePrice).toLocaleString("vi-VN")} ₫`
              : "Miễn phí"}
          </Typography>

          {showBuyButton && (
            <Button
              variant="contained"
              size="large"
              onClick={() => {}}
              sx={{
                mb: 3,
                py: 1.5,
                px: 3,
                bgcolor: theme.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                textTransform: "none",
                "&:hover": { bgcolor: "rgb(230, 85, 15)" },
              }}
            >
              Mua ngay
            </Button>
          )}

          <Typography
            variant="body1"
            sx={{ color: theme.text, mb: 3, lineHeight: 1.6 }}
          >
            {product.description || "No description."}
          </Typography>

          {product.tags?.length > 0 && (
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography component="span" variant="body2" sx={{ color: theme.textMuted, mr: 0.5 }}>
                Tags:
              </Typography>
              {product.tags.map((tag) => {
                const tagName = typeof tag === "string" ? tag : tag?.name ?? tag;
                return (
                  <Link
                    key={tagName}
                    to={`/marketplace?tag=${encodeURIComponent(tagName)}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Chip
                      label={tagName}
                      size="small"
                      component="span"
                      clickable
                      sx={{
                        bgcolor: theme.surfaceRaised,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                        fontWeight: 500,
                        "&:hover": { borderColor: theme.accent, color: theme.accent },
                      }}
                    />
                  </Link>
                );
              })}
            </Box>
          )}

          {product.licenseTiers?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ color: theme.text, fontWeight: 600, mb: 1.5 }}>
                License options
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                {product.licenseTiers.map((tier) => (
                  <Button
                    key={tier.tierId ?? tier.tierID}
                    variant="outlined"
                    disabled
                    sx={{
                      borderColor: theme.border,
                      color: theme.textMuted,
                      "&:disabled": { borderColor: theme.border, color: theme.textMuted },
                    }}
                  >
                    {tier.tierName ?? tier.name} — {tier.price != null ? `${Number(tier.price).toLocaleString("vi-VN")} ₫` : "0 ₫"}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
          {showBuyButton && product.hasTrial && (
            <Button
              variant="outlined"
              disabled
              sx={{
                borderColor: theme.accent,
                color: theme.accent,
                "&:disabled": { borderColor: theme.border, color: theme.textMuted },
              }}
            >
              Start Free Trial (coming soon)
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 8 }}>
        <Typography
          variant="h5"
          sx={{ color: theme.text, fontWeight: 700, mb: 2 }}
        >
          Customer Reviews
        </Typography>
        {(() => {
          const isCustomer = role === "CUSTOMER";
          const currentUserId = getUserId();
          const hasExistingReview = Array.isArray(reviews) && currentUserId
            ? reviews.some((r) => String(r.userId ?? r.userID) === String(currentUserId))
            : false;
          const canReview = !isAdmin && !isVendor && hasPurchased === true && !hasExistingReview;
          return (
            <>
            {isCustomer && hasPurchased === false && (
              <Typography sx={{ color: theme.textMuted, mb: 2 }}>
                Bạn cần mua sản phẩm để có thể đánh giá.
              </Typography>
            )}
            {canReview && (
              <Card
                sx={{
                  mb: 3,
                  bgcolor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ py: 2, px: 2.5 }}>
                  <Typography sx={{ color: theme.text, fontWeight: 600, mb: 1.5 }}>
                    Viết đánh giá
                  </Typography>
                  {reviewError && (
                    <Alert
                      severity="error"
                      sx={{ mb: 1.5, bgcolor: theme.surfaceRaised }}
                      onClose={() => setReviewError("")}
                    >
                      {reviewError}
                    </Alert>
                  )}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography component="span" sx={{ color: theme.textMuted, mr: 1 }}>
                      Số sao:
                    </Typography>
                    <Rating
                      value={reviewRating}
                      onChange={(_, v) => setReviewRating(v ?? 5)}
                      sx={{ "& .MuiRating-iconFilled": { color: theme.accent }, "& .MuiRating-iconEmpty": { color: "rgba(230,237,243,0.35)" } }}
                    />                                       
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder="Nhận xét của bạn (tùy chọn)"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={reviewSubmitting}
                    sx={{
                      mb: 1.5,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: theme.surfaceRaised,
                        color: theme.text,
                        "& fieldset": { borderColor: theme.border },
                        "&:hover fieldset": { borderColor: theme.textMuted },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={async () => {
                      if (!getUserId()) {
                        setReviewError("Bạn cần đăng nhập để đánh giá.");
                        return;
                      }
                      setReviewError("");
                      setReviewSubmitting(true);
                      try {
                        await customerAPI.addProductReview(productId, {
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        setReviewComment("");
                        setReviewRating(5);
                        const [detailRes, reviewsRes] = await Promise.all([
                          customerAPI.getProductDetails(productId),
                          customerAPI.getProductReviews(productId, { page: 0, size: 20 }),
                        ]);
                        const data = detailRes.data?.data ?? detailRes.data;
                        if (data) {
                          const mainProduct = data.product ?? data;
                          const merged = {
                            ...mainProduct,
                            id: mainProduct.productId ?? mainProduct.id,
                            name: mainProduct.productName ?? mainProduct.name,
                            averageRating: data.averageRating ?? mainProduct.averageRating ?? 0,
                            reviewCount: data.reviewCount ?? mainProduct.reviewCount ?? 0,
                            images: data.images ?? mainProduct.images ?? [],
                            licenseTiers: data.licenseTiers ?? mainProduct.licenseTiers ?? [],
                          };
                          setProduct(merged);
                        }
                        const reviewsPayload = reviewsRes.data?.data ?? reviewsRes.data;
                        const content = Array.isArray(reviewsPayload)
                          ? reviewsPayload
                          : (reviewsPayload?.content ?? reviewsPayload?.reviews ?? []);
                        setReviews(Array.isArray(content) ? content : []);
                      } catch (err) {
                        setReviewError(
                          err.response?.data?.message || "Gửi đánh giá thất bại."
                        );
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                    disabled={reviewSubmitting}
                    sx={{
                      bgcolor: theme.accent,
                      color: "#fff",
                      "&:hover": { bgcolor: "rgb(230, 85, 15)" },
                    }}
                  >
                    {reviewSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </CardContent>
              </Card>
            )}
            </>
          );
        })()}
        {reviews.length === 0 ? (
          <Box
            sx={{
              p: 3,
              bgcolor: theme.surface,
              borderRadius: 2,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Typography sx={{ color: theme.textMuted }}>
              Chưa có đánh giá nào. Khi khách hàng để lại đánh giá, mục này sẽ hiển thị tại đây.
            </Typography>
          </Box>
        ) : (
          reviews.map((review) => {
            const rid = review.reviewId ?? review.id;
            const currentUserId = getUserId();
            const isOwnReview = currentUserId && String(review.userId ?? review.userID) === String(currentUserId);
            const isEditing = editingReviewId === rid;
            return (
              <Card
                key={rid}
                sx={{
                  mb: 2,
                  bgcolor: theme.surface,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ py: 2, px: 2.5 }}>
                  {isEditing ? (
                    <>
                      {reviewActionError && (
                        <Alert severity="error" sx={{ mb: 1.5, bgcolor: theme.surfaceRaised }} onClose={() => setReviewActionError("")}>
                          {reviewActionError}
                        </Alert>
                      )}
                      <Box sx={{ mb: 1 }}>
                        <Rating
                          value={editRating}
                          onChange={(_, v) => setEditRating(v ?? 5)}
                          sx={{ "& .MuiRating-iconFilled": { color: theme.accent } }}
                        />
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        disabled={reviewUpdating}
                        sx={{
                          mb: 1.5,
                          "& .MuiOutlinedInput-root": {
                            bgcolor: theme.surfaceRaised,
                            color: theme.text,
                            "& fieldset": { borderColor: theme.border },
                          },
                        }}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={reviewUpdating || rid == null}
                          sx={{ bgcolor: theme.accent }}
                          onClick={async () => {
                            if (rid == null) return;
                            setReviewActionError("");
                            setReviewUpdating(true);
                            try {
                              const rating = Math.max(1, Math.min(5, Number(editRating) || 1));
                              await customerAPI.updateProductReview(rid, {
                                rating,
                                comment: editComment ?? "",
                              });
                              setEditingReviewId(null);
                              await refetchReviewsAndProduct();
                            } catch (e) {
                              setReviewActionError(getApiErrorMessage(e, "Sửa Ä‘Ã¡nh giÃ¡ tháº¥t báº¡i."));
                            } finally {
                              setReviewUpdating(false);
                            }
                          }}
                        >
                          {reviewUpdating ? "Đang lưu..." : "Lưu"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={reviewUpdating}
                          onClick={() => { setEditingReviewId(null); setReviewActionError(""); }}
                          sx={{ borderColor: theme.border, color: theme.textMuted }}
                        >
                          Hủy
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                        <Box>
                          <Rating
                            value={review.rating ?? 0}
                            readOnly
                            size="small"
                            sx={{ "& .MuiRating-iconFilled": { color: theme.accent } }}
                          />
                          <Typography variant="body2" sx={{ color: theme.textMuted, mt: 0.5 }}>
                            {review.fullName ?? review.author ?? "User"} —{" "}
                            {review.createdAt
                              ? new Date(review.createdAt).toLocaleDateString()
                              : ""}
                          </Typography>
                        </Box>
                        {isOwnReview && role === "CUSTOMER" && (
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Button
                              size="small"
                              onClick={() => {
                                setReviewActionError("");
                                setEditingReviewId(rid);
                                setEditRating(review.rating ?? 5);
                                setEditComment(review.comment ?? review.content ?? "");
                              }}
                              sx={{ color: theme.textMuted, minWidth: 0 }}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              disabled={reviewDeleting || rid == null}
                              onClick={async () => {
                                if (rid == null) return;
                                if (!window.confirm("Xóa đánh giá này?")) return;
                                setReviewActionError("");
                                setReviewDeleting(true);
                                try {
                                  await customerAPI.deleteProductReview(rid);
                                  setEditingReviewId(null);
                                  setReviewActionError("");
                                  await refetchReviewsAndProduct();
                                } catch (e) {
                                  setReviewActionError(getApiErrorMessage(e, "Xóa đánh giá thất bại."));
                                } finally {
                                  setReviewDeleting(false);
                                }
                              }}
                            >
                              {reviewDeleting ? "Đang xóa..." : "Xóa"}
                            </Button>
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body1" sx={{ mt: 1, color: theme.text, lineHeight: 1.5 }}>
                        {review.comment ?? review.content}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      {relatedProducts.length > 0 && (
        <Box sx={{ mt: 8 }}>
          <Typography
            variant="h5"
            sx={{ color: theme.text, fontWeight: 700, mb: 3 }}
          >
            Related Products
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: 3,
              overflowX: "auto",
            }}
          >
            {relatedProducts.slice(0, 5).map((related) => {
              const id = related.productId ?? related.id;
              const name = related.productName ?? related.name;
              const price = related.basePrice ?? related.price;
              const img =
                related.images?.[0]?.imageUrl ?? related.images?.[0] ?? "/placeholder-product.jpg";
              return (
                <Card
                  key={id}
                  sx={{
                    cursor: "pointer",
                    height: 300,
                    minHeight: 300,
                    maxHeight: 300,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxSizing: "border-box",
                    bgcolor: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 2,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      borderColor: theme.accent,
                      boxShadow: `0 0 0 1px ${theme.accent}`,
                    },
                  }}
                  onClick={() => navigate(`/products/${id}`)}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 160,
                      minHeight: 160,
                      maxHeight: 160,
                      flexShrink: 0,
                      bgcolor: theme.surfaceRaised,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={typeof img === "string" ? img : "/placeholder-product.jpg"}
                      alt={name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Box>
                  <CardContent
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      py: 1.5,
                      px: 1.5,
                      "&:last-child": { pb: 1.5 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "1rem",
                        height: "2.5rem",
                        minHeight: "2.5rem",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        color: theme.text,
                      }}
                    >
                      {name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: theme.accent,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {price != null && price > 0 ? `${Number(price).toLocaleString("vi-VN")} ₫` : "Miễn phí"}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ProductDetail;

