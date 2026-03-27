import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { vendorAPI, uploadAPI } from "../../services/api";
import useVendorProducts from "../../services/useVendorProducts";
import "../../Style/Vendor.css";

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const VersionControlManager = () => {
  const [searchParams] = useSearchParams();
  const { products, loading: productsLoading } = useVendorProducts();
  const [selectedProductId, setSelectedProductId] = useState("");

  useEffect(() => {
    const pid = searchParams.get("productId");
    if (pid && !selectedProductId) setSelectedProductId(pid);
  }, [searchParams]);
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

  useEffect(() => { if (selectedProductId) fetchVersions(); }, [selectedProductId]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(""), 4000); return () => clearTimeout(t); } }, [success]);

  const fetchVersions = async () => {
    if (!selectedProductId) return;
    setVersionLoading(true); setError("");
    try {
      const res = await vendorAPI.getProductVersions(selectedProductId, { size: 50, sortBy: "createdAt", sortDir: "desc" });
      const data = res.data?.data ?? res.data;
      setVersions(Array.isArray(data) ? data : data?.content ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Cannot load version list");
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
    if (!formData.versionNumber.trim()) errs.versionNumber = "Version number is required";
    else if (!SEMVER_REGEX.test(formData.versionNumber.trim())) errs.versionNumber = "Format must be x.y.z (e.g., 1.0.0)";
    if (!formData.fileUrl.trim()) errs.fileUrl = "File URL is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validExts = [".exe", ".zip", ".msi", ".dmg", ".pkg", ".jar"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) { setError("Only accepted: exe, zip, msi, dmg, pkg, jar"); return; }
    if (file.size > 500 * 1024 * 1024) { setError("File must not exceed 500MB"); return; }
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
        setSuccess("File uploaded successfully!");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) { setError(err.response?.data?.message || "Upload failed."); }
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
        setSuccess("Version updated successfully!");
      } else {
        await vendorAPI.createProductVersion(selectedProductId, payload);
        setSuccess("Version created successfully!");
      }
      closeDialog(); fetchVersions();
    } catch (err) { setError(err.response?.data?.message || "Operation failed"); }
    finally { setLoading(false); }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!window.confirm("Are you sure you want to delete this version?")) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      await vendorAPI.deleteProductVersion(selectedProductId, versionId);
      setSuccess("Version deleted!");
      fetchVersions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete version");
    } finally { setLoading(false); }
  };

  const getProductName = () => {
    const numId = Number(selectedProductId);
    const p = products.find((p) => (p.productId ?? p.id) === numId);
    return p?.productName ?? p?.name ?? "";
  };

  const badgeClass = (status) => {
    switch (status) { case "CLEAN": return "badge-success"; case "INFECTED": return "badge-error"; default: return "badge-warning"; }
  };

  return (
    <div className="vendor-page">
      <div className="vendor-card">
        <div className="vendor-page-header">
          <h2 className="vendor-page-title">Version Control Manager</h2>
        </div>

        {error && <div className="alert alert-error">{error}<button className="alert-close" onClick={() => setError("")}>×</button></div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="form-group">
          <label className="form-label">Select Product</label>
          <select className="form-select" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
            <option value="">-- Select product --</option>
            {products.map((p) => {
              const pid = p.productId ?? p.id;
              return <option key={pid} value={pid}>{p.productName ?? p.name} {p.status ? `[${p.status}]` : ""}</option>;
            })}
          </select>
        </div>

        {selectedProductId && (
          <>
            <div className="flex-between mb-16">
              <h3 style={{ color: "#e2e8f0", fontSize: "16px", margin: 0 }}>Versions of "{getProductName()}"</h3>
              <button className="btn btn-primary btn-sm" onClick={openCreateDialog}>+ New Version</button>
            </div>

            {versionLoading ? (
              <div className="loading-center"><span className="spinner spinner-lg" /></div>
            ) : versions.length === 0 ? (
              <div className="table-empty">
                <p>This product has no versions yet</p>
                <button className="btn btn-secondary btn-sm mt-8" onClick={openCreateDialog}>+ Create First Version</button>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="vendor-table">
                  <thead>
                    <tr>
                      <th>Version</th><th>File</th><th>Notes</th><th>Scan Status</th><th>Created</th><th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.versionId}>
                        <td><span className="badge badge-primary">v{v.versionNumber}</span></td>
                        <td>{v.fileUrl ? <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="download-link">Download</a> : "—"}</td>
                        <td className="truncate" style={{ maxWidth: 250 }} title={v.releaseNotes}>{v.releaseNotes || "—"}</td>
                        <td>
                          <span className={`badge ${badgeClass(v.scanStatus)}`}>{v.scanStatus || "PENDING"}</span>
                          {v.scanStatus === "INFECTED" && <span style={{ color: "#ff4d4d", fontSize: 12, marginLeft: 6 }}>⚠ File may be unsafe</span>}
                        </td>
                        <td>{v.createdAt ? new Date(v.createdAt).toLocaleString("vi-VN") : "—"}</td>
                        <td className="actions">
                          <button className="btn-icon primary" onClick={() => openEditDialog(v)} title="Edit">Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVersion(v.versionId)} title="Delete">Delete</button>
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
            <div className="vendor-modal-header">{editMode ? "Edit Version" : "Create New Version"}</div>
            <div className="vendor-modal-body">
              <div className="form-group">
                <label className="form-label">Version Number *</label>
                <input className={`form-input ${formErrors.versionNumber ? "error" : ""}`} placeholder="1.0.0" value={formData.versionNumber}
                  onChange={(e) => setFormData({ ...formData, versionNumber: e.target.value })} />
                {formErrors.versionNumber ? <span className="form-error-text">{formErrors.versionNumber}</span> : <span className="form-hint">Format: x.y.z</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Installer File *</label>
                <input ref={fileInputRef} type="file" accept=".exe,.zip,.msi,.dmg,.pkg,.jar" onChange={handleFileSelect} style={{ display: "none" }} />

                {!selectedFile && !formData.fileUrl && (
                  <div className={`drop-zone ${formErrors.fileUrl ? "error" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); }}>
                    <div className="drop-zone-icon"></div>
                    <div className="drop-zone-text">Drag and drop file here or <strong>click to select</strong></div>
                    <div className="drop-zone-hint">exe, zip, msi, dmg, pkg, jar — Max 500MB</div>
                  </div>
                )}

                {selectedFile && !formData.fileUrl && (
                  <div className="file-preview">
                    <span style={{ fontSize: 24 }}></span>
                    <div className="file-preview-info">
                      <div className="file-preview-name">{selectedFile.name}</div>
                      <div className="file-preview-size">{formatFileSize(selectedFile.size)}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleUploadToCloud} disabled={uploading}>
                      {uploading ? <><span className="spinner" /> Uploading...</> : "Upload"}
                    </button>
                    <button className="btn-icon danger" onClick={clearFile} disabled={uploading}>Remove</button>
                  </div>
                )}

                {formData.fileUrl && (
                  <div className="file-preview success">
                    <span style={{ fontSize: 24 }}></span>
                    <div className="file-preview-info">
                      <div className="file-preview-name">File uploaded!</div>
                      <div className="file-preview-size word-break">{formData.fileUrl}</div>
                    </div>
                    <button className="btn-icon danger" onClick={() => { setFormData((prev) => ({ ...prev, fileUrl: "" })); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>Remove</button>
                  </div>
                )}

                {uploading && <div className="progress-bar"><div className="progress-bar-fill" /></div>}
                {formErrors.fileUrl && !formData.fileUrl && <span className="form-error-text">{formErrors.fileUrl}</span>}
              </div>

              <div className="form-group">
                <span className="form-hint mb-8" style={{ display: "block" }}>Or paste URL directly:</span>
                <input className={`form-input ${formErrors.fileUrl ? "error" : ""}`} placeholder="URL will be auto-filled after upload" value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Release Notes</label>
                <textarea className="form-textarea" rows={4} value={formData.releaseNotes}
                  onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                  placeholder="Describe the changes in this version..." />
              </div>
            </div>
            <div className="vendor-modal-footer">
              <button className="btn btn-secondary" onClick={closeDialog}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || uploading}>
                {loading ? <><span className="spinner" /> Saving...</> : editMode ? "Save Changes" : "Create Version"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionControlManager;
