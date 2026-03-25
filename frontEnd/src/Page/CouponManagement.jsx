import React, { useState, useEffect } from "react";
import { couponAPI, vendorAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";
import "../Style/Vendor.css";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: "", maxUses: "", expiresAt: "", productId: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [products, setProducts] = useState([]);

  const fetchCoupons = async () => {
    try {
      const res = await couponAPI.getCoupons();
      const data = unwrapResponse(res);
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await vendorAPI.getVendorProducts({ size: 100 });
      const data = unwrapResponse(res);
      const list = data?.content ?? data;
      setProducts(Array.isArray(list) ? list : []);
    } catch { setProducts([]); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const body = {
        code: form.code,
        discountPercent: parseInt(form.discountPercent),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt ? form.expiresAt + "T23:59:59" : null,
        productId: form.productId ? parseInt(form.productId) : null,
      };
      await couponAPI.createCoupon(body);
      setSuccess("Coupon created successfully!");
      setForm({ code: "", discountPercent: "", maxUses: "", expiresAt: "", productId: "" });
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      setError(getApiErrorMessage(err, "An error occurred"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await couponAPI.deleteCoupon(id);
      fetchCoupons();
    } catch {
      alert("Could not delete coupon");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No limit";
    return new Date(dateStr).toLocaleDateString("en-US");
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="vendor-page-header">
        <h2 className="vendor-page-title">Coupon Management</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Close" : "+ Create Coupon"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="alert-close" onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          {success}
          <button className="alert-close" onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {showForm && (
        <div className="vendor-card mb-24">
          <div className="section-title">Create New Coupon</div>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SALE20"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                  min="1"
                  max="100"
                  placeholder="20"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Uses</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Apply to Product</label>
                <select
                  className="form-select"
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                >
                  <option value="">All my products</option>
                  {products.map((p) => (
                    <option key={p.productId ?? p.productID} value={p.productId ?? p.productID}>
                      {p.productName ?? p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 0, alignSelf: "flex-end" }}>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="table-empty">
          <p>You don't have any coupons yet.</p>
          <p style={{ fontSize: 13, color: "#64748b" }}>Click "+ Create Coupon" to get started.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="vendor-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Product</th>
                <th>Used</th>
                <th>Max</th>
                <th>Expires</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isMaxed = c.maxUses && c.currentUses >= c.maxUses;
                const status = !c.isActive ? "Disabled" : isExpired ? "Expired" : isMaxed ? "Used Up" : "Active";
                const badgeClass =
                  status === "Active" ? "badge-success" :
                  status === "Expired" ? "badge-error" :
                  status === "Used Up" ? "badge-warning" : "badge-default";

                return (
                  <tr key={c.couponId}>
                    <td><code style={{ color: "#fbbf24", fontSize: 14 }}>{c.code}</code></td>
                    <td>{c.discountPercent}%</td>
                    <td style={{ color: "#94a3b8" }}>{c.product?.productName ?? "All"}</td>
                    <td>{c.currentUses ?? 0}</td>
                    <td>{c.maxUses ?? "∞"}</td>
                    <td>{formatDate(c.expiresAt)}</td>
                    <td><span className={`badge ${badgeClass}`}>{status}</span></td>
                    <td className="actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(c.couponId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
