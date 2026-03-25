import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { customerAPI } from "../services/api";
import "../Style/Wishlist.css";

const PAGE_SIZE = 6;

export default function FollowedVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingIds, setUnfollowingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await customerAPI.getMyFollowedVendors();
        const data = res.data?.data ?? res.data ?? [];
        setVendors(Array.isArray(data) ? data : []);
      } catch {
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredVendors = useMemo(() => {
    if (!searchQuery) return vendors;
    const q = searchQuery.toLowerCase();
    return vendors.filter((v) => {
      const name = (v.companyName || v.displayName || "").toLowerCase();
      return name.includes(q);
    });
  }, [vendors, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));
  const pagedVendors = filteredVendors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleUnfollow = async (vendorId) => {
    setUnfollowingIds((prev) => new Set(prev).add(vendorId));
    try {
      await customerAPI.followVendor(vendorId);
      setVendors((prev) => prev.filter((v) => v.vendorId !== vendorId));
    } catch {
      alert("Unable to unfollow. Please try again.");
    } finally {
      setUnfollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(vendorId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <h2 className="wishlist-page__title">Followed Vendors</h2>
        <div className="wishlist-page__loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h2 className="wishlist-page__title">
        Followed Vendors
        {vendors.length > 0 && (
          <span className="wishlist-page__count">{vendors.length}</span>
        )}
      </h2>

      {vendors.length > 0 && (
        <div className="wishlist-filters">
          <input
            type="text"
            className="wishlist-filters__search"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn btn--outline btn--sm" onClick={() => setSearchQuery("")}>
              Clear
            </button>
          )}
        </div>
      )}

      {vendors.length === 0 ? (
        <div className="wishlist-page__empty">
          <div className="wishlist-page__empty-icon">👥</div>
          <p>You are not following any vendors yet.</p>
          <button className="btn btn--primary" onClick={() => navigate("/marketplace")}>
            Explore Marketplace
          </button>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="wishlist-page__empty">
          <p>No matching vendors found.</p>
          <button className="btn btn--outline" onClick={() => setSearchQuery("")}>
            Clear filter
          </button>
        </div>
      ) : (
        <>
          <table className="wishlist-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Vendor</th>
                <th>Type</th>
                <th>Followed Since</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedVendors.map((v) => {
                const isRemoving = unfollowingIds.has(v.vendorId);
                return (
                  <tr key={v.vendorId} className="wishlist-table__row">
                    <td className="wishlist-table__img-cell">
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #667eea, #764ba2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#fff",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/vendors/${v.vendorId}`)}
                      >
                        {(v.displayName || "V").charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <span
                        className="wishlist-table__name"
                        onClick={() => navigate(`/vendors/${v.vendorId}`)}
                      >
                        {v.companyName || v.displayName || "Vendor"}
                      </span>
                    </td>
                    <td className="wishlist-table__category">
                      {v.type === "COMPANY" ? "Company" : "Individual"}
                    </td>
                    <td className="wishlist-table__category">
                      {v.followedAt
                        ? new Date(v.followedAt).toLocaleDateString("en-US")
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="btn btn--outline btn--sm"
                        onClick={() => handleUnfollow(v.vendorId)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? "..." : "Unfollow"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: 24 }}>
              <button
                className="pagination__btn"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination__btn ${page === currentPage ? "pagination__btn--active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination__btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
