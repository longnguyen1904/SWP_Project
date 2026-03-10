import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  LinearProgress,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
import { vendorAPI, uploadAPI } from "../../services/api";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    productName: "",
    description: "",
    basePrice: "",
    guideDocumentUrl: "",
  });
  const [editImages, setEditImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [imagesToAdd, setImagesToAdd] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await vendorAPI.getVendorProducts({});
      const data = response.data?.data ?? response.data;
      const content = data?.content ?? data?.products ?? (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(content) ? content : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getProductId = (product) => product?.productId ?? product?.id;

  const handleEditClick = async (product) => {
    if (product.status === "APPROVED") {
      const confirmed = window.confirm(
        "⚠️ Chỉnh sửa sản phẩm đã duyệt sẽ chuyển trạng thái về PENDING để Admin duyệt lại. Bạn có muốn tiếp tục?"
      );
      if (!confirmed) return;
    }
    setSelectedProduct(product);
    setEditFormData({
      productName: product.productName ?? product.name,
      description: product.description,
      basePrice: product.basePrice ?? product.price,
      guideDocumentUrl: product.guideDocumentUrl ?? "",
    });
    setImagesToDelete([]);
    setImagesToAdd([]);
    setNewImageUrl("");
    setSelectedFile(null);
    setPreview(null);
    setUploading(false);

    // Load images from API
    try {
      const res = await vendorAPI.getProduct(getProductId(product));
      const detail = res.data?.data ?? res.data;
      setEditImages(detail.images || []);
    } catch {
      setEditImages([]);
    }
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
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
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
    } catch (err) {
      setError(err.response?.data?.message || "Upload ảnh thất bại.");
    } finally { setUploading(false); }
  };

  const clearLocalFile = () => {
    setSelectedFile(null); setPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError("");

    try {
      const pid = getProductId(selectedProduct);

      // 1. Update product info
      await vendorAPI.updateProduct(pid, {
        productName: editFormData.productName,
        description: editFormData.description,
        basePrice: parseFloat(editFormData.basePrice),
        guideDocumentUrl: editFormData.guideDocumentUrl,
      });

      // 2. Delete removed images
      for (const imageId of imagesToDelete) {
        await vendorAPI.deleteProductImage(pid, imageId);
      }

      // 3. Upload new images
      for (const img of imagesToAdd) {
        await vendorAPI.uploadProductImage(pid, img);
      }

      setSuccess("Product updated successfully!");
      setEditDialogOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError("");

    try {
      const pid = getProductId(selectedProduct);
      await vendorAPI.deleteProduct(pid);
      setSuccess("Product deleted successfully!");
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      case "DRAFT":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending Review";
      case "REJECTED":
        return "Rejected";
      case "DRAFT":
        return "Draft";
      default:
        return status ?? "";
    }
  };

  const renderEditDialog = () => (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Name"
              value={editFormData.productName}
              onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price ($)"
              type="number"
              value={editFormData.basePrice}
              onChange={(e) => setEditFormData({ ...editFormData, basePrice: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Guide Document URL"
              value={editFormData.guideDocumentUrl}
              onChange={(e) => setEditFormData({ ...editFormData, guideDocumentUrl: e.target.value })}
              placeholder="https://example.com/guide.pdf"
              helperText="Link tài liệu hướng dẫn sử dụng (tùy chọn)"
            />
          </Grid>

          {/* Image Management */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Ảnh sản phẩm</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {editImages.map((img) => {
                const imgId = img.imageId ?? img.id;
                return (
                  <Box key={imgId} sx={{ position: "relative", width: 80, height: 80 }}>
                    <Box
                      component="img"
                      src={img.imageUrl}
                      alt="product"
                      sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1, border: "1px solid #ddd" }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveExistingImage(imgId)}
                      sx={{ position: "absolute", top: -8, right: -8, bgcolor: "white", boxShadow: 1, p: 0.3 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
              {imagesToAdd.map((img, i) => (
                <Box key={`new-${i}`} sx={{ position: "relative", width: 80, height: 80 }}>
                  <Box
                    component="img"
                    src={img.imageUrl}
                    alt="new"
                    sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1, border: "2px solid #4caf50" }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setImagesToAdd((prev) => prev.filter((_, idx) => idx !== i))}
                    sx={{ position: "absolute", top: -8, right: -8, bgcolor: "white", boxShadow: 1, p: 0.3 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
            {/* Upload từ máy tính */}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleLocalFileSelect} style={{ display: "none" }} />
            {!selectedFile && (
              <Box
                sx={{
                  border: "2px dashed", borderColor: "grey.400", borderRadius: 2, p: 2,
                  textAlign: "center", cursor: "pointer", mb: 2,
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                }}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleLocalFileSelect({ target: { files: [f] } }); }}
              >
                <ImageIcon sx={{ fontSize: 36, color: "grey.500", mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">Kéo thả ảnh hoặc <strong>click để chọn từ máy</strong></Typography>
                <Typography variant="caption" color="text.secondary">jpg, png, gif, webp — Tối đa 10MB</Typography>
              </Box>
            )}

            {selectedFile && (
              <Paper sx={{ p: 1.5, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                {preview && <Box component="img" src={preview} alt="Preview" sx={{ width: 60, height: 60, objectFit: "cover", borderRadius: 1 }} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>{selectedFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{(selectedFile.size / 1024).toFixed(1)} KB</Typography>
                </Box>
                <Button
                  variant="contained" size="small" color="secondary"
                  startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                  onClick={handleUploadToCloud} disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
                <IconButton size="small" onClick={clearLocalFile} disabled={uploading}><DeleteIcon fontSize="small" /></IconButton>
              </Paper>
            )}

            {uploading && <LinearProgress color="secondary" sx={{ mb: 2 }} />}

            {/* Hoặc thêm bằng URL */}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>Hoặc dán URL ảnh trực tiếp:</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Thêm ảnh (URL)"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" size="small" onClick={handleAddNewImage} disabled={!newImageUrl.trim()}>
                Thêm
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleEditSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Delete Product</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete &quot;{selectedProduct?.productName ?? selectedProduct?.name}&quot;? This
          action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const uploadPath = "/Page/Vendor/ProductUpload";

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4">Product Management</Typography>
            <Box>
              <Button variant="outlined" onClick={fetchProducts} sx={{ mr: 2 }}>
                Refresh
              </Button>
              <Button variant="contained" onClick={() => navigate(uploadPath)}>
                Add Product
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {!products || products.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by uploading your first product to the marketplace
              </Typography>
              <Button variant="contained" onClick={() => navigate(uploadPath)}>
                Upload Your First Product
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {products.map((product) => {
                const pid = getProductId(product);
                const name = product.productName ?? product.name;
                const price = product.basePrice ?? product.price;
                return (
                  <Grid item xs={12} md={6} lg={4} key={pid}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Typography variant="h6" component="h3" gutterBottom>
                            {name}
                          </Typography>
                          <Chip
                            label={getStatusLabel(product.status)}
                            color={getStatusColor(product.status)}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {product.description?.length > 100
                            ? `${product.description.substring(0, 100)}...`
                            : product.description}
                        </Typography>

                        <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                          ${price}
                        </Typography>

                        {product.tags && product.tags.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            {product.tags.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                            {product.tags.length > 3 && (
                              <Chip label={`+${product.tags.length - 3} more`} size="small" variant="outlined" />
                            )}
                          </Box>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "—"}
                        </Typography>

                        {product.status === "REJECTED" && product.rejectionNote && (
                          <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                            <Typography variant="caption">
                              <strong>Lý do từ chối:</strong> {product.rejectionNote}
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>

                      <Box sx={{ p: 2, pt: 0 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Button
                            size="small"
                            onClick={() => navigate(`/products/${pid}`)}
                            title="View Product"
                          >
                            View
                          </Button>
                          {(product.status === "DRAFT" || product.status === "REJECTED") ? (
                            <Button
                              size="small"
                              color="primary"
                              variant="outlined"
                              onClick={() => navigate(`/Page/Vendor/ProductUpload?productId=${pid}`)}
                              title="Resume editing"
                            >
                              Resume
                            </Button>
                          ) : product.status === "APPROVED" ? (
                            <Button size="small" onClick={() => handleEditClick(product)} title="Edit Product">
                              Edit
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            onClick={() => handleDeleteClick(product)}
                            title="Delete Product"
                            color="error"
                            disabled={product.status === "APPROVED" || product.status === "PENDING"}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </CardContent>
      </Card>

      {renderEditDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default ProductManagement;
