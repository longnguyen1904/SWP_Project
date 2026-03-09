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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { vendorAPI, customerAPI } from "../../services/api";

const ProductUploadForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);
  const [productId, setProductId] = useState(null);

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

  const addImage = () => {
    if (imageUpload.imageUrl) {
      setImages([...images, { ...imageUpload, id: Date.now() }]);
      setImageUpload({ imageUrl: "", isPrimary: false, sortOrder: images.length });
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
                  sx={{ height: "56px" }}
                >
                  + Add
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
                placeholder="URL to the downloadable file (or use Upload Installer first)"
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
