import React from "react";
import { Box, Typography, Grid, Alert } from "@mui/material";

const ReviewStep = ({ productData, images, version, licenseTiers }) => (
    <Box>
        <Typography variant="h6" gutterBottom>Review & Submit</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
            Please review your product information before submitting for approval.
        </Alert>
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Product Name:</Typography>
                <Typography>{productData.productName}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Base Price:</Typography>
                <Typography>${productData.basePrice}</Typography>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle2">Description:</Typography>
                <Typography>{productData.description}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Guide Document:</Typography>
                <Typography>{productData.guideDocumentUrl || "Không có"}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Images: {images.length}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">Version: {version.versionNumber}</Typography>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="subtitle2">License Tiers: {licenseTiers.length}</Typography>
            </Grid>
        </Grid>
    </Box>
);

export default ReviewStep;
