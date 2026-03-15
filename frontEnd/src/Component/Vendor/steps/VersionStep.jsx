import { useRef, useState } from "react";
import { uploadAPI } from "../../../services/api";
import "../../../Style/Vendor.css";

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const VersionStep = ({ version, setVersion, setError, setSuccess }) => {
    const installerInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const validExts = [".exe", ".zip", ".msi", ".dmg", ".pkg", ".jar"];
        if (!validExts.some((ext) => file.name.toLowerCase().endsWith(ext))) { setError("Chỉ chấp nhận: exe, zip, msi, dmg, pkg, jar"); return; }
        if (file.size > 500 * 1024 * 1024) { setError("File không được vượt quá 500MB"); return; }
        setSelectedFile(file); setError(""); setVersion((prev) => ({ ...prev, saved: false }));
    };

    const handleUploadToCloud = async () => {
        if (!selectedFile) return;
        setUploading(true); setError("");
        try {
            const fd = new FormData();
            fd.append("file", selectedFile);
            const response = await uploadAPI.uploadInstaller(fd);
            const url = response.data?.data?.url || response.data?.url;
            if (url) { setVersion((prev) => ({ ...prev, fileUrl: url, saved: false })); setSuccess("Upload file thành công!"); setTimeout(() => setSuccess(""), 3000); }
        } catch (err) { setError(err.response?.data?.message || "Upload thất bại."); }
        finally { setUploading(false); }
    };

    const clearFile = () => {
        setSelectedFile(null); setVersion((prev) => ({ ...prev, fileUrl: "", saved: false }));
        if (installerInputRef.current) installerInputRef.current.value = "";
    };

    return (
        <div>
            <h3 style={{ color: "#e2e8f0", fontSize: 16, marginBottom: 16 }}>📦 Upload File Cài Đặt</h3>

            <div className="form-group">
                <label className="form-label">Version Number *</label>
                <input className="form-input" value={version.versionNumber}
                    onChange={(e) => setVersion({ ...version, versionNumber: e.target.value })} placeholder="e.g., 1.0.0" required />
            </div>

            <input ref={installerInputRef} type="file" accept=".exe,.zip,.msi,.dmg,.pkg,.jar" onChange={handleFileSelect} style={{ display: "none" }} />

            {!selectedFile && !version.fileUrl && (
                <div className="drop-zone mb-16"
                    onClick={() => installerInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); }}>
                    <div className="drop-zone-icon">📂</div>
                    <div className="drop-zone-text">Kéo thả file vào đây hoặc <strong>click để chọn</strong></div>
                    <div className="drop-zone-hint">exe, zip, msi, dmg, pkg, jar — Tối đa 500MB</div>
                </div>
            )}

            {selectedFile && !version.fileUrl && (
                <div className="file-preview mb-16">
                    <span style={{ fontSize: 24 }}>📎</span>
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

            {version.fileUrl && (
                <div className="file-preview success mb-16">
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div className="file-preview-info">
                        <div className="file-preview-name">File đã upload!</div>
                        <div className="file-preview-size word-break">{version.fileUrl}</div>
                    </div>
                    <button className="btn-icon danger" onClick={clearFile}>🗑️</button>
                </div>
            )}

            {uploading && <div className="progress-bar mb-16"><div className="progress-bar-fill" /></div>}

            <div className="form-group">
                <span className="form-hint mb-8" style={{ display: "block" }}>Hoặc dán URL trực tiếp:</span>
                <input className="form-input" placeholder="URL tự động điền sau upload" value={version.fileUrl}
                    onChange={(e) => setVersion({ ...version, fileUrl: e.target.value, saved: false })} required />
            </div>

            <div className="form-group">
                <label className="form-label">Release Notes</label>
                <textarea className="form-textarea" rows={4} value={version.releaseNotes}
                    onChange={(e) => setVersion({ ...version, releaseNotes: e.target.value })} placeholder="What's new in this version?" />
            </div>
        </div>
    );
};

export default VersionStep;
