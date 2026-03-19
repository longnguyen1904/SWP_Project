import React, { useState, useEffect } from "react";
import { couponAPI, vendorAPI } from "../services/api";
import { unwrapResponse, getApiErrorMessage } from "../services/apiHelpers";

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
      setSuccess("Tạo coupon thành công!");
      setForm({ code: "", discountPercent: "", maxUses: "", expiresAt: "", productId: "" });
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      setError(getApiErrorMessage(err, "Có lỗi xảy ra"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa coupon này?")) return;
    try {
      await couponAPI.deleteCoupon(id);
      fetchCoupons();
    } catch {
      alert("Không thể xóa coupon");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Không giới hạn";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center p-5">
        <div className="spinner-border text-info" role="status" />
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Quản lý mã giảm giá</h2>
        <button className="btn btn-info text-dark fw-bold" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Đóng" : "+ Tạo coupon mới"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card bg-dark border-secondary mb-4">
          <div className="card-body">
            <h5 className="card-title text-info mb-3">Tạo coupon mới</h5>
            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Mã coupon</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SALE20"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Giảm (%)</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    min="1"
                    max="100"
                    placeholder="20"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Lượt dùng tối đa</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    min="1"
                    placeholder="Không giới hạn"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Ngày hết hạn</label>
                  <input
                    type="date"
                    className="form-control bg-dark text-white border-secondary"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label">Áp dụng cho sản phẩm</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  >
                    <option value="">Tất cả sản phẩm của tôi</option>
                    {products.map((p) => (
                      <option key={p.productId ?? p.productID} value={p.productId ?? p.productID}>
                        {p.productName ?? p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button type="submit" className="btn btn-success w-100">Tạo</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="text-center text-white-50 py-5">
          <i className="bi bi-ticket-perforated display-1"></i>
          <p className="mt-3">Bạn chưa có coupon nào. Bấm "Tạo coupon mới" để bắt đầu!</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle">
            <thead>
              <tr className="text-info">
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Sản phẩm</th>
                <th>Đã dùng</th>
                <th>Tối đa</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isMaxed = c.maxUses && c.currentUses >= c.maxUses;
                const status = !c.isActive ? "Vô hiệu" : isExpired ? "Hết hạn" : isMaxed ? "Hết lượt" : "Hoạt động";
                const badgeClass = status === "Hoạt động" ? "bg-success" : "bg-secondary";

                return (
                  <tr key={c.couponId}>
                    <td><code className="text-warning fs-6">{c.code}</code></td>
                    <td>{c.discountPercent}%</td>
                    <td className="text-white-50">{c.product?.productName ?? "Tất cả"}</td>
                    <td>{c.currentUses ?? 0}</td>
                    <td>{c.maxUses ?? "∞"}</td>
                    <td>{formatDate(c.expiresAt)}</td>
                    <td><span className={`badge ${badgeClass}`}>{status}</span></td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(c.couponId)}
                      >
                        Xóa
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
