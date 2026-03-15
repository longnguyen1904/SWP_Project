import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { vendorAPI, customerAPI } from "../../services/api";
import BasicInfoStep from "./steps/BasicInfoStep";
import ImagesStep from "./steps/ImagesStep";
import VersionStep from "./steps/VersionStep";
import LicenseTiersStep from "./steps/LicenseTiersStep";
import ReviewStep from "./steps/ReviewStep";
import "../../Style/Vendor.css";

const steps = ["Basic Information", "Upload Images", "Product Version", "License Tiers", "Submit"];

const ProductUploadForm = () => {
  const [searchParams] = useSearchParams();
  const resumeProductId = searchParams.get("productId");

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState([]);
  const [productId, setProductId] = useState(null);

  const [productData, setProductData] = useState({
    productName: "", categoryId: "", description: "", basePrice: "",
    hasTrial: false, trialDurationDays: 7, guideDocumentUrl: "", tags: [],
  });

  const [images, setImages] = useState([]);
  const [imageUpload, setImageUpload] = useState({ imageUrl: "", isPrimary: false, sortOrder: 0 });
  const [version, setVersion] = useState({ versionNumber: "", fileUrl: "", releaseNotes: "" });
  const [licenseTiers, setLicenseTiers] = useState([]);
  const [tierForm, setTierForm] = useState({
    tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "",
  });

  // ==================== LOAD CATEGORIES ====================
  useEffect(() => {
    const load = async () => {
      try {
        const res = await customerAPI.getCategories();
        const data = res.data?.data ?? res.data;
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        setCategories(list.map((c) => ({ id: c.categoryID ?? c.id, name: c.categoryName ?? c.name })));
      } catch {
        setCategories([
          { id: 1, name: "Developer Tools" }, { id: 2, name: "Media Editors" },
          { id: 3, name: "Utilities" }, { id: 4, name: "Business" }, { id: 5, name: "Productivity" },
        ]);
      }
    };
    load();
  }, []);

  // ==================== LOAD DRAFT FROM API ====================
  useEffect(() => {
    if (!resumeProductId) return;
    const loadDraft = async () => {
      setInitialLoading(true);
      try {
        const res = await vendorAPI.getProduct(resumeProductId);
        const detail = res.data?.data ?? res.data;
        const p = detail.product || detail;

        setProductId(Number(resumeProductId));
        setProductData({
          productName: p.productName || "", categoryId: p.categoryId || "",
          description: p.description || "", basePrice: p.basePrice != null ? String(p.basePrice) : "",
          hasTrial: p.hasTrial || false, trialDurationDays: p.trialDurationDays || 7,
          guideDocumentUrl: p.guideDocumentUrl || "", tags: p.tags || [],
        });

        if (detail.images?.length > 0) {
          setImages(detail.images.map((img, i) => ({
            id: img.imageId || Date.now() + i, imageUrl: img.imageUrl,
            isPrimary: img.isPrimary || false, sortOrder: img.sortOrder || i, saved: true,
          })));
        }

        if (detail.latestVersion) {
          setVersion({
            versionNumber: detail.latestVersion.versionNumber || "",
            fileUrl: detail.latestVersion.fileUrl || "",
            releaseNotes: detail.latestVersion.releaseNotes || "", saved: true,
          });
        }

        if (detail.licenseTiers?.length > 0) {
          setLicenseTiers(detail.licenseTiers.map((t, i) => ({
            id: t.tierId || Date.now() + i, tierName: t.tierName || "", tierCode: t.tierCode || "STD",
            price: t.price != null ? String(t.price) : "", maxDevices: t.maxDevices || 1,
            durationDays: t.durationDays || 365, content: t.content || "", saved: true,
          })));
        }

        const hasImages = detail.images?.length > 0;
        const hasVersion = detail.latestVersion?.versionNumber;
        const hasTiers = detail.licenseTiers?.length > 0;
        if (hasTiers) setActiveStep(4);
        else if (hasVersion) setActiveStep(3);
        else if (hasImages) setActiveStep(2);
        else setActiveStep(0);

        setSuccess("Đã tải bản nháp thành công!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Không thể tải bản nháp: " + (err.response?.data?.message || err.message));
      } finally { setInitialLoading(false); }
    };
    loadDraft();
  }, [resumeProductId]);

  // ==================== VALIDATION ====================
  const validateCurrentStep = () => {
    setError("");
    switch (activeStep) {
      case 0:
        if (!productData.productName) { setError("Product name is required"); return false; }
        if (!productData.categoryId) { setError("Category is required"); return false; }
        if (!productData.description) { setError("Description is required"); return false; }
        if (!productData.basePrice || parseFloat(productData.basePrice) <= 0) { setError("Base price must be greater than 0"); return false; }
        return true;
      case 1:
        if (images.length === 0) { setError("Vui lòng thêm ít nhất 1 ảnh sản phẩm"); return false; }
        return true;
      case 2:
        if (!version.versionNumber) { setError("Version number is required"); return false; }
        if (!version.fileUrl) { setError("File URL is required"); return false; }
        return true;
      case 3:
        if (licenseTiers.length === 0) { setError("Vui lòng thêm ít nhất 1 license tier"); return false; }
        return true;
      default: return true;
    }
  };

  // ==================== API FUNCTIONS ====================
  const createProduct = async () => {
    setError("");
    const payload = { ...productData, categoryId: Number(productData.categoryId), basePrice: parseFloat(productData.basePrice) };
    const response = await vendorAPI.createProduct(payload);
    const data = response.data?.data ?? response.data;
    const id = data?.productId ?? data?.id;
    setProductId(id);
    setSuccess("Product created!");
    return id;
  };

  const uploadProductImage = async (pid, imageData) => { await vendorAPI.uploadProductImage(pid, imageData); };
  const createProductVersion = async (pid) => { await vendorAPI.createProductVersion(pid, version); };
  const createLicenseTier = async (pid, tier) => {
    await vendorAPI.createLicenseTier(pid, {
      tierName: tier.tierName, tierCode: tier.tierCode || "STD",
      price: parseFloat(tier.price), maxDevices: Number(tier.maxDevices),
      durationDays: Number(tier.durationDays), content: tier.content || "",
    });
  };

  // ==================== STEP NAVIGATION ====================
  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    setLoading(true); setError("");
    try {
      let currentProductId = productId;
      switch (activeStep) {
        case 0:
          if (!currentProductId) { currentProductId = await createProduct(); }
          else {
            await vendorAPI.saveDraft(currentProductId, {
              productName: productData.productName, description: productData.description,
              basePrice: parseFloat(productData.basePrice), guideDocumentUrl: productData.guideDocumentUrl || null,
            });
          }
          break;
        case 1:
          for (const image of images.filter((img) => !img.saved)) { await uploadProductImage(currentProductId, image); }
          setImages((prev) => prev.map((img) => ({ ...img, saved: true })));
          break;
        case 2:
          if (!version.saved) { await createProductVersion(currentProductId); setVersion((prev) => ({ ...prev, saved: true })); }
          break;
        case 3:
          for (const tier of licenseTiers.filter((t) => !t.saved)) { await createLicenseTier(currentProductId, tier); }
          setLicenseTiers((prev) => prev.map((t) => ({ ...t, saved: true })));
          break;
        default: break;
      }
      setActiveStep((prev) => prev + 1);
    } catch (err) { setError(err.response?.data?.message || "Lỗi khi lưu. Vui lòng thử lại."); }
    finally { setLoading(false); }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      await vendorAPI.submitProduct(productId);
      setSuccess("Product successfully submitted for approval!");
      setActiveStep(0); setProductId(null);
      setProductData({ productName: "", categoryId: "", description: "", basePrice: "", hasTrial: false, trialDurationDays: 7, guideDocumentUrl: "", tags: [] });
      setImages([]); setVersion({ versionNumber: "", fileUrl: "", releaseNotes: "" }); setLicenseTiers([]);
    } catch (err) { setError(err.response?.data?.message || "Submit thất bại."); }
    finally { setLoading(false); }
  };

  const handleSaveDraft = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      if (!productId) {
        const payload = { ...productData, categoryId: productData.categoryId ? Number(productData.categoryId) : null, basePrice: productData.basePrice ? parseFloat(productData.basePrice) : null };
        const response = await vendorAPI.createProduct(payload);
        const data = response.data?.data ?? response.data;
        setProductId(data?.productId ?? data?.id);
        setSuccess("Đã lưu nháp sản phẩm mới!");
      } else {
        await vendorAPI.saveDraft(productId, {
          productName: productData.productName || null, description: productData.description || null,
          basePrice: productData.basePrice ? parseFloat(productData.basePrice) : null, guideDocumentUrl: productData.guideDocumentUrl || null,
        });
        setSuccess("Đã lưu nháp thành công!");
      }
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Lưu nháp thất bại."); }
    finally { setLoading(false); }
  };

  // ==================== RENDER ====================
  const renderStepContent = (step) => {
    switch (step) {
      case 0: return <BasicInfoStep productData={productData} setProductData={setProductData} categories={categories} />;
      case 1: return <ImagesStep images={images} setImages={setImages} imageUpload={imageUpload} setImageUpload={setImageUpload} setError={setError} setSuccess={setSuccess} />;
      case 2: return <VersionStep version={version} setVersion={setVersion} setError={setError} setSuccess={setSuccess} />;
      case 3: return <LicenseTiersStep licenseTiers={licenseTiers} setLicenseTiers={setLicenseTiers} tierForm={tierForm} setTierForm={setTierForm} />;
      case 4: return <ReviewStep productData={productData} images={images} version={version} licenseTiers={licenseTiers} />;
      default: return "Unknown step";
    }
  };

  return (
    <div className="vendor-page">
      {error && <div className="alert alert-error">{error}<button className="alert-close" onClick={() => setError("")}>×</button></div>}
      {success && <div className="alert alert-success">{success}<button className="alert-close" onClick={() => setSuccess("")}>×</button></div>}

      <div className="vendor-card">
        {initialLoading ? (
          <div className="loading-center"><span className="spinner spinner-lg" /> Đang tải bản nháp...</div>
        ) : (
          <>
            {/* Stepper */}
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

            {/* Step Content */}
            <div className="mb-24">{renderStepContent(activeStep)}</div>

            {/* Navigation */}
            <div className="flex-between">
              <button className="btn btn-secondary" disabled={activeStep === 0} onClick={handleBack}>Back</button>
              <div className="flex-gap">
                {activeStep < steps.length - 1 && (
                  <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={loading}>
                    {loading ? <span className="spinner" /> : "💾"} Save Draft
                  </button>
                )}
                {activeStep === steps.length - 1 ? (
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner" /> Submitting...</> : "Submit Product"}
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handleNext} disabled={loading}>
                    {loading ? <><span className="spinner" /> Saving...</> : "Next"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductUploadForm;
