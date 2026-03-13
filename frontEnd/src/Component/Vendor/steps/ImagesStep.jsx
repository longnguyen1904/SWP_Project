import React, { useRef, useState } from "react";
import {
    Box, Typography, Grid, TextField, FormControl, InputLabel, Select, MenuItem,
    Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, IconButton, LinearProgress, CircularProgress,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ImageIcon from "@mui/icons-material/Image";
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
        } catch (err) {
            setError(err.response?.data?.message || "Upload ảnh thất bại.");
        } finally { setUploading(false); }
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

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect({ target: { files: [f] } }); };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>🖼️ Upload Ảnh Sản Phẩm</Typography>
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />

            {!selectedFile && !imageUpload.imageUrl && (
                <Box sx={{ ...dropZoneStyle, mb: 2 }} onClick={() => imageInputRef.current?.click()} onDragOver={handleDragOver} onDrop={handleDrop}>
                    <ImageIcon sx={{ fontSize: 48, color: "grey.500", mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">Kéo thả ảnh vào đây hoặc <strong>click để chọn</strong></Typography>
                    <Typography variant="caption" color="text.secondary">jpg, png, gif, webp — Tối đa 10MB</Typography>
                </Box>
            )}

            {selectedFile && !imageUpload.imageUrl && (
                <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    {preview && <Box component="img" src={preview} alt="Preview" sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }} />}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">{selectedFile.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatFileSize(selectedFile.size)}</Typography>
                    </Box>
                    <Button variant="contained" color="secondary" startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />} onClick={handleUploadToCloud} disabled={uploading}>
                        {uploading ? "Đang upload..." : "Upload lên Cloudinary"}
                    </Button>
                    <IconButton onClick={clearFile} disabled={uploading}><DeleteIcon /></IconButton>
                </Paper>
            )}

            {imageUpload.imageUrl && (
                <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" color="success.main" fontWeight="bold">✅ Ảnh đã upload!</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{imageUpload.imageUrl}</Typography>
                    </Box>
                    <IconButton onClick={() => { setImageUpload((prev) => ({ ...prev, imageUrl: "" })); clearFile(); }} color="error"><DeleteIcon /></IconButton>
                </Paper>
            )}

            {uploading && <LinearProgress color="secondary" sx={{ mb: 2 }} />}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 1 }}>Hoặc dán URL ảnh trực tiếp:</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Image URL" value={imageUpload.imageUrl} onChange={(e) => setImageUpload({ ...imageUpload, imageUrl: e.target.value })} placeholder="URL được tự động điền sau khi upload" />
                </Grid>
                <Grid item xs={12} md={2}>
                    <FormControl fullWidth>
                        <InputLabel>Primary</InputLabel>
                        <Select value={imageUpload.isPrimary} label="Primary" onChange={(e) => setImageUpload({ ...imageUpload, isPrimary: e.target.value })}>
                            <MenuItem value={false}>No</MenuItem>
                            <MenuItem value={true}>Yes</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Sort Order" type="number" value={imageUpload.sortOrder} onChange={(e) => setImageUpload({ ...imageUpload, sortOrder: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={2}>
                    <Button fullWidth variant="outlined" onClick={addImage} sx={{ height: "56px" }} disabled={!imageUpload.imageUrl}>+ Add</Button>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Preview</TableCell><TableCell>Image URL</TableCell><TableCell>Primary</TableCell><TableCell>Sort Order</TableCell><TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {images.map((image) => (
                            <TableRow key={image.id}>
                                <TableCell><Box component="img" src={image.imageUrl} alt="thumb" sx={{ width: 50, height: 50, objectFit: "cover", borderRadius: 1 }} /></TableCell>
                                <TableCell sx={{ maxWidth: 200, wordBreak: "break-all" }}>{image.imageUrl}</TableCell>
                                <TableCell><Chip label={image.isPrimary ? "Yes" : "No"} size="small" /></TableCell>
                                <TableCell>{image.sortOrder}</TableCell>
                                <TableCell><Button size="small" color="error" onClick={() => setImages((prev) => prev.filter((img) => img.id !== image.id))}>Delete</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ImagesStep;
