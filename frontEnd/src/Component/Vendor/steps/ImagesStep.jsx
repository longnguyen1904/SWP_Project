import { useRef, useState } from "react";
import { uploadAPI } from "../../../services/api";
import "../../../Style/Vendor.css";

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const ImagesStep = ({ images, setImages, imageUpload, setImageUpload, setError, setSuccess }) => {
    const imageInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("File phải là ảnh (jpg, png, gif, webp)"); return; }
        if (file.size > 10 * 1024 * 1024) { setError("Ảnh không được vượt quá 10MB"); return; }
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setError("");
    };

    const handleUploadToCloud = async () => {
        if (!selectedFile) return;
        setUploading(true); setError("");
        try {
            const fd = new FormData();
            fd.append("file", selectedFile);
            const response = await uploadAPI.uploadImage(fd);
            const url = response.data?.data?.url || response.data?.url;
            if (url) {
                setImageUpload((prev) => ({ ...prev, imageUrl: url }));
                setSuccess("Upload ảnh thành công!");
                setTimeout(() => setSuccess(""), 3000);
            }
        } catch (err) { setError(err.response?.data?.message || "Upload ảnh thất bại."); }
        finally { setUploading(false); }
    };

    const clearFile = () => {
        setSelectedFile(null); setPreview(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const addImage = () => {
        if (imageUpload.imageUrl) {
            setImages((prev) => [...prev, { ...imageUpload, id: Date.now() }]);
            setImageUpload({ imageUrl: "", isPrimary: false, sortOrder: images.length });
            clearFile();
        }
    };

    return (
        <div>
            <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 16 }}>🖼️ Upload Ảnh Sản Phẩm</h3>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />

            {!selectedFile && !imageUpload.imageUrl && (
                <div className="drop-zone mb-16" onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); }}>
                    <div className="drop-zone-icon">🖼️</div>
                    <div className="drop-zone-text">Kéo thả ảnh vào đây hoặc <strong>click để chọn</strong></div>
                    <div className="drop-zone-hint">jpg, png, gif, webp — Tối đa 10MB</div>
                </div>
            )}

            {selectedFile && !imageUpload.imageUrl && (
                <div className="file-preview mb-16">
                    {preview && <img src={preview} alt="Preview" className="thumb-lg" />}
                    <div className="file-preview-info">
                        <div className="file-preview-name">{selectedFile.name}</div>
                        <div className="file-preview-size">{formatFileSize(selectedFile.size)}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleUploadToCloud} disabled={uploading}>
                        {uploading ? <><span className="spinner" /> Đang upload...</> : "⬆ Upload"}
                    </button>
                    <button className="btn-icon danger" onClick={clearFile} disabled={uploading}>🗑️</button>
                </div>
            )}

            {imageUpload.imageUrl && (
                <div className="file-preview success mb-16">
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div className="file-preview-info">
                        <div className="file-preview-name">Ảnh đã upload!</div>
                        <div className="file-preview-size word-break">{imageUpload.imageUrl}</div>
                    </div>
                    <button className="btn-icon danger" onClick={() => { setImageUpload((prev) => ({ ...prev, imageUrl: "" })); clearFile(); }}>🗑️</button>
                </div>
            )}

            {uploading && <div className="progress-bar mb-16"><div className="progress-bar-fill" /></div>}

            <span className="form-hint mb-8" style={{ display: "block" }}>Hoặc dán URL ảnh trực tiếp:</span>
            <div className="form-row mb-16">
                <div className="form-group" style={{ flex: 3 }}>
                    <label className="form-label">Image URL</label>
                    <input className="form-input" placeholder="https://..." value={imageUpload.imageUrl}
                        onChange={(e) => setImageUpload({ ...imageUpload, imageUrl: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Ảnh chính?</label>
                    <select className="form-select" value={imageUpload.isPrimary} onChange={(e) => setImageUpload({ ...imageUpload, isPrimary: e.target.value === "true" })}>
                        <option value="false">Not Primary</option>
                        <option value="true">Primary</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Thứ tự</label>
                    <input className="form-input" type="number" placeholder="0" value={imageUpload.sortOrder}
                        onChange={(e) => setImageUpload({ ...imageUpload, sortOrder: e.target.value })} />
                </div>
                <div style={{ flex: 0, paddingTop: 24 }}>
                    <button className="btn btn-secondary" onClick={addImage} disabled={!imageUpload.imageUrl} style={{ height: 42 }}>+ Add</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="vendor-table">
                    <thead>
                        <tr><th>Preview</th><th>Image URL</th><th>Primary</th><th>Sort</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {images.map((image) => (
                            <tr key={image.id}>
                                <td><img src={image.imageUrl} alt="thumb" className="thumb" /></td>
                                <td className="word-break" style={{ maxWidth: 200 }}>{image.imageUrl}</td>
                                <td>{image.isPrimary ? "Yes" : "No"}</td>
                                <td>{image.sortOrder}</td>
                                <td><button className="btn btn-danger btn-sm" onClick={() => setImages((prev) => prev.filter((img) => img.id !== image.id))}>Delete</button></td>
                            </tr>
                        ))}
                        {images.length === 0 && <tr><td colSpan="5" className="table-empty">Chưa có ảnh nào</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ImagesStep;
