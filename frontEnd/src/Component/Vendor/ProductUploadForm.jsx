import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { vendorAPI, uploadAPI } from "../../services/api";

const ProductUploadForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);
  const [productId, setProductId] = useState(null);

  // Product Basic Info
  const [productData, setProductData] = useState({
    productName: "",
    categoryId: "",
    description: "",
    basePrice: "",
    hasTrial: false,
    trialDurationDays: 7,
    tags: [],
  });

  // Product Images
  const [images, setImages] = useState([]);
  const [imageUpload, setImageUpload] = useState({ imageUrl: "", isPrimary: false, sortOrder: 0 });

  // Product Version
  const [version, setVersion] = useState({
    versionNumber: "",
    fileUrl: "",
    releaseNotes: "",
  });

  // License Tiers
  const [licenseTiers, setLicenseTiers] = useState([]);
  const [tierForm, setTierForm] = useState({
    tierName: "",
    tierCode: "",
    price: "",
    maxDevices: 1,
    durationDays: 365,
    content: "",
  });

  const steps = ["Basic Information", "Upload Images", "Product Version", "License Tiers", "Submit"];

  useEffect(() => {
    // Load categories (mock data for now)
    setCategories([
      { id: 1, name: "IDE & Code Editor" },
      { id: 2, name: "Project Management" },
      { id: 3, name: "Design Tools" },
      { id: 4, name: "Security & Antivirus" },
      { id: 5, name: "Database Tools" },
    ]);
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
          setError("Please upload at least one product image");
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
      const response = await vendorAPI.createProduct(productData);
      setProductId(response.data.data.productId);
      setSuccess("Product created successfully!");
      return response.data.data.productId;
    } catch (err) {
      setError("Failed to create product: " + (err.response?.data?.message || err.message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProductImage = async (productId, imageData) => {
    try {
      await vendorAPI.uploadProductImage(productId, imageData);
    } catch (err) {
      setError("Failed to upload image: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const createProductVersion = async (productId) => {
    try {
      await vendorAPI.createProductVersion(productId, version);
    } catch (err) {
      setError("Failed to create version: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const createLicenseTier = async (productId, tierData) => {
    try {
      await vendorAPI.createLicenseTier(productId, tierData);
    } catch (err) {
      setError("Failed to create license tier: " + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  const submitProduct = async (productId) => {
    try {
      await vendorAPI.submitProduct(productId);
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
      // Step 1: Create product
      let currentProductId = productId;
      if (!currentProductId) {
        currentProductId = await createProduct();
        setProductId(currentProductId);
      }

      // Step 2: Upload images
      for (const image of images) {
        await uploadProductImage(currentProductId, image);
      }

      // Step 3: Create version
      await createProductVersion(currentProductId);

      // Step 4: Create license tiers
      for (const tier of licenseTiers) {
        await createLicenseTier(currentProductId, tier);
      }

      // Step 5: Submit for approval
      await submitProduct(currentProductId);

      setSuccess("Product successfully created and submitted for approval!");
      // Reset form
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
    } catch (err) {
      // Error already set in individual functions
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (imageUpload.imageUrl) {
      setImages([...images, { ...imageUpload, id: Date.now() }]);
      setImageUpload({ imageUrl: "", isPrimary: false, sortOrder: images.length });
    }
  };

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const addLicenseTier = () => {
    if (tierForm.tierName && tierForm.price) {
      setLicenseTiers([...licenseTiers, { ...tierForm, id: Date.now() }]);
      setTierForm({
        tierName: "",
        tierCode: "",
        price: "",
        maxDevices: 1,
        durationDays: 365,
        content: "",
      });
    }
  };

  const removeLicenseTier = (id) => {
    setLicenseTiers(licenseTiers.filter(tier => tier.id !== id));
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
                label="Base Price (VND)"
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
                  onChange={(e) => setProductData({ ...productData, hasTrial: e.target.value })}
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
              Product Images
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={imageUpload.imageUrl}
                  onChange={(e) => setImageUpload({ ...imageUpload, imageUrl: e.target.value })}
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
                  startIcon={<AddIcon />}
                  sx={{ height: "56px" }}
                >
                  Add
                </Button>
              </Grid>
            </Grid>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image URL</TableCell>
                    <TableCell>Primary</TableCell>
                    <TableCell>Sort Order</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {images.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell>{image.imageUrl}</TableCell>
                      <TableCell>
                        <Chip label={image.isPrimary ? "Yes" : "No"} size="small" />
                      </TableCell>
                      <TableCell>{image.sortOrder}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => removeImage(image.id)}>
                          <DeleteIcon />
                        </IconButton>
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
              <TextField
                fullWidth
                label="Version Number"
                value={version.versionNumber}
                onChange={(e) => setVersion({ ...version, versionNumber: e.target.value })}
                placeholder="e.g., 1.0.0"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="File URL"
                value={version.fileUrl}
                onChange={(e) => setVersion({ ...version, fileUrl: e.target.value })}
                placeholder="URL to the downloadable file"
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
                  label="Price (VND)"
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
                  startIcon={<AddIcon />}
                  sx={{ height: "56px" }}
                >
                  Add
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
                      <TableCell>{parseInt(tier.price).toLocaleString()}đ</TableCell>
                      <TableCell>{tier.maxDevices}</TableCell>
                      <TableCell>{tier.durationDays} days</TableCell>
                      <TableCell>
                        <IconButton onClick={() => removeLicenseTier(tier.id)}>
                          <DeleteIcon />
                        </IconButton>
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
                <Typography>{parseInt(productData.basePrice).toLocaleString()}đ</Typography>
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
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Submit Product"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
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
