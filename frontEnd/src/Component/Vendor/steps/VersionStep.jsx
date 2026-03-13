import React, { useRef, useState } from "react";
import { Grid, TextField, Typography, Box, Paper, Button, IconButton, LinearProgress, CircularProgress } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { uploadAPI } from "../../../services/api";

const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const dropZoneStyle = {
    border: "2px dashed", borderColor: "grey.400", borderRadius: 2, p: 3,
    textAlign: "center", cursor: "pointer", transition: "all 0.2s ease",
    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
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

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>📦 Upload File Cài Đặt</Typography>
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth label="Version Number" value={version.versionNumber} onChange={(e) => setVersion({ ...version, versionNumber: e.target.value })} placeholder="e.g., 1.0.0" required />
            </Grid>
            <Grid item xs={12}>
                <input ref={installerInputRef} type="file" accept=".exe,.zip,.msi,.dmg,.pkg,.jar" onChange={handleFileSelect} style={{ display: "none" }} />

                {!selectedFile && !version.fileUrl && (
                    <Box sx={dropZoneStyle} onClick={() => installerInputRef.current?.click()} onDragOver={handleDragOver} onDrop={handleDrop}>
                        <InsertDriveFileIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">Kéo thả file vào đây hoặc <strong>click để chọn</strong></Typography>
                        <Typography variant="caption" color="text.secondary">exe, zip, msi, dmg, pkg, jar — Tối đa 500MB</Typography>
                    </Box>
                )}

                {selectedFile && !version.fileUrl && (
                    <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                        <InsertDriveFileIcon color="primary" sx={{ fontSize: 40 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body1">{selectedFile.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{formatFileSize(selectedFile.size)}</Typography>
                        </Box>
                        <Button variant="contained" startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />} onClick={handleUploadToCloud} disabled={uploading}>
                            {uploading ? "Đang upload..." : "Upload lên Cloudinary"}
                        </Button>
                        <IconButton onClick={clearFile} disabled={uploading}><DeleteIcon /></IconButton>
                    </Paper>
                )}

                {version.fileUrl && (
                    <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" color="success.main" fontWeight="bold">✅ File đã upload!</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{version.fileUrl}</Typography>
                        </Box>
                        <IconButton onClick={clearFile} color="error"><DeleteIcon /></IconButton>
                    </Paper>
                )}

                {uploading && <LinearProgress sx={{ mt: 1 }} />}
            </Grid>
            <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Hoặc dán URL trực tiếp:</Typography>
                <TextField fullWidth label="File URL" value={version.fileUrl} onChange={(e) => setVersion({ ...version, fileUrl: e.target.value, saved: false })} placeholder="URL tự động điền sau upload" required />
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth label="Release Notes" multiline rows={4} value={version.releaseNotes} onChange={(e) => setVersion({ ...version, releaseNotes: e.target.value })} placeholder="What's new in this version?" />
            </Grid>
        </Grid>
    );
};

export default VersionStep;
