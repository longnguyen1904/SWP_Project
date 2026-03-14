import { useState, useEffect, useRef } from "react";
import { customerAPI } from "../../../services/api";
import "../../../Style/Vendor.css";

const BasicInfoStep = ({ productData, setProductData, categories }) => {
    const handleChange = (field) => (e) =>
        setProductData((prev) => ({ ...prev, [field]: e.target.value }));

    // ==================== TAGS ====================
    const [availableTags, setAvailableTags] = useState([]);
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const res = await customerAPI.getTags();
                const data = res.data?.data ?? res.data;
                const list = Array.isArray(data) ? data : (data?.content ?? []);
                setAvailableTags(list);
            } catch {
                setAvailableTags([]);
            }
        };
        loadTags();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setTagDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedTags = Array.isArray(productData.tags) ? productData.tags : [];

    const toggleTag = (tagName) => {
        setProductData((prev) => {
            const current = Array.isArray(prev.tags) ? prev.tags : [];
            const updated = current.includes(tagName)
                ? current.filter((t) => t !== tagName)
                : [...current, tagName];
            return { ...prev, tags: updated };
        });
    };

    const removeTag = (tagName) => {
        setProductData((prev) => ({
            ...prev,
            tags: (prev.tags || []).filter((t) => t !== tagName),
        }));
    };

    // Tags not yet selected
    const unselectedTags = availableTags.filter(
        (t) => !selectedTags.includes(t.tagName)
    );

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

            {/* ==================== TAGS ==================== */}
            <div className="form-group">
                <label className="form-label">Tags</label>

                {/* Selected tags as removable badges */}
                {selectedTags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        {selectedTags.map((tag) => (
                            <span key={tag} className="badge badge-default" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", fontSize: "13px" }}>
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", fontSize: "14px", lineHeight: 1, color: "inherit", opacity: 0.7 }}
                                    title={`Remove ${tag}`}>×</button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Dropdown to select tags */}
                <div ref={dropdownRef} style={{ position: "relative" }}>
                    <button type="button" className="form-select"
                        onClick={() => setTagDropdownOpen((o) => !o)}
                        style={{ textAlign: "left", cursor: "pointer", color: unselectedTags.length === 0 && selectedTags.length > 0 ? "#999" : undefined }}>
                        {unselectedTags.length === 0 && selectedTags.length > 0
                            ? "All tags selected"
                            : availableTags.length === 0
                                ? "No tags available"
                                : "-- Select tags --"}
                    </button>

                    {tagDropdownOpen && unselectedTags.length > 0 && (
                        <div style={{
                            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                            background: "#1e293b", border: "1px solid #334155", borderRadius: "6px",
                            maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                        }}>
                            {unselectedTags.map((t) => (
                                <div key={t.tagID} onClick={() => toggleTag(t.tagName)}
                                    style={{
                                        padding: "8px 12px", cursor: "pointer", fontSize: "14px",
                                        borderBottom: "1px solid #334155", transition: "background 0.15s",
                                        color: "#e2e8f0"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                    {t.tagName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <span className="form-hint">Chọn tags để phân loại sản phẩm — Tùy chọn</span>
            </div>
        </div>
    );
};

export default BasicInfoStep;
