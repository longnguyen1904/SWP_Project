import React, { useState, useEffect } from "react";
import { customerAPI } from "../../services/api";

const WishlistButton = ({ productId, size = 24, showText = false }) => {
  const [wished, setWished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    customerAPI
      .checkWishlist(productId)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data ?? res?.data;
        setWished(Boolean(data));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (busy) return;

    setWished((prev) => !prev);
    setBusy(true);

    try {
      await customerAPI.toggleWishlist(productId);
    } catch {
      setWished((prev) => !prev);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  return (
    <button
      className={showText ? `btn btn--outline` : `wishlist-btn ${wished ? "wishlist-btn--active" : ""}`}
      onClick={handleToggle}
      disabled={busy}
      title={wished ? "Remove from wishlist" : "Add to wishlist"}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      style={showText ? { display: "flex", alignItems: "center", gap: "8px", color: wished ? "#f86115" : "inherit", borderColor: wished ? "#f86115" : "inherit" } : {}}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={wished ? "#f86115" : "none"}
        stroke={wished ? "#f86115" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showText && <span style={{ fontSize: "0.95rem", fontWeight: "600" }}>{wished ? "Saved to Wishlist" : "Add to Wishlist"}</span>}
    </button>
  );
};

export default WishlistButton;
