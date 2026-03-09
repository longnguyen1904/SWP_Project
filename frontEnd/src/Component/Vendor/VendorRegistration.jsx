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
} from "@mui/material";
import { vendorAPI } from "../../services/api";

const VendorRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    type: "INDIVIDUAL",
    companyName: "",
    description: "",
    taxCode: "",
    citizenId: "",
    identificationDoc: "",
  });

  const steps = ["Basic Information", "Business Details", "Documents"];

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    setError("");
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
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
      await vendorAPI.registerVendor(formData);
      setSuccess("Vendor registration submitted successfully! Please wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
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
              <FormControl fullWidth>
                <InputLabel>Vendor Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleInputChange("type")}
                  label="Vendor Type"
                >
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                  <MenuItem value="COMPANY">Company</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.type === "COMPANY" && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={handleInputChange("companyName")}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="Tell us about your business and the products you plan to sell"
                helperText="Optional: describe your business and what you plan to offer on the marketplace"
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
                label="Tax Code"
                value={formData.taxCode}
                onChange={handleInputChange("taxCode")}
                placeholder="Business tax identification number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Citizen ID / CCCD"
                value={formData.citizenId}
                onChange={handleInputChange("citizenId")}
                required
                placeholder="National identification number"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Identification Document URL"
                value={formData.identificationDoc}
                onChange={handleInputChange("identificationDoc")}
                required
                placeholder="https://example.com/identification-document.pdf"
                helperText="Provide a link to your business license or identification document (or upload via Upload Document first)"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  Please ensure your identification documents are valid and clearly visible.
                  This information is required for vendor verification.
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
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Vendor Registration
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Register as a vendor to start selling your products on our marketplace
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
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {activeStep === steps.length - 1 ? "Submit Registration" : "Next"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VendorRegistration;
