import React from "react";
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const BasicInfoStep = ({ productData, setProductData, categories }) => {
    const handleChange = (field) => (e) =>
        setProductData((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField fullWidth label="Product Name" value={productData.productName} onChange={handleChange("productName")} required />
            </Grid>
            <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select value={productData.categoryId} label="Category" onChange={handleChange("categoryId")}>
                        {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline rows={4} value={productData.description} onChange={handleChange("description")} required />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField fullWidth label="Base Price ($)" type="number" value={productData.basePrice} onChange={handleChange("basePrice")} required />
            </Grid>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                    <InputLabel>Has Trial</InputLabel>
                    <Select value={productData.hasTrial} label="Has Trial" onChange={(e) => setProductData((prev) => ({ ...prev, hasTrial: e.target.value === true }))}>
                        <MenuItem value={false}>No</MenuItem>
                        <MenuItem value={true}>Yes</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField fullWidth label="Trial Duration (days)" type="number" value={productData.trialDurationDays} onChange={handleChange("trialDurationDays")} disabled={!productData.hasTrial} />
            </Grid>
            <Grid item xs={12}>
                <TextField fullWidth label="Guide Document URL" value={productData.guideDocumentUrl} onChange={handleChange("guideDocumentUrl")} placeholder="https://example.com/guide.pdf" helperText="Link tài liệu hướng dẫn sử dụng sản phẩm — Tùy chọn" />
            </Grid>
        </Grid>
    );
};

export default BasicInfoStep;
