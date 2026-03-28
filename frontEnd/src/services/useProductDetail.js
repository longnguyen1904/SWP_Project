import { useState, useEffect } from "react";
import { customerAPI, vendorAPI } from "./api";
import { unwrapResponse, getCurrentUserId } from "./apiHelpers";

const useProductDetail = (productId) => {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isVendor = role === "VENDOR";

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [latestVersion, setLatestVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasPurchased, setHasPurchased] = useState(null);
  const [currentVendorId, setCurrentVendorId] = useState(null);

  const normalizeProduct = (data) => {
    const raw = data.product || data;
    return {
      ...raw,
      id: raw.productId,
      name: raw.productName,
      averageRating: data.averageRating || raw.averageRating || 0,
      reviewCount: data.reviewCount || raw.reviewCount || 0,
      images: data.images || raw.images || [],
      licenseTiers: data.licenseTiers || raw.licenseTiers || [],
    };
  };

  const parseReviews = (res) => {
    const payload = unwrapResponse(res);
    return (payload && payload.content) ? payload.content : [];
  };

  useEffect(() => {
    if (!productId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await customerAPI.getProductDetails(productId);
        const data = unwrapResponse(response);
        if (!data) {
          setError("Product not found");
          return;
        }

        setProduct(normalizeProduct(data));
        setRelatedProducts(data.relatedProducts || []);

        const reviewsRes = await customerAPI.getProductReviews(productId, {
          page: 0,
          size: 20,
        });
        setReviews(parseReviews(reviewsRes));

        customerAPI
          .getLatestVersion(productId)
          .then((vRes) => setLatestVersion(unwrapResponse(vRes)))
          .catch(() => setLatestVersion(null));
      } catch (err) {
        setError(
          (err.response && err.response.data && err.response.data.message)
            || "Failed to load product details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [productId]);

  useEffect(() => {
    if (role === "CUSTOMER" && productId && getCurrentUserId()) {
      customerAPI
        .getProductPurchased(productId)
        .then((res) => {
          const data = unwrapResponse(res);
          setHasPurchased(Boolean(data && data.purchased));
        })
        .catch(() => setHasPurchased(false));
    } else {
      setHasPurchased(null);
    }
  }, [productId, role]);

  useEffect(() => {
    if (isVendor && getCurrentUserId()) {
      vendorAPI
        .getMe()
        .then((res) => {
          const data = unwrapResponse(res);
          if (data && data.vendorId != null) setCurrentVendorId(data.vendorId);
        })
        .catch(() => {});
    }
  }, [isVendor]);

  const refetchReviewsAndProduct = async () => {
    if (!productId) return;
    try {
      const [detailRes, reviewsRes] = await Promise.all([
        customerAPI.getProductDetails(productId),
        customerAPI.getProductReviews(productId, { page: 0, size: 20 }),
      ]);
      const data = unwrapResponse(detailRes);
      if (data) {
        setProduct((prev) => ({ ...prev, ...normalizeProduct(data) }));
      }
      setReviews(parseReviews(reviewsRes));

      if (role === "CUSTOMER" && getCurrentUserId()) {
        customerAPI
          .getProductPurchased(productId)
          .then((res) => {
            const purchasedData = unwrapResponse(res);
            setHasPurchased(Boolean(purchasedData && purchasedData.purchased));
          })
          .catch(() => {});
      }
    } catch (e) {
      throw new Error(e);
    }
  };

  const productVendorId = product ? product.vendorId : null;
  const isOwnProduct =
    isVendor &&
    currentVendorId != null &&
    String(productVendorId) === String(currentVendorId);
  const showBuyButton = !isAdmin && !isOwnProduct;

  return {
    product,
    reviews,
    relatedProducts,
    loading,
    error,
    hasPurchased,
    role,
    isAdmin,
    isVendor,
    showBuyButton,
    isOwnProduct,
    latestVersion,
    refetchReviewsAndProduct,
  };
};

export default useProductDetail;
