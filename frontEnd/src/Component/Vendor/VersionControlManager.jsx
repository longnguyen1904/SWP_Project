import { useState, useEffect, useRef } from "react";
import { vendorAPI, uploadAPI } from "../../services/api";
import "../../Style/Vendor.css";

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const VersionControlManager = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState(null);

  const [formData, setFormData] = useState({ versionNumber: "", fileUrl: "", releaseNotes: "" });
  const [formErrors, setFormErrors] = useState({});

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (selectedProductId) fetchVersions(); }, [selectedProductId]);
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

  const fetchVersions = async () => {
    if (!selectedProductId) return;
    setVersionLoading(true); setError("");
    try {
      const res = await vendorAPI.getProductVersions(selectedProductId, { size: 50, sortBy: "createdAt", sortDir: "desc" });
      const data = res.data?.data ?? res.data;
      setVersions(Array.isArray(data) ? data : data?.content ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách phiên bản");
      setVersions([]);
    } finally { setVersionLoading(false); }
  };

  const openCreateDialog = () => {
    setEditMode(false); setEditingVersionId(null);
    setFormData({ versionNumber: "", fileUrl: "", releaseNotes: "" });
    setFormErrors({}); setSelectedFile(null); setDialogOpen(true);
  };

  const openEditDialog = (v) => {
    setEditMode(true); setEditingVersionId(v.versionId);
    setFormData({ versionNumber: v.versionNumber || "", fileUrl: v.fileUrl || "", releaseNotes: v.releaseNotes || "" });
    setFormErrors({}); setSelectedFile(null); setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false); setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const errs = {};
    if (!formData.versionNumber.trim()) errs.versionNumber = "Số phiên bản không được để trống";
    else if (!SEMVER_REGEX.test(formData.versionNumber.trim())) errs.versionNumber = "Định dạng phải là x.y.z (ví dụ: 1.0.0)";
    if (!formData.fileUrl.trim()) errs.fileUrl = "URL file không được để trống";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validExts = [".exe", ".zip", ".msi", ".dmg", ".pkg", ".jar"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) { setError("Chỉ chấp nhận: exe, zip, msi, dmg, pkg, jar"); return; }
    if (file.size > 500 * 1024 * 1024) { setError("File không được vượt quá 500MB"); return; }
    setSelectedFile(file); setError("");
  };

  const handleUploadToCloud = async () => {
    if (!selectedFile) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const response = await uploadAPI.uploadInstaller(fd);
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, fileUrl: url }));
        setSuccess("Upload file thành công!");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) { setError(err.response?.data?.message || "Upload thất bại."); }
    finally { setUploading(false); }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const payload = { versionNumber: formData.versionNumber.trim(), fileUrl: formData.fileUrl.trim(), releaseNotes: formData.releaseNotes };
      if (editMode) {
        await vendorAPI.updateProductVersion(selectedProductId, editingVersionId, payload);
        setSuccess("Cập nhật phiên bản thành công!");
      } else {
        await vendorAPI.createProductVersion(selectedProductId, payload);
        setSuccess("Tạo phiên bản thành công!");
      }
      closeDialog(); fetchVersions();
    } catch (err) { setError(err.response?.data?.message || "Thao tác thất bại"); }
    finally { setLoading(false); }
  };

  const getProductName = () => {
    const p = products.find((p) => (p.productId ?? p.id) === selectedProductId);
    return p?.productName ?? p?.name ?? "";
  };

  const badgeClass = (status) => {
    switch (status) { case "CLEAN": return "badge-success"; case "INFECTED": return "badge-error"; default: return "badge-warning"; }
  };

  return (
    <div className="vendor-page">
      <div className="vendor-card">
        <div className="vendor-page-header">
          <h2 className="vendor-page-title">🕐 Version Control Manager</h2>
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
              <h3 style={{ color: "#e2e8f0", fontSize: "16px", margin: 0 }}>Phiên bản của "{getProductName()}"</h3>
              <button className="btn btn-primary btn-sm" onClick={openCreateDialog}>+ Tạo phiên bản mới</button>
            </div>

            {versionLoading ? (
              <div className="loading-center"><span className="spinner spinner-lg" /></div>
            ) : versions.length === 0 ? (
              <div className="table-empty">
                <p>Sản phẩm chưa có phiên bản nào</p>
                <button className="btn btn-secondary btn-sm mt-8" onClick={openCreateDialog}>+ Tạo phiên bản đầu tiên</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="vendor-table">
                  <thead>
                    <tr>
                      <th>Phiên bản</th><th>File</th><th>Ghi chú</th><th>Trạng thái quét</th><th>Ngày tạo</th><th style={{ textAlign: "center" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.versionId}>
                        <td><span className="badge badge-primary">v{v.versionNumber}</span></td>
                        <td>{v.fileUrl ? <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="download-link">📥 Tải xuống</a> : "—"}</td>
                        <td className="truncate" style={{ maxWidth: 250 }} title={v.releaseNotes}>{v.releaseNotes || "—"}</td>
                        <td><span className={`badge ${badgeClass(v.scanStatus)}`}>{v.scanStatus || "PENDING"}</span></td>
                        <td>{v.createdAt ? new Date(v.createdAt).toLocaleString("vi-VN") : "—"}</td>
                        <td className="actions">
                          <button className="btn-icon primary" onClick={() => openEditDialog(v)} title="Chỉnh sửa">✏️</button>
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
            <div className="vendor-modal-header">{editMode ? "Chỉnh sửa phiên bản" : "Tạo phiên bản mới"}</div>
            <div className="vendor-modal-body">
              <div className="form-group">
                <label className="form-label">Số phiên bản *</label>
                <input className={`form-input ${formErrors.versionNumber ? "error" : ""}`} placeholder="1.0.0" value={formData.versionNumber}
                  onChange={(e) => setFormData({ ...formData, versionNumber: e.target.value })} />
                {formErrors.versionNumber ? <span className="form-error-text">{formErrors.versionNumber}</span> : <span className="form-hint">Định dạng: x.y.z</span>}
              </div>

              <div className="form-group">
                <label className="form-label">📦 File cài đặt *</label>
                <input ref={fileInputRef} type="file" accept=".exe,.zip,.msi,.dmg,.pkg,.jar" onChange={handleFileSelect} style={{ display: "none" }} />

                {!selectedFile && !formData.fileUrl && (
                  <div className={`drop-zone ${formErrors.fileUrl ? "error" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); }}>
                    <div className="drop-zone-icon">📂</div>
                    <div className="drop-zone-text">Kéo thả file vào đây hoặc <strong>click để chọn</strong></div>
                    <div className="drop-zone-hint">exe, zip, msi, dmg, pkg, jar — Tối đa 500MB</div>
                  </div>
                )}

                {selectedFile && !formData.fileUrl && (
                  <div className="file-preview">
                    <span style={{ fontSize: 24 }}>📎</span>
                    <div className="file-preview-info">
                      <div className="file-preview-name">{selectedFile.name}</div>
                      <div className="file-preview-size">{formatFileSize(selectedFile.size)}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleUploadToCloud} disabled={uploading}>
                      {uploading ? <><span className="spinner" /> Đang upload...</> : "⬆ Upload"}
                    </button>
                    <button className="btn-icon danger" onClick={clearFile} disabled={uploading}>🗑️</button>
                  </div>
                )}

                {formData.fileUrl && (
                  <div className="file-preview success">
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div className="file-preview-info">
                      <div className="file-preview-name">File đã upload!</div>
                      <div className="file-preview-size word-break">{formData.fileUrl}</div>
                    </div>
                    <button className="btn-icon danger" onClick={() => { setFormData((prev) => ({ ...prev, fileUrl: "" })); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>🗑️</button>
                  </div>
                )}

                {uploading && <div className="progress-bar"><div className="progress-bar-fill" /></div>}
                {formErrors.fileUrl && !formData.fileUrl && <span className="form-error-text">{formErrors.fileUrl}</span>}
              </div>

              <div className="form-group">
                <span className="form-hint mb-8" style={{ display: "block" }}>Hoặc dán URL trực tiếp:</span>
                <input className={`form-input ${formErrors.fileUrl ? "error" : ""}`} placeholder="URL tự động điền sau upload" value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú phát hành (Release Notes)</label>
                <textarea className="form-textarea" rows={4} value={formData.releaseNotes}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                  placeholder="Mô tả các thay đổi trong phiên bản này..." />
              </div>
            </div>
            <div className="vendor-modal-footer">
              <button className="btn btn-secondary" onClick={closeDialog}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || uploading}>
                {loading ? <><span className="spinner" /> Đang lưu...</> : editMode ? "Lưu thay đổi" : "Tạo phiên bản"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionControlManager;
