import { useState, useEffect } from "react";
import { vendorAPI } from "../../services/api";
import "../../Style/Vendor.css";

const TIER_PRESETS = [
  { label: "Personal", code: "PER" },
  { label: "Business", code: "BIZ" },
  { label: "Enterprise", code: "ENT" },
];

const LicenseTierConfig = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTier, setDeletingTier] = useState(null);

  const [formData, setFormData] = useState({
    tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (selectedProductId) fetchTiers(); }, [selectedProductId]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(""), 4000); return () => clearTimeout(t); } }, [success]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.getVendorProducts({ size: 100 });
      const data = res.data?.data ?? res.data;
      const content = data?.content ?? data?.products ?? (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(content) ? content : []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách sản phẩm");
    } finally { setLoading(false); }
  };

  const fetchTiers = async () => {
    if (!selectedProductId) return;
    setTierLoading(true); setError("");
    try {
      const res = await vendorAPI.getLicenseTiers(selectedProductId);
      const data = res.data?.data ?? res.data;
      setTiers(Array.isArray(data) ? data : data?.content ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách license tier");
      setTiers([]);
    } finally { setTierLoading(false); }
  };

  const openCreateDialog = () => {
    setEditMode(false); setEditingTierId(null);
    setFormData({ tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "" });
    setFormErrors({}); setDialogOpen(true);
  };

  const openEditDialog = (tier) => {
    setEditMode(true); setEditingTierId(tier.tierId);
    setFormData({
      tierName: tier.tierName || "", tierCode: tier.tierCode || "",
      price: tier.price ?? "", maxDevices: tier.maxDevices ?? 1,
      durationDays: tier.durationDays ?? 365, content: tier.content || "",
    });
    setFormErrors({}); setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);
  const applyPreset = (preset) => setFormData((prev) => ({ ...prev, tierName: preset.label, tierCode: preset.code }));

  const validate = () => {
    const errs = {};
    if (!formData.tierName.trim()) errs.tierName = "Tên tier không được để trống";
    if (!formData.tierCode.trim()) errs.tierCode = "Mã tier không được để trống";
    if (!formData.price || Number(formData.price) <= 0) errs.price = "Giá phải lớn hơn 0";
    if (!formData.maxDevices || Number(formData.maxDevices) < 1) errs.maxDevices = "Số thiết bị tối thiểu là 1";
    if (!formData.durationDays || Number(formData.durationDays) < 1) errs.durationDays = "Số ngày tối thiểu là 1";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    const payload = {
      tierName: formData.tierName.trim(), tierCode: formData.tierCode.trim(),
      price: Number(formData.price), maxDevices: Number(formData.maxDevices),
      durationDays: Number(formData.durationDays), content: formData.content,
    };
    try {
      if (editMode) {
        await vendorAPI.updateLicenseTier(selectedProductId, editingTierId, payload);
        setSuccess("Cập nhật license tier thành công!");
      } else {
        await vendorAPI.createLicenseTier(selectedProductId, payload);
        setSuccess("Tạo license tier thành công!");
      }
      closeDialog(); fetchTiers();
    } catch (err) { setError(err.response?.data?.message || "Thao tác thất bại"); }
    finally { setLoading(false); }
  };

  const handleDeleteClick = (tier) => { setDeletingTier(tier); setDeleteDialogOpen(true); };

  const handleDeleteConfirm = async () => {
    if (!deletingTier) return;
    setLoading(true); setError("");
    try {
      await vendorAPI.deleteLicenseTier(selectedProductId, deletingTier.tierId);
      setSuccess("Xóa license tier thành công!");
      setDeleteDialogOpen(false); setDeletingTier(null); fetchTiers();
    } catch (err) { setError(err.response?.data?.message || "Xóa thất bại"); }
    finally { setLoading(false); }
  };

  const getProductName = () => {
    const p = products.find((p) => (p.productId ?? p.id) === selectedProductId);
    return p?.productName ?? p?.name ?? "";
  };

  const formatPrice = (price) => {
    if (price == null) return "—";
    return `$${Number(price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="vendor-page">
      <div className="vendor-card">
        <div className="vendor-page-header">
          <h2 className="vendor-page-title">📦 License Tier Configuration</h2>
        </div>

        {error && <div className="alert alert-error">{error}<button className="alert-close" onClick={() => setError("")}>×</button></div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <label className="form-label">Chọn sản phẩm</label>
          <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            <option value="">-- Chọn sản phẩm --</option>
            {products.map((p) => {
              const pid = p.productId ?? p.id;
              return <option key={pid} value={pid}>{p.productName ?? p.name} {p.status ? `[${p.status}]` : ""}</option>;
            })}
          </select>
        </div>

        {selectedProductId && (
          <>
            <div className="flex-between mb-16">
              <h3 style={{ color: "#e2e8f0", fontSize: "16px", margin: 0 }}>License Tiers của "{getProductName()}"</h3>
              <button className="btn btn-primary btn-sm" onClick={openCreateDialog}>+ Tạo tier mới</button>
            </div>

            {tierLoading ? (
              <div className="loading-center"><span className="spinner spinner-lg" /></div>
            ) : tiers.length === 0 ? (
              <div className="table-empty">
                <p>Sản phẩm chưa có license tier nào</p>
                <button className="btn btn-secondary btn-sm mt-8" onClick={openCreateDialog}>+ Tạo tier đầu tiên</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="vendor-table">
                  <thead>
                    <tr>
                      <th>Tên Tier</th><th>Mã</th><th>Giá</th><th>Thiết bị tối đa</th><th>Thời hạn</th><th>Mô tả</th><th style={{ textAlign: "center" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((tier) => (
                      <tr key={tier.tierId}>
                        <td><span className="badge badge-primary">{tier.tierName}</span></td>
                        <td><span className="badge badge-default">{tier.tierCode || "—"}</span></td>
                        <td style={{ fontWeight: 600, color: "#34d399" }}>{formatPrice(tier.price)}</td>
                        <td>{tier.maxDevices ?? "—"}</td>
                        <td>{tier.durationDays ? `${tier.durationDays} ngày` : "—"}</td>
                        <td className="truncate" style={{ maxWidth: 200 }} title={tier.content}>{tier.content || "—"}</td>
                        <td className="actions">
                          <button className="btn-icon primary" onClick={() => openEditDialog(tier)} title="Chỉnh sửa">✏️</button>
                          <button className="btn-icon danger" onClick={() => handleDeleteClick(tier)} title="Xóa">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {dialogOpen && (
        <div className="modal-overlay" onClick={closeDialog}>
          <div className="vendor-modal vendor-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">{editMode ? "Chỉnh sửa License Tier" : "Tạo License Tier mới"}</div>
            <div className="vendor-modal-body">
              {!editMode && (
                <div className="mb-16">
                  <span className="form-hint" style={{ display: "block", marginBottom: 8 }}>Chọn nhanh từ mẫu:</span>
                  <div className="chip-row">
                    {TIER_PRESETS.map((preset) => (
                      <button key={preset.code} className={`chip ${formData.tierName === preset.label ? "active" : ""}`}
                        onClick={() => applyPreset(preset)}>{preset.label}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tên Tier *</label>
                  <input className={`form-input ${formErrors.tierName ? "error" : ""}`} placeholder="e.g., Personal, Business" value={formData.tierName}
                    onChange={(e) => setFormData({ ...formData, tierName: e.target.value })} />
                  {formErrors.tierName && <span className="form-error-text">{formErrors.tierName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Mã Tier *</label>
                  <input className={`form-input ${formErrors.tierCode ? "error" : ""}`} placeholder="e.g., PER, BIZ" value={formData.tierCode}
                    onChange={(e) => setFormData({ ...formData, tierCode: e.target.value })} />
                  {formErrors.tierCode && <span className="form-error-text">{formErrors.tierCode}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá ($) *</label>
                  <input className={`form-input ${formErrors.price ? "error" : ""}`} type="number" placeholder="9.99" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} min="0.01" step="0.01" />
                  {formErrors.price && <span className="form-error-text">{formErrors.price}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Số thiết bị tối đa *</label>
                  <input className={`form-input ${formErrors.maxDevices ? "error" : ""}`} type="number" value={formData.maxDevices}
                    onChange={(e) => setFormData({ ...formData, maxDevices: e.target.value })} min="1" />
                  {formErrors.maxDevices && <span className="form-error-text">{formErrors.maxDevices}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Thời hạn (ngày) *</label>
                  <input className={`form-input ${formErrors.durationDays ? "error" : ""}`} type="number" value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })} min="1" />
                  {formErrors.durationDays && <span className="form-error-text">{formErrors.durationDays}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả / Quyền sử dụng</label>
                <textarea className="form-textarea" rows={4} value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Mô tả các quyền lợi, giới hạn sử dụng, tính năng bao gồm trong tier này..." />
              </div>
            </div>
            <div className="vendor-modal-footer">
              <button className="btn btn-secondary" onClick={closeDialog}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Đang lưu...</> : editMode ? "Lưu thay đổi" : "Tạo tier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDialogOpen && (
        <div className="modal-overlay" onClick={() => setDeleteDialogOpen(false)}>
          <div className="vendor-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">Xóa License Tier</div>
            <div className="vendor-modal-body">
              <p style={{ color: "#e2e8f0" }}>Bạn có chắc muốn xóa tier "{deletingTier?.tierName}"? Thao tác này không thể hoàn tác.</p>
            </div>
            <div className="vendor-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteDialogOpen(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={loading}>
                {loading ? <><span className="spinner" /> Đang xóa...</> : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseTierConfig;
