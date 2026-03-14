import React, { useState, useEffect, useRef } from "react";
import {
  Box, Card, CardContent, Typography, Button, Grid, Alert, CircularProgress,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, LinearProgress, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, MenuItem, Select, FormControl,
  InputLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HistoryIcon from "@mui/icons-material/History";
import { vendorAPI, uploadAPI } from "../../services/api";

const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const VersionControlManager = () => {
  // ─── State ───
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState(null);

  // Form
  const [formData, setFormData] = useState({ versionNumber: "", fileUrl: "", releaseNotes: "" });
  const [formErrors, setFormErrors] = useState({});

  // File upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Load Products ───
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) fetchVersions();
  }, [selectedProductId]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(""), 4000); return () => clearTimeout(t); }
  }, [success]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.getVendorProducts({ size: 100 });
      const data = res.data?.data ?? res.data;
      const content = data?.content ?? data?.products ?? (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(content) ? content : []);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
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
    } finally {
      setVersionLoading(false);
    }
  };

  // ─── Dialog helpers ───
  const openCreateDialog = () => {
    setEditMode(false);
    setEditingVersionId(null);
    setFormData({ versionNumber: "", fileUrl: "", releaseNotes: "" });
    setFormErrors({});
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const openEditDialog = (version) => {
    setEditMode(true);
    setEditingVersionId(version.versionId);
    setFormData({
      versionNumber: version.versionNumber || "",
      fileUrl: version.fileUrl || "",
      releaseNotes: version.releaseNotes || "",
    });
    setFormErrors({});
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Validation ───
  const validate = () => {
    const errs = {};
    if (!formData.versionNumber.trim()) errs.versionNumber = "Số phiên bản không được để trống";
    else if (!SEMVER_REGEX.test(formData.versionNumber.trim())) errs.versionNumber = "Định dạng phải là x.y.z (ví dụ: 1.0.0)";
    if (!formData.fileUrl.trim()) errs.fileUrl = "URL file không được để trống";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── File Upload ───
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validExts = [".exe", ".zip", ".msi", ".dmg", ".pkg", ".jar"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError("Chỉ chấp nhận: exe, zip, msi, dmg, pkg, jar"); return;
    }
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
    } catch (err) {
      setError(err.response?.data?.message || "Upload thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      if (editMode) {
        await vendorAPI.updateProductVersion(selectedProductId, editingVersionId, {
          versionNumber: formData.versionNumber.trim(),
          fileUrl: formData.fileUrl.trim(),
          releaseNotes: formData.releaseNotes,
        });
        setSuccess("Cập nhật phiên bản thành công!");
      } else {
        await vendorAPI.createProductVersion(selectedProductId, {
          versionNumber: formData.versionNumber.trim(),
          fileUrl: formData.fileUrl.trim(),
          releaseNotes: formData.releaseNotes,
        });
        setSuccess("Tạo phiên bản thành công!");
      }
      closeDialog();
      fetchVersions();
    } catch (err) {
      const msg = err.response?.data?.message || "Thao tác thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ───
  const getProductName = () => {
    const p = products.find((p) => (p.productId ?? p.id) === selectedProductId);
    return p?.productName ?? p?.name ?? "";
  };

  const getScanStatusColor = (status) => {
    switch (status) {
      case "CLEAN": return "success";
      case "INFECTED": return "error";
      default: return "warning";
    }
  };

  // ─── Render ───
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HistoryIcon color="primary" />
              <Typography variant="h4">Version Control Manager</Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Product Selector */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Chọn sản phẩm</InputLabel>
            <Select
              value={selectedProductId}
              label="Chọn sản phẩm"
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => {
                const pid = p.productId ?? p.id;
                return (
                  <MenuItem key={pid} value={pid}>
                    {p.productName ?? p.name}
                    {p.status && (
                      <Chip label={p.status} size="small" sx={{ ml: 1 }}
                        color={p.status === "APPROVED" ? "success" : p.status === "PENDING" ? "warning" : "default"} />
                    )}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Version List */}
          {selectedProductId && (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">
                  Phiên bản của "{getProductName()}"
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                  Tạo phiên bản mới
                </Button>
              </Box>

              {versionLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
              ) : versions.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Sản phẩm chưa có phiên bản nào
                  </Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ mt: 1 }}>
                    Tạo phiên bản đầu tiên
                  </Button>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Phiên bản</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>File</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Ghi chú phát hành</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Trạng thái quét</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Ngày tạo</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {versions.map((v) => (
                        <TableRow key={v.versionId} hover>
                          <TableCell>
                            <Chip label={`v${v.versionNumber}`} color="primary" variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>
                            {v.fileUrl ? (
                              <a href={v.fileUrl} target="_blank" rel="noopener noreferrer"
                                style={{ color: "#1976d2", textDecoration: "none", fontSize: "0.85rem" }}>
                                📥 Tải xuống
                              </a>
                            ) : "—"}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2" noWrap title={v.releaseNotes}>
                              {v.releaseNotes || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={v.scanStatus || "PENDING"} size="small" color={getScanStatusColor(v.scanStatus)} />
                          </TableCell>
                          <TableCell>
                            {v.createdAt ? new Date(v.createdAt).toLocaleString("vi-VN") : "—"}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="primary" onClick={() => openEditDialog(v)} title="Chỉnh sửa">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Version Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? "Chỉnh sửa phiên bản" : "Tạo phiên bản mới"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            {/* Version Number */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Số phiên bản" placeholder="1.0.0"
                value={formData.versionNumber}
                onChange={(e) => setFormData({ ...formData, versionNumber: e.target.value })}
                error={!!formErrors.versionNumber} helperText={formErrors.versionNumber || "Định dạng: x.y.z"}
                required
              />
            </Grid>

            {/* File Upload Zone */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>📦 File cài đặt</Typography>

              <input ref={fileInputRef} type="file" accept=".exe,.zip,.msi,.dmg,.pkg,.jar"
                onChange={handleFileSelect} style={{ display: "none" }} />

              {!selectedFile && !formData.fileUrl && (
                <Box
                  sx={{
                    border: "2px dashed", borderColor: formErrors.fileUrl ? "error.main" : "grey.400",
                    borderRadius: 2, p: 3, textAlign: "center", cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); }}
                >
                  <InsertDriveFileIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Kéo thả file vào đây hoặc <strong>click để chọn</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    exe, zip, msi, dmg, pkg, jar — Tối đa 500MB
                  </Typography>
                </Box>
              )}

              {selectedFile && !formData.fileUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <InsertDriveFileIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">{selectedFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                  <Button variant="contained"
                    startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    onClick={handleUploadToCloud} disabled={uploading}
                  >
                    {uploading ? "Đang upload..." : "Upload"}
                  </Button>
                  <IconButton onClick={clearFile} disabled={uploading}><DeleteIcon /></IconButton>
                </Paper>
              )}

              {formData.fileUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" color="success.main" fontWeight="bold">
                      ✅ File đã upload!
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {formData.fileUrl}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => {
                    setFormData((prev) => ({ ...prev, fileUrl: "" }));
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }} color="error"><DeleteIcon /></IconButton>
                </Paper>
              )}

              {uploading && <LinearProgress sx={{ mt: 1 }} />}
              {formErrors.fileUrl && !formData.fileUrl && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{formErrors.fileUrl}</Typography>
              )}
            </Grid>

            {/* Or paste URL */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Hoặc dán URL trực tiếp:
              </Typography>
              <TextField fullWidth label="File URL" value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="URL tự động điền sau upload" size="small"
                error={!!formErrors.fileUrl} />
            </Grid>

            {/* Release Notes */}
            <Grid item xs={12}>
              <TextField fullWidth label="Ghi chú phát hành (Release Notes)"
                multiline rows={4} value={formData.releaseNotes}
                onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
                placeholder="Mô tả các thay đổi trong phiên bản này..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || uploading}>
            {loading ? <CircularProgress size={20} /> : editMode ? "Lưu thay đổi" : "Tạo phiên bản"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionControlManager;
