import React, { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
  LinearProgress,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { vendorAPI, uploadAPI } from "../../services/api";

const ProductUpload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productId, setProductId] = useState(null);

  // Upload states
  const [imageUploading, setImageUploading] = useState(false);
  const [installerUploading, setInstallerUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [installerFile, setInstallerFile] = useState(null);

  const imageInputRef = useRef(null);
  const installerInputRef = useRef(null);

  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    description: "",
    basePrice: "",
    hasTrial: false,
    trialDurationDays: 7,
    tags: [],
    guideDocumentUrl: "",
    versionNumber: "1.0.0",
    fileUrl: "",
    releaseNotes: "",
    tierName: "Standard",
    tierPrice: "",
    maxDevices: 1,
    durationDays: 365,
    tierCode: "STD",
    imageUrl: "",
    imageType: "SCREENSHOT",
    sortOrder: 1,
    isPrimary: true,
  });

  const [tagInput, setTagInput] = useState("");

  const steps = ["Basic Information", "Pricing & License", "Files & Images", "Review & Submit"];

  const handleInputChange = (field) => (event) => {
    const value = field === "hasTrial" ? event.target.checked : event.target.value;
    setFormData({
      ...formData,
      [field]: value,
    });
    setError("");
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleTagDelete = (tagToDelete) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToDelete),
    });
  };

  // ==================== IMAGE UPLOAD ====================

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate image
    if (!file.type.startsWith("image/")) {
      setError("File phải là ảnh (jpg, png, gif, webp)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 10MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    setImageUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", imageFile);
      const response = await uploadAPI.uploadImage(fd);
      const url = response.data?.data?.url || response.data?.url;
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      setSuccess("Upload ảnh thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // ==================== INSTALLER UPLOAD ====================

  const handleInstallerSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate installer
    const name = file.name.toLowerCase();
    const validExtensions = [".exe", ".zip", ".msi", ".dmg", ".pkg", ".jar"];
    if (!validExtensions.some((ext) => name.endsWith(ext))) {
      setError("Chỉ chấp nhận file: exe, zip, msi, dmg, pkg, jar");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError("File cài đặt không được vượt quá 500MB");
      return;
    }

    setInstallerFile(file);
    setError("");
  };

  const handleInstallerUpload = async () => {
    if (!installerFile) return;
    setInstallerUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", installerFile);
      const response = await uploadAPI.uploadInstaller(fd);
      const url = response.data?.data?.url || response.data?.url;
      setFormData((prev) => ({ ...prev, fileUrl: url }));
      setSuccess("Upload file cài đặt thành công!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Upload file thất bại. Vui lòng thử lại.");
    } finally {
      setInstallerUploading(false);
    }
  };

  const handleRemoveInstaller = () => {
    setInstallerFile(null);
    setFormData((prev) => ({ ...prev, fileUrl: "" }));
    if (installerInputRef.current) installerInputRef.current.value = "";
  };

  // ==================== DRAG & DROP ====================

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      // Simulate input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (imageInputRef.current) {
        imageInputRef.current.files = dataTransfer.files;
      }
      handleImageSelect({ target: { files: [file] } });
    }
  };

  const handleInstallerDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (installerInputRef.current) {
        installerInputRef.current.files = dataTransfer.files;
      }
      handleInstallerSelect({ target: { files: [file] } });
    }
  };

  // ==================== HELPERS ====================

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      await handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const productData = {
        productName: formData.productName,
        categoryId: parseInt(formData.categoryId, 10),
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        hasTrial: formData.hasTrial,
        trialDurationDays: formData.trialDurationDays,
        tags: formData.tags,
        guideDocumentUrl: formData.guideDocumentUrl || null,
      };

      const productResponse = await vendorAPI.createProduct(productData);
      const data = productResponse.data?.data ?? productResponse.data;
      const newProductId = data?.productId ?? data?.id;
      setProductId(newProductId);

      if (formData.imageUrl) {
        await vendorAPI.uploadProductImage(newProductId, {
          imageUrl: formData.imageUrl,
          imageType: formData.imageType,
          sortOrder: Number(formData.sortOrder),
          isPrimary: formData.isPrimary,
        });
      }

      await vendorAPI.createProductVersion(newProductId, {
        versionNumber: formData.versionNumber,
        fileUrl: formData.fileUrl,
        releaseNotes: formData.releaseNotes,
      });

      await vendorAPI.createLicenseTier(newProductId, {
        tierName: formData.tierName,
        price: parseFloat(formData.tierPrice),
        maxDevices: Number(formData.maxDevices),
        durationDays: Number(formData.durationDays),
        content: `${formData.tierName} license for ${formData.productName}`,
        tierCode: formData.tierCode || "STD",
      });

      await vendorAPI.submitProduct(newProductId);

      setSuccess("Product created and submitted for approval successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Product creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== DROP ZONE STYLE ====================

  const dropZoneStyle = {
    border: "2px dashed",
    borderColor: "grey.400",
    borderRadius: 2,
    p: 3,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "primary.main",
      bgcolor: "action.hover",
    },
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                value={formData.productName}
                onChange={handleInputChange("productName")}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId}
                  onChange={handleInputChange("categoryId")}
                  label="Category"
                  required
                >
                  <MenuItem value={1}>Development Tools</MenuItem>
                  <MenuItem value={2}>Business Software</MenuItem>
                  <MenuItem value={3}>Games</MenuItem>
                  <MenuItem value={4}>Education</MenuItem>
                  <MenuItem value={5}>Productivity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Base Price ($)"
                type="number"
                value={formData.basePrice}
                onChange={handleInputChange("basePrice")}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange("description")}
                required
                placeholder="Describe your product and its features"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.hasTrial}
                    onChange={handleInputChange("hasTrial")}
                  />
                }
                label="Offer Free Trial"
              />
              {formData.hasTrial && (
                <TextField
                  fullWidth
                  label="Trial Duration (days)"
                  type="number"
                  value={formData.trialDurationDays}
                  onChange={handleInputChange("trialDurationDays")}
                  sx={{ mt: 2 }}
                  inputProps={{ min: 1, max: 30 }}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleTagDelete(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleTagAdd())}
                helperText="Press Enter to add tags"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Guide Document URL"
                value={formData.guideDocumentUrl}
                onChange={handleInputChange("guideDocumentUrl")}
                placeholder="https://example.com/guide.pdf"
                helperText="Link tài liệu hướng dẫn sử dụng sản phẩm (PDF, doc...) — Tùy chọn"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Tier Name"
                value={formData.tierName}
                onChange={handleInputChange("tierName")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="License Price ($)"
                type="number"
                value={formData.tierPrice}
                onChange={handleInputChange("tierPrice")}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Max Devices"
                type="number"
                value={formData.maxDevices}
                onChange={handleInputChange("maxDevices")}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duration (days)"
                type="number"
                value={formData.durationDays}
                onChange={handleInputChange("durationDays")}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tier Code"
                value={formData.tierCode}
                onChange={handleInputChange("tierCode")}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* ===== INSTALLER / ZIP FILE UPLOAD ===== */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                📦 Upload File Cài Đặt (zip, exe, msi, ...)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Version Number"
                value={formData.versionNumber}
                onChange={handleInputChange("versionNumber")}
                placeholder="1.0.0"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <input
                ref={installerInputRef}
                type="file"
                accept=".exe,.zip,.msi,.dmg,.pkg,.jar"
                onChange={handleInstallerSelect}
                style={{ display: "none" }}
                id="installer-upload-input"
              />

              {!installerFile && !formData.fileUrl && (
                <Box
                  sx={dropZoneStyle}
                  onClick={() => installerInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleInstallerDrop}
                >
                  <InsertDriveFileIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Kéo thả file vào đây hoặc <strong>click để chọn file</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hỗ trợ: exe, zip, msi, dmg, pkg, jar — Tối đa 500MB
                  </Typography>
                </Box>
              )}

              {installerFile && !formData.fileUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  <InsertDriveFileIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">{installerFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(installerFile.size)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={installerUploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    onClick={handleInstallerUpload}
                    disabled={installerUploading}
                  >
                    {installerUploading ? "Đang upload..." : "Upload lên Cloudinary"}
                  </Button>
                  <IconButton onClick={handleRemoveInstaller} disabled={installerUploading}>
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}

              {formData.fileUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "success.50" }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" color="success.main" fontWeight="bold">
                      ✅ File đã upload thành công!
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {formData.fileUrl}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleRemoveInstaller} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}

              {installerUploading && <LinearProgress sx={{ mt: 1 }} />}
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Release Notes"
                multiline
                rows={3}
                value={formData.releaseNotes}
                onChange={handleInputChange("releaseNotes")}
                placeholder="What's new in this version?"
              />
            </Grid>

            {/* ===== IMAGE UPLOAD ===== */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                🖼️ Upload Ảnh Sản Phẩm
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: "none" }}
                id="image-upload-input"
              />

              {!imageFile && !formData.imageUrl && (
                <Box
                  sx={dropZoneStyle}
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleImageDrop}
                >
                  <ImageIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Kéo thả ảnh vào đây hoặc <strong>click để chọn ảnh</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hỗ trợ: jpg, png, gif, webp — Tối đa 10MB
                  </Typography>
                </Box>
              )}

              {imageFile && !formData.imageUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                  {imagePreview && (
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">{imageFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(imageFile.size)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={imageUploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                    onClick={handleImageUpload}
                    disabled={imageUploading}
                  >
                    {imageUploading ? "Đang upload..." : "Upload lên Cloudinary"}
                  </Button>
                  <IconButton onClick={handleRemoveImage} disabled={imageUploading}>
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}

              {formData.imageUrl && (
                <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "success.50" }}>
                  {(imagePreview || formData.imageUrl) && (
                    <Box
                      component="img"
                      src={imagePreview || formData.imageUrl}
                      alt="Uploaded"
                      sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" color="success.main" fontWeight="bold">
                      ✅ Ảnh đã upload thành công!
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {formData.imageUrl}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleRemoveImage} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              )}

              {imageUploading && <LinearProgress color="secondary" sx={{ mt: 1 }} />}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Image Type</InputLabel>
                <Select
                  value={formData.imageType}
                  onChange={handleInputChange("imageType")}
                  label="Image Type"
                >
                  <MenuItem value="SCREENSHOT">Screenshot</MenuItem>
                  <MenuItem value="ICON">Icon</MenuItem>
                  <MenuItem value="BANNER">Banner</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={handleInputChange("sortOrder")}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPrimary}
                    onChange={handleInputChange("isPrimary")}
                  />
                }
                label="Set as Primary Image"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Review Your Product
              </Typography>
              <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Product Name:</strong> {formData.productName}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Category:</strong> {formData.categoryId}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Price:</strong> ${formData.basePrice}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Trial Available:</strong> {formData.hasTrial ? "Yes" : "No"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tags:</strong> {formData.tags.join(", ")}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>License Tier:</strong> {formData.tierName} - ${formData.tierPrice}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Version:</strong> {formData.versionNumber}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>File URL:</strong> {formData.fileUrl || "Chưa upload"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Image URL:</strong> {formData.imageUrl || "Chưa upload"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Guide Document:</strong> {formData.guideDocumentUrl || "Không có"}
                </Typography>
                {(imagePreview || formData.imageUrl) && (
                  <Box sx={{ mt: 1 }}>
                    <Box
                      component="img"
                      src={imagePreview || formData.imageUrl}
                      alt="Product preview"
                      sx={{ maxWidth: 200, maxHeight: 150, objectFit: "cover", borderRadius: 1 }}
                    />
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  After submission, your product will be reviewed by our admin team.
                  You will receive a notification once it's approved.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Upload New Product
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Add your software product to the marketplace
          </Typography>

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

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Paper sx={{ p: 3, mb: 3 }}>
            {renderStepContent(activeStep)}
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 0 && !formData.productName)}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {activeStep === steps.length - 1 ? "Submit Product" : "Next"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductUpload;
