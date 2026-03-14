import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, Button, Grid, Alert, CircularProgress,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LayersIcon from "@mui/icons-material/Layers";
import { vendorAPI } from "../../services/api";

const TIER_PRESETS = [
  { label: "Personal", code: "PER" },
  { label: "Business", code: "BIZ" },
  { label: "Enterprise", code: "ENT" },
];

const LicenseTierConfig = () => {
  // ─── State ───
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tierLoading, setTierLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);

  // Delete confirm
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTier, setDeletingTier] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ─── Load ───
  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (selectedProductId) fetchTiers(); }, [selectedProductId]);
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

  // ─── Dialog helpers ───
  const openCreateDialog = () => {
    setEditMode(false);
    setEditingTierId(null);
    setFormData({ tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (tier) => {
    setEditMode(true);
    setEditingTierId(tier.tierId);
    setFormData({
      tierName: tier.tierName || "",
      tierCode: tier.tierCode || "",
      price: tier.price ?? "",
      maxDevices: tier.maxDevices ?? 1,
      durationDays: tier.durationDays ?? 365,
      content: tier.content || "",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const applyPreset = (preset) => {
    setFormData((prev) => ({ ...prev, tierName: preset.label, tierCode: preset.code }));
  };

  // ─── Validation ───
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

  // ─── Submit ───
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    const payload = {
      tierName: formData.tierName.trim(),
      tierCode: formData.tierCode.trim(),
      price: Number(formData.price),
      maxDevices: Number(formData.maxDevices),
      durationDays: Number(formData.durationDays),
      content: formData.content,
    };
    try {
      if (editMode) {
        await vendorAPI.updateLicenseTier(selectedProductId, editingTierId, payload);
        setSuccess("Cập nhật license tier thành công!");
      } else {
        await vendorAPI.createLicenseTier(selectedProductId, payload);
        setSuccess("Tạo license tier thành công!");
      }
      closeDialog();
      fetchTiers();
    } catch (err) {
      setError(err.response?.data?.message || "Thao tác thất bại");
    } finally { setLoading(false); }
  };

  // ─── Delete ───
  const handleDeleteClick = (tier) => {
    setDeletingTier(tier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTier) return;
    setLoading(true); setError("");
    try {
      await vendorAPI.deleteLicenseTier(selectedProductId, deletingTier.tierId);
      setSuccess("Xóa license tier thành công!");
      setDeleteDialogOpen(false);
      setDeletingTier(null);
      fetchTiers();
    } catch (err) {
      setError(err.response?.data?.message || "Xóa thất bại");
    } finally { setLoading(false); }
  };

  // ─── Helpers ───
  const getProductName = () => {
    const p = products.find((p) => (p.productId ?? p.id) === selectedProductId);
    return p?.productName ?? p?.name ?? "";
  };

  const formatPrice = (price) => {
    if (price == null) return "—";
    return `$${Number(price).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  // ─── Render ───
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LayersIcon color="primary" />
              <Typography variant="h4">License Tier Configuration</Typography>
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

          {/* Tier List */}
          {selectedProductId && (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">
                  License Tiers của "{getProductName()}"
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                  Tạo tier mới
                </Button>
              </Box>

              {tierLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>
              ) : tiers.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Sản phẩm chưa có license tier nào
                  </Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreateDialog} sx={{ mt: 1 }}>
                    Tạo tier đầu tiên
                  </Button>
                </Paper>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Tên Tier</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Mã</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Giá</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Thiết bị tối đa</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Thời hạn</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Mô tả</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }} align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tiers.map((tier) => (
                        <TableRow key={tier.tierId} hover>
                          <TableCell>
                            <Chip label={tier.tierName} color="primary" variant="outlined" size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip label={tier.tierCode || "—"} size="small" variant="filled" />
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold", color: "success.main" }}>
                            {formatPrice(tier.price)}
                          </TableCell>
                          <TableCell>{tier.maxDevices ?? "—"}</TableCell>
                          <TableCell>{tier.durationDays ? `${tier.durationDays} ngày` : "—"}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap title={tier.content}>
                              {tier.content || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="primary" onClick={() => openEditDialog(tier)} title="Chỉnh sửa">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(tier)} title="Xóa">
                              <DeleteIcon fontSize="small" />
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

      {/* Create/Edit Tier Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? "Chỉnh sửa License Tier" : "Tạo License Tier mới"}</DialogTitle>
        <DialogContent>
          {/* Preset buttons */}
          {!editMode && (
            <Box sx={{ mb: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Chọn nhanh từ mẫu:
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {TIER_PRESETS.map((preset) => (
                  <Chip
                    key={preset.code}
                    label={preset.label}
                    onClick={() => applyPreset(preset)}
                    variant={formData.tierName === preset.label ? "filled" : "outlined"}
                    color="primary"
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}

          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Tên Tier" placeholder="e.g., Personal, Business, Enterprise"
                value={formData.tierName}
                onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
                error={!!formErrors.tierName} helperText={formErrors.tierName}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Mã Tier" placeholder="e.g., PER, BIZ, ENT"
                value={formData.tierCode}
                onChange={(e) => setFormData({ ...formData, tierCode: e.target.value })}
                error={!!formErrors.tierCode} helperText={formErrors.tierCode}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Giá ($)" type="number" placeholder="9.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                error={!!formErrors.price} helperText={formErrors.price}
                inputProps={{ min: 0.01, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Số thiết bị tối đa" type="number"
                value={formData.maxDevices}
                onChange={(e) => setFormData({ ...formData, maxDevices: e.target.value })}
                error={!!formErrors.maxDevices} helperText={formErrors.maxDevices}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Thời hạn (ngày)" type="number"
                value={formData.durationDays}
                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                error={!!formErrors.durationDays} helperText={formErrors.durationDays}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Mô tả / Quyền sử dụng" multiline rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Mô tả các quyền lợi, giới hạn sử dụng, tính năng bao gồm trong tier này..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : editMode ? "Lưu thay đổi" : "Tạo tier"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xóa License Tier</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa tier "{deletingTier?.tierName}"? Thao tác này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Xóa"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenseTierConfig;
