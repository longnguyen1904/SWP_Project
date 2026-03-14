import "../../../Style/Vendor.css";

const BasicInfoStep = ({ productData, setProductData, categories }) => {
    const handleChange = (field) => (e) =>
        setProductData((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-input" value={productData.productName} onChange={handleChange("productName")} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={productData.categoryId} onChange={handleChange("categoryId")} required>
                        <option value="">-- Select --</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" rows={4} value={productData.description} onChange={handleChange("description")} required />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Base Price ($) *</label>
                    <input className="form-input" type="number" value={productData.basePrice} onChange={handleChange("basePrice")} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                    <label className="form-label">Has Trial</label>
                    <select className="form-select" value={productData.hasTrial ? "true" : "false"}
                        onChange={(e) => setProductData((prev) => ({ ...prev, hasTrial: e.target.value === "true" }))}>
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Trial Duration (days)</label>
                    <input className="form-input" type="number" value={productData.trialDurationDays} onChange={handleChange("trialDurationDays")}
                        disabled={!productData.hasTrial} />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Guide Document URL</label>
                <input className="form-input" value={productData.guideDocumentUrl} onChange={handleChange("guideDocumentUrl")} placeholder="https://example.com/guide.pdf" />
                <span className="form-hint">Link tài liệu hướng dẫn sử dụng sản phẩm — Tùy chọn</span>
            </div>
        </div>
    );
};

export default BasicInfoStep;
