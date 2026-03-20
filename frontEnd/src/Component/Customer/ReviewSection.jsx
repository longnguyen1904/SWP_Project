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
  const [reviewSort, setReviewSort] = useState("newest");
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
      setSubmitError("Please log in to leave a review.");
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
      setSubmitError(getApiErrorMessage(err, "Failed to submit review."));
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
      setActionError(getApiErrorMessage(err, "Failed to update review."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (reviewId == null) return;
    if (!window.confirm("Delete this review?")) return;
    setActionError("");
    setIsDeleting(true);
    try {
      await customerAPI.deleteProductReview(reviewId);
      setEditingReviewId(null);
      setActionError("");
      onReviewsChanged();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to delete review."));
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
      <div className="reviews__header">
        <h2 className="reviews__title">Customer Reviews</h2>
        {reviews.length > 0 && (
          <select
            className="reviews__sort"
            value={reviewSort}
            onChange={(e) => { setReviewSort(e.target.value); setReviewPage(1); }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        )}
      </div>

      {isCustomer && hasPurchased === false && (
        <p className="reviews__notice">
          You need to purchase this product to leave a review.
        </p>
      )}

      {canCreateReview && (
        <div className="review-form">
          <h3 className="review-form__title">Write a Review</h3>
          {submitError && (
            <div className="alert alert--error">
              {submitError}
              <button className="alert__close" onClick={() => setSubmitError("")}>×</button>
            </div>
          )}
          <div className="review-form__rating-row">
            <span className="review-form__rating-label">Rating:</span>
            <StarRating value={newRating} onChange={(v) => setNewRating(v)} />
          </div>
          <textarea
            className="review-form__textarea"
            placeholder="Your comment (optional)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSubmitting}
          />
          <button
            className="btn btn--primary"
            onClick={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="reviews__empty">
          No reviews yet. Customer reviews will appear here.
        </div>
      ) : (
        (() => {
          const sortedReviews = [...reviews].sort((a, b) => {
            const da = new Date(a.createdAt || 0);
            const db = new Date(b.createdAt || 0);
            return reviewSort === "newest" ? db - da : da - db;
          });
          const totalReviewPages = Math.max(1, Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE));
          const pagedReviews = sortedReviews.slice(
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
                            {isUpdating ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="btn btn--outline btn--small"
                            disabled={isUpdating}
                            onClick={cancelEditing}
                          >
                            Cancel
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
                              <button className="btn btn--outline btn--small" onClick={() => startEditing(review)}>Edit</button>
                              <button
                                className="btn btn--outline btn--small btn--danger"
                                disabled={isDeleting || rid == null}
                                onClick={() => handleDeleteReview(rid)}
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
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
