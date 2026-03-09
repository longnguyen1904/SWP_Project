import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { vendorAPI, customerAPI, uploadAPI } from "../../services/api";

const ProductUploadForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);
  const [productId, setProductId] = useState(null);

  // Upload states
  const [imageUploading, setImageUploading] = useState(false);
  const [installerUploading, setInstallerUploading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedInstallerFile, setSelectedInstallerFile] = useState(null);

  const imageInputRef = useRef(null);
  const installerInputRef = useRef(null);

  const [productData, setProductData] = useState({
    productName: "",
    categoryId: "",
    description: "",
    basePrice: "",
    hasTrial: false,
    trialDurationDays: 7,
    tags: [],
  });

  const [images, setImages] = useState([]);
  const [imageUpload, setImageUpload] = useState({ imageUrl: "", isPrimary: false, sortOrder: 0 });

  const [version, setVersion] = useState({
    versionNumber: "",
    fileUrl: "",
    releaseNotes: "",
  });

  const [licenseTiers, setLicenseTiers] = useState([]);
  const [tierForm, setTierForm] = useState({
    tierName: "",
    tierCode: "STD",
    price: "",
    maxDevices: 1,
    durationDays: 365,
    content: "",
  });

  const steps = ["Basic Information", "Upload Images", "Product Version", "License Tiers", "Submit"];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await customerAPI.getCategories();
        const data = res.data?.data ?? res.data;
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        setCategories(list.map((c) => ({ id: c.categoryID ?? c.id, name: c.categoryName ?? c.name })));
      } catch {
        setCategories([
          { id: 1, name: "Development Tools" },
          { id: 2, name: "Business Software" },
          { id: 3, name: "Games" },
          { id: 4, name: "Education" },
          { id: 5, name: "Productivity" },
        ]);
      }
    };
    load();
  }, []);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateCurrentStep = () => {
    setError("");
    switch (activeStep) {
      case 0:
        if (!productData.productName || !productData.categoryId || !productData.description || !productData.basePrice) {
          setError("Please fill in all required fields");
          return false;
        }
        return true;
      case 1:
        if (images.length === 0) {
          setError("Please add at least one product image URL");
          return false;
        }
        return true;
      case 2:
        if (!version.versionNumber || !version.fileUrl) {
          setError("Please fill in version information");
          return false;
        }
        return true;
      case 3:
        if (licenseTiers.length === 0) {
          setError("Please add at least one license tier");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const createProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...productData,
        categoryId: Number(productData.categoryId),
        basePrice: parseFloat(productData.basePrice),
      };
      const response = await vendorAPI.createProduct(payload);
      const data = response.data?.data ?? response.data;
      const id = data?.productId ?? data?.id;
      setProductId(id);
      setSuccess("Product created successfully!");
      return id;
    } catch (err) {
      setError("Failed to create product: " + (err.response?.data?.message || err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProductImage = async (pid, imageData) => {
    try {
      await vendorAPI.uploadProductImage(pid, imageData);
    } catch (err) {
      setError("Failed to upload image: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const createProductVersion = async (pid) => {
    try {
      await vendorAPI.createProductVersion(pid, version);
    } catch (err) {
      setError("Failed to create version: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const createLicenseTier = async (pid, tier) => {
    try {
      await vendorAPI.createLicenseTier(pid, {
        tierName: tier.tierName,
        tierCode: tier.tierCode || "STD",
        price: parseFloat(tier.price),
        maxDevices: Number(tier.maxDevices),
        durationDays: Number(tier.durationDays),
        content: tier.content || "",
      });
    } catch (err) {
      setError("Failed to create license tier: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const submitProduct = async (pid) => {
    try {
      await vendorAPI.submitProduct(pid);
      setSuccess("Product submitted for approval!");
    } catch (err) {
      setError("Failed to submit product: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      let currentProductId = productId;
      if (!currentProductId) {
        currentProductId = await createProduct();
        setProductId(currentProductId);
      }

      for (const image of images) {
        await uploadProductImage(currentProductId, image);
      }

      await createProductVersion(currentProductId);

      for (const tier of licenseTiers) {
        await createLicenseTier(currentProductId, tier);
      }

      await submitProduct(currentProductId);

      setSuccess("Product successfully created and submitted for approval!");
      setActiveStep(0);
      setProductId(null);
      setProductData({
        productName: "",
        categoryId: "",
        description: "",
        basePrice: "",
        hasTrial: false,
        trialDurationDays: 7,
        tags: [],
      });
      setImages([]);
      setVersion({ versionNumber: "", fileUrl: "", releaseNotes: "" });
      setLicenseTiers([]);
    } catch {
      // Error already set in individual functions
    } finally {
      setLoading(false);
    }
  };

  // ==================== IMAGE UPLOAD (local → Cloudinary) ====================

  const handleImageFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File phải là ảnh (jpg, png, gif, webp)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 10MB");
      return;
    }
    setSelectedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleImageUploadToCloud = async () => {
    if (!selectedImageFile) return;
    setImageUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", selectedImageFile);
      const response = await uploadAPI.uploadImage(fd);
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setImageUpload((prev) => ({ ...prev, imageUrl: url }));
        setSuccess("Upload ảnh thành công!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleClearImageFile = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // ==================== INSTALLER UPLOAD (local → Cloudinary) ====================

  const handleInstallerFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const validExts = [".exe", ".zip", ".msi", ".dmg", ".pkg", ".jar"];
    if (!validExts.some((ext) => name.endsWith(ext))) {
      setError("Chỉ chấp nhận file: exe, zip, msi, dmg, pkg, jar");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError("File cài đặt không được vượt quá 500MB");
      return;
    }
    setSelectedInstallerFile(file);
    setError("");
  };

  const handleInstallerUploadToCloud = async () => {
    if (!selectedInstallerFile) return;
    setInstallerUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", selectedInstallerFile);
      const response = await uploadAPI.uploadInstaller(fd);
      const url = response.data?.data?.url || response.data?.url;
      if (url) {
        setVersion((prev) => ({ ...prev, fileUrl: url }));
        setSuccess("Upload file cài đặt thành công!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload file thất bại. Vui lòng thử lại.");
    } finally {
      setInstallerUploading(false);
    }
  };

  const handleClearInstallerFile = () => {
    setSelectedInstallerFile(null);
    setVersion((prev) => ({ ...prev, fileUrl: "" }));
    if (installerInputRef.current) installerInputRef.current.value = "";
  };

  // ==================== HELPERS ====================

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const dropZoneStyle = {
    border: "2px dashed",
    borderColor: "grey.400",
    borderRadius: 2,
    p: 3,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleImageDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFileSelect({ target: { files: [file] } });
  };

  const handleInstallerDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleInstallerFileSelect({ target: { files: [file] } });
  };

  // ==================== ORIGINAL HELPERS ====================

  const addImage = () => {
    if (imageUpload.imageUrl) {
      setImages([...images, { ...imageUpload, id: Date.now() }]);
      setImageUpload({ imageUrl: "", isPrimary: false, sortOrder: images.length });
      handleClearImageFile();
    }
  };

  const removeImage = (id) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const addLicenseTier = () => {
    if (tierForm.tierName && tierForm.price) {
      setLicenseTiers([...licenseTiers, { ...tierForm, id: Date.now() }]);
      setTierForm({
        tierName: "",
        tierCode: "STD",
        price: "",
        maxDevices: 1,
        durationDays: 365,
        content: "",
      });
    }
  };

  const removeLicenseTier = (id) => {
    setLicenseTiers(licenseTiers.filter((tier) => tier.id !== id));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={productData.productName}
                onChange={(e) => setProductData({ ...productData, productName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={productData.categoryId}
                  label="Category"
                  onChange={(e) => setProductData({ ...productData, categoryId: e.target.value })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={productData.description}
                onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Base Price ($)"
                type="number"
                value={productData.basePrice}
                onChange={(e) => setProductData({ ...productData, basePrice: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Has Trial</InputLabel>
                <Select
                  value={productData.hasTrial}
                  label="Has Trial"
                  onChange={(e) => setProductData({ ...productData, hasTrial: e.target.value === true })}
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Trial Duration (days)"
                type="number"
                value={productData.trialDurationDays}
                onChange={(e) => setProductData({ ...productData, trialDurationDays: e.target.value })}
                disabled={!productData.hasTrial}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              🖼️ Upload Ảnh Sản Phẩm
            </Typography>

            {/* Upload ảnh từ local */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileSelect}
              style={{ display: "none" }}
            />

            {!selectedImageFile && !imageUpload.imageUrl && (
              <Box
                sx={{ ...dropZoneStyle, mb: 2 }}
                onClick={() => imageInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleImageDrop}
              >
                <ImageIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Kéo thả ảnh vào đây hoặc <strong>click để chọn ảnh từ máy</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Hỗ trợ: jpg, png, gif, webp — Tối đa 10MB
                </Typography>
              </Box>
            )}

            {selectedImageFile && !imageUpload.imageUrl && (
              <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                {imagePreview && (
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1">{selectedImageFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(selectedImageFile.size)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={imageUploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                  onClick={handleImageUploadToCloud}
                  disabled={imageUploading}
                >
                  {imageUploading ? "Đang upload..." : "Upload lên Cloudinary"}
                </Button>
                <IconButton onClick={handleClearImageFile} disabled={imageUploading}>
                  <DeleteIcon />
                </IconButton>
              </Paper>
            )}

            {imageUpload.imageUrl && (
              <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" color="success.main" fontWeight="bold">
                    ✅ Ảnh đã upload thành công!
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                    {imageUpload.imageUrl}
                  </Typography>
                </Box>
                <IconButton onClick={() => { setImageUpload((prev) => ({ ...prev, imageUrl: "" })); handleClearImageFile(); }} color="error">
                  <DeleteIcon />
                </IconButton>
              </Paper>
            )}

            {imageUploading && <LinearProgress color="secondary" sx={{ mb: 2 }} />}

            {/* Hoặc dán URL trực tiếp */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 1 }}>
              Hoặc dán URL ảnh trực tiếp:
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={imageUpload.imageUrl}
                  onChange={(e) => setImageUpload({ ...imageUpload, imageUrl: e.target.value })}
                  placeholder="URL được tự động điền sau khi upload"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Primary</InputLabel>
                  <Select
                    value={imageUpload.isPrimary}
                    label="Primary"
                    onChange={(e) => setImageUpload({ ...imageUpload, isPrimary: e.target.value })}
                  >
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Sort Order"
                  type="number"
                  value={imageUpload.sortOrder}
                  onChange={(e) => setImageUpload({ ...imageUpload, sortOrder: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={addImage}
                  sx={{ height: "56px" }}
                  disabled={!imageUpload.imageUrl}
                >
                  + Add
                </Button>
              </Grid>
            </Grid>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Preview</TableCell>
                    <TableCell>Image URL</TableCell>
                    <TableCell>Primary</TableCell>
                    <TableCell>Sort Order</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {images.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell>
                        <Box
                          component="img"
                          src={image.imageUrl}
                          alt="thumb"
                          sx={{ width: 50, height: 50, objectFit: "cover", borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, wordBreak: "break-all" }}>
                        {image.imageUrl}
                      </TableCell>
                      <TableCell>
                        <Chip label={image.isPrimary ? "Yes" : "No"} size="small" />
                      </TableCell>
                      <TableCell>{image.sortOrder}</TableCell>
                      <TableCell>
                        <Button size="small" color="error" onClick={() => removeImage(image.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📦 Upload File Cài Đặt (zip, exe, msi, ...)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Version Number"
                value={version.versionNumber}
                onChange={(e) => setVersion({ ...version, versionNumber: e.target.value })}
                placeholder="e.g., 1.0.0"
                required
              />
            </Grid>

            {/* Upload file cài đặt từ local */}
            <Grid item xs={12}>
              <input
                ref={installerInputRef}
                type="file"
                accept=".exe,.zip,.msi,.dmg,.pkg,.jar"
                onChange={handleInstallerFileSelect}
                style={{ display: "none" }}
              />

              {!selectedInstallerFile && !version.fileUrl && (
                <Box
                  sx={dropZoneStyle}
                  onClick={() => installerInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleInstallerDrop}
                >
                  <InsertDriveFileIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Kéo thả file vào đây hoặc <strong>click để chọn file từ máy</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hỗ trợ: exe, zip, msi, dmg, pkg, jar — Tối đa 500MB
                  </Typography>
                </Box>
              )}

              {selectedInstallerFile && !version.fileUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <InsertDriveFileIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">{selectedInstallerFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(selectedInstallerFile.size)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={installerUploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    onClick={handleInstallerUploadToCloud}
                    disabled={installerUploading}
                  >
                    {installerUploading ? "Đang upload..." : "Upload lên Cloudinary"}
                  </Button>
                  <IconButton onClick={handleClearInstallerFile} disabled={installerUploading}>
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}

              {version.fileUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" color="success.main" fontWeight="bold">
                      ✅ File đã upload thành công!
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {version.fileUrl}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleClearInstallerFile} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}

              {installerUploading && <LinearProgress sx={{ mt: 1 }} />}
            </Grid>

            {/* Hoặc dán URL trực tiếp */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Hoặc dán URL file trực tiếp:
              </Typography>
              <TextField
                fullWidth
                label="File URL"
                value={version.fileUrl}
                onChange={(e) => setVersion({ ...version, fileUrl: e.target.value })}
                placeholder="URL được tự động điền sau khi upload"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Release Notes"
                multiline
                rows={4}
                value={version.releaseNotes}
                onChange={(e) => setVersion({ ...version, releaseNotes: e.target.value })}
                placeholder="What's new in this version?"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              License Tiers
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Tier Name"
                  value={tierForm.tierName}
                  onChange={(e) => setTierForm({ ...tierForm, tierName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Tier Code"
                  value={tierForm.tierCode}
                  onChange={(e) => setTierForm({ ...tierForm, tierCode: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Price ($)"
                  type="number"
                  value={tierForm.price}
                  onChange={(e) => setTierForm({ ...tierForm, price: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Max Devices"
                  type="number"
                  value={tierForm.maxDevices}
                  onChange={(e) => setTierForm({ ...tierForm, maxDevices: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  type="number"
                  value={tierForm.durationDays}
                  onChange={(e) => setTierForm({ ...tierForm, durationDays: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={addLicenseTier}
                  sx={{ height: "56px" }}
                >
                  + Add
                </Button>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="License Content"
              multiline
              rows={2}
              value={tierForm.content}
              onChange={(e) => setTierForm({ ...tierForm, content: e.target.value })}
              sx={{ mb: 3 }}
            />

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tier Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Devices</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {licenseTiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>{tier.tierName}</TableCell>
                      <TableCell>{tier.tierCode}</TableCell>
                      <TableCell>${tier.price}</TableCell>
                      <TableCell>{tier.maxDevices}</TableCell>
                      <TableCell>{tier.durationDays} days</TableCell>
                      <TableCell>
                        <Button size="small" color="error" onClick={() => removeLicenseTier(tier.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your product information before submitting for approval.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Product Name:</Typography>
                <Typography>{productData.productName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Base Price:</Typography>
                <Typography>${productData.basePrice}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Description:</Typography>
                <Typography>{productData.description}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Images: {images.length}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Version: {version.versionNumber}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">License Tiers: {licenseTiers.length}</Typography>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return "Unknown step";
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : "Submit Product"}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext} disabled={loading}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductUploadForm;
