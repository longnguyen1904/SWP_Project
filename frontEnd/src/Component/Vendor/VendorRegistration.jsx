import { useState } from "react";
import { vendorAPI } from "../../services/api";
import "../../Style/Vendor.css";

const steps = ["Basic Information", "Business Details", "Documents"];

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
    identificationDoc: "",
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError("");
  };

  const handleNext = () => {
    setError("");
    if (activeStep === 0 && formData.type === "COMPANY" && !formData.companyName.trim()) {
      setError("Tên công ty không được để trống khi loại vendor là COMPANY"); return;
    }
    if (activeStep === 1 && !formData.taxCode.trim()) {
      setError("Tax Code / Citizen ID không được để trống"); return;
    }
    if (activeStep === 2 && !formData.identificationDoc.trim()) {
      setError("Link tài liệu xác thực không được để trống"); return;
    }
    if (activeStep === steps.length - 1) { handleSubmit(); } else { setActiveStep((s) => s + 1); }
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      await vendorAPI.registerVendor(formData);
      setSuccess("Vendor registration submitted successfully! Please wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <div className="form-group">
              <label className="form-label">Vendor Type</label>
              <select className="form-select" value={formData.type} onChange={handleChange("type")}>
                <option value="INDIVIDUAL">Individual</option>
                <option value="COMPANY">Company</option>
              </select>
            </div>
            {formData.type === "COMPANY" && (
              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-input" value={formData.companyName} onChange={handleChange("companyName")} placeholder="Enter company name" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={4} value={formData.description} onChange={handleChange("description")} placeholder="Tell us about your business and the products you plan to sell" />
              <span className="form-hint">Optional: describe your business and what you plan to offer on the marketplace</span>
            </div>
          </>
        );
      case 1:
        return (
          <div className="form-group">
            <label className="form-label">Tax Code / Citizen ID *</label>
            <input className="form-input" value={formData.taxCode} onChange={handleChange("taxCode")} placeholder="Tax code or citizen identification number" />
          </div>
        );
      case 2:
        return (
          <>
            <div className="form-group">
              <label className="form-label">Identification Document URL *</label>
              <input className="form-input" value={formData.identificationDoc} onChange={handleChange("identificationDoc")} placeholder="https://example.com/identification-document.pdf" />
              <span className="form-hint">Provide a link to your business license or identification document</span>
            </div>
            <div className="alert alert-info">
              Please ensure your identification documents are valid and clearly visible. This information is required for vendor verification.
            </div>
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="vendor-page-narrow">
      <div className="vendor-card">
        <div className="text-center mb-24">
          <h2 className="vendor-page-title">Vendor Registration</h2>
          <p className="vendor-page-subtitle">Register as a vendor to start selling your products on our marketplace</p>
        </div>

        {error && <div className="alert alert-error">{error}<button className="alert-close" onClick={() => setError("")}>×</button></div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="stepper">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`stepper-step ${i === activeStep ? "active" : i < activeStep ? "completed" : ""}`}>
                <span className="stepper-num">{i < activeStep ? "✓" : i + 1}</span>
                <span>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`stepper-line ${i < activeStep ? "active" : ""}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="mb-24">{renderStep()}</div>

        <div className="flex-between">
          <button className="btn btn-secondary" onClick={handleBack} disabled={activeStep === 0}>Back</button>
          <button className="btn btn-primary" onClick={handleNext} disabled={loading}>
            {loading && <span className="spinner" />}
            {activeStep === steps.length - 1 ? "Submit Registration" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;
