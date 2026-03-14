import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { vendorAPI, uploadAPI } from "../../services/api";
import "../../Style/Vendor.css";
import "../../Style/ProductManagement.css";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({ productName: "", description: "", basePrice: "", guideDocumentUrl: "" });
  const [editImages, setEditImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [imagesToAdd, setImagesToAdd] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true); setError("");
    try {
      const response = await vendorAPI.getVendorProducts({});
      const data = response.data?.data ?? response.data;
      const content = data?.content ?? data?.products ?? (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(content) ? content : []);
    } catch (err) { setError(err.response?.data?.message || "Failed to fetch products"); setProducts([]); }
    finally { setLoading(false); }
  };

  const getProductId = (product) => product?.productId ?? product?.id;

  const handleEditClick = async (product) => {
    if (product.status === "APPROVED") {
      const confirmed = window.confirm("⚠️ Chỉnh sửa sản phẩm đã duyệt sẽ chuyển trạng thái về PENDING để Admin duyệt lại. Bạn có muốn tiếp tục?");
      if (!confirmed) return;
    }
    setSelectedProduct(product);
    setEditFormData({
      productName: product.productName ?? product.name,
      description: product.description,
      basePrice: product.basePrice ?? product.price,
      guideDocumentUrl: product.guideDocumentUrl ?? "",
    });
    setImagesToDelete([]); setImagesToAdd([]); setNewImageUrl("");
    setSelectedFile(null); setPreview(null); setUploading(false);
    try {
      const res = await vendorAPI.getProduct(getProductId(product));
      const detail = res.data?.data ?? res.data;
      setEditImages(detail.images || []);
    } catch { setEditImages([]); }
    setEditDialogOpen(true);
  };

  const handleRemoveExistingImage = (imageId) => {
    setImagesToDelete((prev) => [...prev, imageId]);
    setEditImages((prev) => prev.filter((img) => (img.imageId ?? img.id) !== imageId));
  };

  const handleAddNewImage = () => {
    if (!newImageUrl.trim()) return;
    setImagesToAdd((prev) => [...prev, { imageUrl: newImageUrl.trim(), isPrimary: false, sortOrder: prev.length }]);
    setNewImageUrl("");
  };

  const handleLocalFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("File phải là ảnh (jpg, png, gif, webp)"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Ảnh không được vượt quá 10MB"); return; }
    setSelectedFile(file); setPreview(URL.createObjectURL(file)); setError("");
  };

  const handleUploadToCloud = async () => {
    if (!selectedFile) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const response = await uploadAPI.uploadImage(fd);
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setImagesToAdd((prev) => [...prev, { imageUrl: url, isPrimary: false, sortOrder: prev.length }]);
        setSuccess("Upload ảnh thành công!");
        clearLocalFile();
      }
    } catch (err) { setError(err.response?.data?.message || "Upload ảnh thất bại."); }
    finally { setUploading(false); }
  };

  const clearLocalFile = () => {
    setSelectedFile(null); setPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleDeleteClick = (product) => { setSelectedProduct(product); setDeleteDialogOpen(true); };

  const handleEditSubmit = async () => {
    if (!selectedProduct) return;
    setLoading(true); setError("");
    try {
      const pid = getProductId(selectedProduct);
      await vendorAPI.updateProduct(pid, {
        productName: editFormData.productName, description: editFormData.description,
        basePrice: parseFloat(editFormData.basePrice), guideDocumentUrl: editFormData.guideDocumentUrl,
      });
      for (const imageId of imagesToDelete) { await vendorAPI.deleteProductImage(pid, imageId); }
      for (const img of imagesToAdd) { await vendorAPI.uploadProductImage(pid, img); }
      setSuccess("Product updated successfully!"); setEditDialogOpen(false); fetchProducts();
    } catch (err) { setError(err.response?.data?.message || "Failed to update product"); }
    finally { setLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setLoading(true); setError("");
    try {
      await vendorAPI.deleteProduct(getProductId(selectedProduct));
      setSuccess("Product deleted successfully!"); setDeleteDialogOpen(false); fetchProducts();
    } catch (err) { setError(err.response?.data?.message || "Failed to delete product"); }
    finally { setLoading(false); }
  };

  const statusBadge = (status) => {
    switch (status) {
      case "APPROVED": return "badge-success";
      case "PENDING": return "badge-warning";
      case "REJECTED": return "badge-error";
      default: return "badge-default";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "APPROVED": return "Approved";
      case "PENDING": return "Pending Review";
      case "REJECTED": return "Rejected";
      case "DRAFT": return "Draft";
      default: return status ?? "";
    }
  };

  if (loading && products.length === 0) {
    return <div className="loading-center"><span className="spinner spinner-lg" /></div>;
  }

  const uploadPath = "/Page/Vendor/ProductUpload";

  return (
    <div className="vendor-page">
      <div className="vendor-card">
        <div className="vendor-page-header">
          <h2 className="vendor-page-title">Product Management</h2>
          <div className="flex-gap">
            <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>🔄 Refresh</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(uploadPath)}>+ Add Product</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}<button className="alert-close" onClick={() => setError("")}>×</button></div>}
        {success && <div className="alert alert-success">{success}<button className="alert-close" onClick={() => setSuccess("")}>×</button></div>}

        {!products || products.length === 0 ? (
          <div className="product-empty">
            <h3>No products found</h3>
            <p>Start by uploading your first product to the marketplace</p>
            <button className="btn btn-primary" onClick={() => navigate(uploadPath)}>Upload Your First Product</button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => {
              const pid = getProductId(product);
              const name = product.productName ?? product.name;
              const price = product.basePrice ?? product.price;
              return (
                <div className="product-card-item" key={pid}>
                  <div className="product-card-header">
                    <h3 className="product-card-name">{name}</h3>
                    <span className={`badge ${statusBadge(product.status)}`}>{statusLabel(product.status)}</span>
                  </div>
                  <p className="product-card-desc">
                    {product.description?.length > 100 ? `${product.description.substring(0, 100)}...` : product.description}
                  </p>
                  <div className="product-card-price">${price}</div>
                  {product.tags?.length > 0 && (
                    <div className="product-card-tags">
                      {product.tags.slice(0, 3).map((tag) => <span key={tag} className="badge badge-default">{tag}</span>)}
                      {product.tags.length > 3 && <span className="badge badge-default">+{product.tags.length - 3} more</span>}
                    </div>
                  )}
                  <div className="product-card-meta">
                    Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                  </div>
                  {product.status === "REJECTED" && product.rejectionNote && (
                    <div className="alert alert-error" style={{ marginBottom: 8 }}>
                      <strong>Lý do từ chối:</strong> {product.rejectionNote}
                    </div>
                  )}
                  <div className="product-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/products/${pid}`)}>View</button>
                    {(product.status === "DRAFT" || product.status === "REJECTED") ? (
                      <button className="btn btn-primary btn-sm" onClick={() => navigate(`/Page/Vendor/ProductUpload?productId=${pid}`)}>Resume</button>
                    ) : product.status === "APPROVED" ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(product)}>Edit</button>
                    ) : null}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(product)}
                      disabled={product.status === "APPROVED" || product.status === "PENDING"}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editDialogOpen && (
        <div className="modal-overlay" onClick={() => setEditDialogOpen(false)}>
          <div className="vendor-modal vendor-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">Edit Product</div>
            <div className="vendor-modal-body">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input className="form-input" value={editFormData.productName}
                  onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={4} value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input className="form-input" type="number" value={editFormData.basePrice} min="0" step="0.01"
                    onChange={(e) => setEditFormData({ ...editFormData, basePrice: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Guide Document URL</label>
                  <input className="form-input" value={editFormData.guideDocumentUrl} placeholder="https://example.com/guide.pdf"
                    onChange={(e) => setEditFormData({ ...editFormData, guideDocumentUrl: e.target.value })} />
                  <span className="form-hint">Link tài liệu hướng dẫn sử dụng (tùy chọn)</span>
                </div>
              </div>

              {/* Image Management */}
              <div className="section-title mt-16">Ảnh sản phẩm</div>
              <div className="image-gallery">
                {editImages.map((img) => {
                  const imgId = img.imageId ?? img.id;
                  return (
                    <div key={imgId} className="image-gallery-item">
                      <img src={img.imageUrl} alt="product" />
                      <button className="remove-btn" onClick={() => handleRemoveExistingImage(imgId)}>×</button>
                    </div>
                  );
                })}
                {imagesToAdd.map((img, i) => (
                  <div key={`new-${i}`} className="image-gallery-item new">
                    <img src={img.imageUrl} alt="new" />
                    <button className="remove-btn" onClick={() => setImagesToAdd((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
              </div>

              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleLocalFileSelect} style={{ display: "none" }} />
              {!selectedFile && (
                <div className="drop-zone mb-16" style={{ padding: 16 }}
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleLocalFileSelect({ target: { files: [f] } }); }}>
                  <div className="drop-zone-text">Kéo thả ảnh hoặc <strong>click để chọn từ máy</strong></div>
                  <div className="drop-zone-hint">jpg, png, gif, webp — Tối đa 10MB</div>
                </div>
              )}

              {selectedFile && (
                <div className="file-preview mb-16">
                  {preview && <img src={preview} alt="Preview" className="thumb" />}
                  <div className="file-preview-info">
                    <div className="file-preview-name truncate">{selectedFile.name}</div>
                    <div className="file-preview-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleUploadToCloud} disabled={uploading}>
                    {uploading ? <><span className="spinner" /> Uploading...</> : "⬆ Upload"}
                  </button>
                  <button className="btn-icon danger" onClick={clearLocalFile} disabled={uploading}>🗑️</button>
                </div>
              )}

              {uploading && <div className="progress-bar mb-16"><div className="progress-bar-fill" /></div>}

              <span className="form-hint mb-8" style={{ display: "block" }}>Hoặc dán URL ảnh trực tiếp:</span>
              <div className="flex-gap">
                <input className="form-input" style={{ flex: 1 }} placeholder="https://..." value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)} />
                <button className="btn btn-secondary btn-sm" onClick={handleAddNewImage} disabled={!newImageUrl.trim()}>Thêm</button>
              </div>
            </div>
            <div className="vendor-modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditDialogOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditSubmit} disabled={loading}>
                {loading ? <><span className="spinner" /> Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div className="modal-overlay" onClick={() => setDeleteDialogOpen(false)}>
          <div className="vendor-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="vendor-modal-header">Delete Product</div>
            <div className="vendor-modal-body">
              <p style={{ color: "#e2e8f0" }}>
                Are you sure you want to delete "{selectedProduct?.productName ?? selectedProduct?.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="vendor-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={loading}>
                {loading ? <><span className="spinner" /> Deleting...</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
