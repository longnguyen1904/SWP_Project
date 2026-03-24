import React, { useState, useEffect } from "react";
import { vendorAPI, uploadAPI } from "../../services/api";
import "../../Style/Vendor.css";

const steps = ["Basic Information", "Business Details", "Documents"];

const VendorRegistration = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Vendor status tracking
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [vendorStatus, setVendorStatus] = useState(null); // null = not registered

  const [formData, setFormData] = useState({
    type: "INDIVIDUAL",
    companyName: "",
    description: "",
    taxCode: "",
    identificationDoc: "",
  });

  // Check if user already registered as vendor
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await vendorAPI.getMyVendorStatus();
        const data = res.data?.data ?? res.data;
        if (data?.registered) {
          setVendorStatus(data);
        }
      } catch {
        // Not registered or error — show registration form
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExts = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError("Only PDF, DOC, DOCX, JPG, PNG files are accepted");
      e.target.value = "";
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File must not exceed 50MB");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const isImage = file.type.startsWith("image/");
      const res = isImage
        ? await uploadAPI.uploadImage(fd)
        : await uploadAPI.uploadDocument(fd);
      const url = res.data?.data?.url;
      if (url) {
        setSuccess("File uploaded successfully!");
        setFormData((prev) => ({ ...prev, identificationDoc: url }));
        setUploadedFileName(file.name);
      } else {
        setError("Upload failed - URL not received");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, identificationDoc: "" }));
    setUploadedFileName("");
  };

  const handleNext = () => {
    setError("");
    if (!formData.type) { setError("Please select vendor type"); return; }
    if (activeStep === 0 && formData.type === "COMPANY" && !formData.companyName.trim()) {
      setError("Company name is required for COMPANY type"); return;
    }
    if (activeStep === 1 && !formData.taxCode.trim()) {
      setError("Tax Code / Citizen ID is required"); return;
    }
    if (activeStep === 2 && !formData.identificationDoc) {
      setError("Please upload identification document"); return;
    }
    if (activeStep === steps.length - 1) { handleSubmit(); } else { setActiveStep((s) => s + 1); }
  };

  const handleBack = () => setActiveStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      await vendorAPI.registerVendor(formData);
      setVendorStatus({ registered: true, status: "PENDING" });
      setSuccess("Vendor registration submitted successfully! Please wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking vendor status
  if (checkingStatus) {
    return (
      <div className="vendor-page-narrow">
        <div className="vendor-card">
          <div className="loading-center"><span className="spinner spinner-lg" /> Checking registration status...</div>
        </div>
      </div>
    );
  }

  // If already registered — show status panel instead of form
  if (vendorStatus?.registered) {
    const status = vendorStatus.status;
    return (
      <div className="vendor-page-narrow">
        <div className="vendor-card">
          <div className="text-center mb-24">
            <h2 className="vendor-page-title">Vendor Registration</h2>
            <p className="vendor-page-subtitle">Your vendor application status</p>
          </div>

          {/* Status Card */}
          <div style={{
            background: status === "APPROVED" ? "rgba(16, 185, 129, 0.1)"
              : status === "REJECTED" ? "rgba(239, 68, 68, 0.1)"
              : "rgba(245, 158, 11, 0.1)",
            border: `1px solid ${status === "APPROVED" ? "#10b981"
              : status === "REJECTED" ? "#ef4444"
              : "#f59e0b"}`,
            borderRadius: 12,
            padding: "24px",
            marginBottom: 24
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span className={`badge ${
                status === "APPROVED" ? "badge-success"
                : status === "REJECTED" ? "badge-error"
                : "badge-warning"
              }`} style={{ fontSize: 14, padding: "6px 16px" }}>
                {status === "APPROVED" ? "Approved" : status === "REJECTED" ? "Rejected" : "Pending Review"}
              </span>
            </div>

            {status === "PENDING" && (
              <p style={{ color: "#e2e8f0", margin: 0 }}>
                Your vendor registration is being reviewed by our admin team. This usually takes 1-3 business days. You will be notified once a decision is made.
              </p>
            )}

            {status === "APPROVED" && (
              <p style={{ color: "#10b981", margin: 0 }}>
                Your vendor registration has been approved! You can now access vendor features and start selling products.
              </p>
            )}

            {status === "REJECTED" && (
              <>
                <p style={{ color: "#ef4444", margin: 0, marginBottom: vendorStatus.rejectionNote ? 12 : 0 }}>
                  Your vendor registration has been rejected.
                </p>
                {vendorStatus.rejectionNote && (
                  <div className="alert alert-error" style={{ marginTop: 8 }}>
                    <strong>Rejection reason:</strong> {vendorStatus.rejectionNote}
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={() => setVendorStatus(null)}
                >
                  Register Again
                </button>
              </>
            )}
          </div>

          {/* Registration Details */}
          <div className="info-grid">
            {vendorStatus.companyName && (
              <div className="info-row">
                <span className="info-label">Company Name</span>
                <span className="info-value">{vendorStatus.companyName}</span>
              </div>
            )}
            {vendorStatus.createdAt && (
              <div className="info-row">
                <span className="info-label">Submitted</span>
                <span className="info-value">{new Date(vendorStatus.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {vendorStatus.verifiedAt && (
              <div className="info-row">
                <span className="info-label">Verified</span>
                <span className="info-value">{new Date(vendorStatus.verifiedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Registration form (not yet registered)
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <div className="form-group">
              <label className="form-label">Vendor Type *</label>
              <select className="form-select" value={formData.type} onChange={handleChange("type")}>
                <option value="">-- Select vendor type --</option>
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
              <label className="form-label">Identification Document *</label>

              {!formData.identificationDoc ? (
                <div className="drop-zone" onClick={() => !uploading && document.getElementById("id-doc-upload").click()}>
                  {uploading ? (
                    <>
                      <div className="drop-zone-icon"><span className="spinner" /></div>
                      <div className="drop-zone-text">Uploading document...</div>
                      <div className="progress-bar"><div className="progress-bar-fill" /></div>
                    </>
                  ) : (
                    <>
                      <div className="drop-zone-icon"></div>
                      <div className="drop-zone-text">Click to select file</div>
                      <div className="drop-zone-hint">PDF, DOC, DOCX, JPG, PNG (max 50MB)</div>
                    </>
                  )}
                  <input
                    id="id-doc-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <div className="file-preview success">
                  <span style={{ fontSize: 24 }}></span>
                  <div className="file-preview-info">
                    <div className="file-preview-name">{uploadedFileName}</div>
                    <div className="file-preview-size">Uploaded successfully</div>
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={handleRemoveFile}>Remove</button>
                </div>
              )}

              <span className="form-hint">Upload business license or identification document (ID card/Citizen ID)</span>
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
          <button className="btn btn-primary" onClick={handleNext} disabled={loading || uploading}>
            {loading && <span className="spinner" />}
            {activeStep === steps.length - 1 ? "Submit Registration" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;
