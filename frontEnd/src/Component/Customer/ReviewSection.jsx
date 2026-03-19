import React, { useState, useMemo } from "react";
import StarRating from "./StarRating";
import { customerAPI } from "../../services/api";
import { getCurrentUserId, getApiErrorMessage } from "../../services/apiHelpers";

const ReviewSection = ({
  reviews = [],
  productId,
  hasPurchased,
  role,
  isAdmin,
  isVendor,
  onReviewsChanged,
}) => {
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 3;

  const currentUserId = getCurrentUserId();
  const isCustomer = role === "CUSTOMER";
  const hasExistingReview =
    Array.isArray(reviews) &&
    currentUserId &&
    reviews.some((r) => String(r.userId) === String(currentUserId));
  const canCreateReview = !isAdmin && !isVendor && hasPurchased === true && !hasExistingReview;

  const handleSubmitReview = async () => {
    if (!getCurrentUserId()) {
      setSubmitError("Bạn cần đăng nhập để đánh giá.");
      return;
    }
    setSubmitError("");
    setIsSubmitting(true);
    try {
      await customerAPI.addProductReview(productId, { rating: newRating, comment: newComment });
      setNewComment("");
      setNewRating(5);
      onReviewsChanged();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Gửi đánh giá thất bại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (reviewId) => {
    if (reviewId == null) return;
    setActionError("");
    setIsUpdating(true);
    try {
      const rating = Math.max(1, Math.min(5, Number(editRating) || 1));
      await customerAPI.updateProductReview(reviewId, { rating, comment: editComment ?? "" });
      setEditingReviewId(null);
      onReviewsChanged();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Sửa đánh giá thất bại."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (reviewId == null) return;
    if (!window.confirm("Xóa đánh giá này?")) return;
    setActionError("");
    setIsDeleting(true);
    try {
      await customerAPI.deleteProductReview(reviewId);
      setEditingReviewId(null);
      setActionError("");
      onReviewsChanged();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Xóa đánh giá thất bại."));
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (review) => {
    setActionError("");
    setEditingReviewId(review.reviewId);
    setEditRating(review.rating ?? 5);
    setEditComment(review.comment ?? "");
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setActionError("");
  };

  return (
    <div className="reviews">
      <h2 className="reviews__title">Customer Reviews</h2>

      {isCustomer && hasPurchased === false && (
        <p className="reviews__notice">
          Bạn cần mua sản phẩm để có thể đánh giá.
        </p>
      )}

      {canCreateReview && (
        <div className="review-form">
          <h3 className="review-form__title">Viết đánh giá</h3>
          {submitError && (
            <div className="alert alert--error">
              {submitError}
              <button className="alert__close" onClick={() => setSubmitError("")}>×</button>
            </div>
          )}
          <div className="review-form__rating-row">
            <span className="review-form__rating-label">Số sao:</span>
            <StarRating value={newRating} onChange={(v) => setNewRating(v)} />
          </div>
          <textarea
            className="review-form__textarea"
            placeholder="Nhận xét của bạn (tùy chọn)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            className="btn btn--primary"
            onClick={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="reviews__empty">
          Chưa có đánh giá nào. Khi khách hàng để lại đánh giá, mục này sẽ hiển thị tại đây.
        </div>
      ) : (
        (() => {
          const totalReviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
          const pagedReviews = reviews.slice(
            (reviewPage - 1) * REVIEWS_PER_PAGE,
            reviewPage * REVIEWS_PER_PAGE,
          );
          return (
            <>
              {pagedReviews.map((review) => {
                const rid = review.reviewId;
                const isOwnReview =
                  currentUserId && String(review.userId) === String(currentUserId);
                const isEditing = editingReviewId === rid;

                return (
                  <div key={rid} className="review-card">
                    {isEditing ? (
                      <>
                        {actionError && (
                          <div className="alert alert--error">
                            {actionError}
                            <button className="alert__close" onClick={() => setActionError("")}>×</button>
                          </div>
                        )}
                        <div style={{ marginBottom: 8 }}>
                          <StarRating value={editRating} onChange={(v) => setEditRating(v)} />
                        </div>
                        <textarea
                          className="review-form__textarea"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          disabled={isUpdating}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn btn--primary btn--small"
                            disabled={isUpdating || rid == null}
                            onClick={() => handleUpdateReview(rid)}
                          >
                            {isUpdating ? "Đang lưu..." : "Lưu"}
                          </button>
                          <button
                            className="btn btn--outline btn--small"
                            disabled={isUpdating}
                            onClick={cancelEditing}
                          >
                            Hủy
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="review-card__header">
                          <div>
                            <StarRating value={review.rating ?? 0} readOnly />
                            <p className="review-card__meta">
                              {review.fullName ?? "User"} —{" "}
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                          {isOwnReview && role === "CUSTOMER" && (
                            <div className="review-card__actions">
                              <button className="btn btn--outline btn--small" onClick={() => startEditing(review)}>Sửa</button>
                              <button
                                className="btn btn--outline btn--small btn--danger"
                                disabled={isDeleting || rid == null}
                                onClick={() => handleDeleteReview(rid)}
                              >
                                {isDeleting ? "Đang xóa..." : "Xóa"}
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="review-card__body">{review.comment}</p>
                      </>
                    )}
                  </div>
                );
              })}

              {totalReviewPages > 1 && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button
                    className="pagination__btn"
                    disabled={reviewPage <= 1}
                    onClick={() => setReviewPage((p) => p - 1)}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`pagination__btn ${p === reviewPage ? "pagination__btn--active" : ""}`}
                      onClick={() => setReviewPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="pagination__btn"
                    disabled={reviewPage >= totalReviewPages}
                    onClick={() => setReviewPage((p) => p + 1)}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          );
        })()
      )}
    </div>
  );
};

export default ReviewSection;
