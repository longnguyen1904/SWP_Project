import "../../../Style/Vendor.css";

const LicenseTiersStep = ({ licenseTiers, setLicenseTiers, tierForm, setTierForm }) => {
    const addTier = () => {
        if (tierForm.tierName && tierForm.price) {
            setLicenseTiers((prev) => [...prev, { ...tierForm, id: Date.now() }]);
            setTierForm({ tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "" });
        }
    };

    const removeTier = (id) => setLicenseTiers((prev) => prev.filter((t) => t.id !== id));
    const handleChange = (field) => (e) => setTierForm((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <div>
            <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 16 }}>License Tiers</h3>
            <div className="form-row mb-16">
                <div className="form-group"><label className="form-label">Tên Tier</label><input className="form-input" placeholder="VD: Basic" value={tierForm.tierName} onChange={handleChange("tierName")} /></div>
                <div className="form-group"><label className="form-label">Mã Tier</label><input className="form-input" placeholder="VD: STD" value={tierForm.tierCode} onChange={handleChange("tierCode")} /></div>
                <div className="form-group"><label className="form-label">Giá ($)</label><input className="form-input" type="number" placeholder="0" value={tierForm.price} onChange={handleChange("price")} /></div>
                <div className="form-group"><label className="form-label">Số thiết bị</label><input className="form-input" type="number" placeholder="1" value={tierForm.maxDevices} onChange={handleChange("maxDevices")} /></div>
                <div className="form-group"><label className="form-label">Thời hạn (ngày)</label><input className="form-input" type="number" placeholder="365" value={tierForm.durationDays} onChange={handleChange("durationDays")} /></div>
                <div style={{ flex: 0, paddingTop: 24 }}><button className="btn btn-secondary" onClick={addTier} style={{ height: 42 }}>+ Add</button></div>
            </div>

            <div className="form-group mb-16">
                <textarea className="form-textarea" rows={2} placeholder="License Content" value={tierForm.content} onChange={handleChange("content")} />
            </div>

            <div className="table-wrapper">
                <table className="vendor-table">
                    <thead><tr><th>Tier Name</th><th>Code</th><th>Price</th><th>Devices</th><th>Duration</th><th>Actions</th></tr></thead>
                    <tbody>
                        {licenseTiers.map((tier) => (
                            <tr key={tier.id}>
                                <td>{tier.tierName}</td><td>{tier.tierCode}</td><td>${tier.price}</td>
                                <td>{tier.maxDevices}</td><td>{tier.durationDays} days</td>
                                <td><button className="btn btn-danger btn-sm" onClick={() => removeTier(tier.id)}>Delete</button></td>
                            </tr>
                        ))}
                        {licenseTiers.length === 0 && <tr><td colSpan="6" className="table-empty">Chưa có tier nào</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LicenseTiersStep;
