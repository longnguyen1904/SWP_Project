import React, { useState } from "react";
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
} from "@mui/material";
import { vendorAPI } from "../../services/api";

const ProductUpload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productId, setProductId] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    categoryId: "",
    description: "",
    basePrice: "",
    hasTrial: false,
    trialDurationDays: 7,
    tags: [],
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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Product Version
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Version Number"
                value={formData.versionNumber}
                onChange={handleInputChange("versionNumber")}
                placeholder="1.0.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Download URL"
                value={formData.fileUrl}
                onChange={handleInputChange("fileUrl")}
                placeholder="https://example.com/product-file.zip or upload via Upload Installer first"
                helperText="URL to the downloadable product file"
              />
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
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Product Image
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={formData.imageUrl}
                onChange={handleInputChange("imageUrl")}
                placeholder="https://example.com/product-screenshot.png or upload via Upload Image first"
              />
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
