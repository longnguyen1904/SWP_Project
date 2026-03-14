import "../../../Style/Vendor.css";

const ReviewStep = ({ productData, images, version, licenseTiers }) => (
    <div>
        <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 16 }}>Review & Submit</h3>
        <div className="alert alert-info mb-16">Please review your product information before submitting for approval.</div>

        <div className="info-section">
            <div className="info-row"><span className="info-label">Product Name</span><span className="info-value">{productData.productName}</span></div>
            <div className="info-row"><span className="info-label">Base Price</span><span className="info-value">${productData.basePrice}</span></div>
            <div className="info-row"><span className="info-label">Description</span><span className="info-value">{productData.description}</span></div>
            <div className="info-row"><span className="info-label">Guide Document</span><span className="info-value">{productData.guideDocumentUrl || "Không có"}</span></div>
            <div className="info-row"><span className="info-label">Images</span><span className="info-value">{images.length}</span></div>
            <div className="info-row"><span className="info-label">Version</span><span className="info-value">{version.versionNumber}</span></div>
            <div className="info-row"><span className="info-label">License Tiers</span><span className="info-value">{licenseTiers.length}</span></div>
        </div>
    </div>
);

export default ReviewStep;
