import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
// Using text buttons instead of icons to avoid @mui/icons-material dependency
import { vendorAPI } from "../../services/api";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({
    productName: "",
    description: "",
    basePrice: "",
    status: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await vendorAPI.getVendorProducts();
      // Ensure products is always an array
      const data = response.data;
      setProducts(Array.isArray(data) ? data : (data?.products || []));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch products");
      setProducts([]); // Ensure products is array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      productName: product.name || product.productName,
      description: product.description,
      basePrice: product.price || product.basePrice,
      status: product.status,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      await vendorAPI.updateProduct(selectedProduct.id, {
        productName: editFormData.productName,
        description: editFormData.description,
        basePrice: parseFloat(editFormData.basePrice),
      });

      setSuccess("Product updated successfully!");
      setEditDialogOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      await vendorAPI.deleteProduct(selectedProduct.id);
      setSuccess("Product deleted successfully!");
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "error";
      case "DRAFT":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending Review";
      case "REJECTED":
        return "Rejected";
      case "DRAFT":
        return "Draft";
      default:
        return status;
    }
  };

  const renderEditDialog = () => (
    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Name"
              value={editFormData.productName}
              onChange={(e) => setEditFormData({ ...editFormData, productName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price ($)"
              type="number"
              value={editFormData.basePrice}
              onChange={(e) => setEditFormData({ ...editFormData, basePrice: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PENDING">Pending Review</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleEditSubmit} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Delete Product</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "{selectedProduct?.name || selectedProduct?.productName}"? 
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography variant="h4">Product Management</Typography>
            <Box>
              <Button
                variant="outlined"
                onClick={fetchProducts}
                sx={{ mr: 2 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                href="/vendor/products/upload"
              >
                Add Product
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {(!products || products.length === 0) ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start by uploading your first product to the marketplace
              </Typography>
              <Button
                variant="contained"
                href="/vendor/products/upload"
              >
                Upload Your First Product
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {Array.isArray(products) && products.map((product) => (
                <Grid item xs={12} md={6} lg={4} key={product.id}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {product.name || product.productName}
                        </Typography>
                        <Chip
                          label={getStatusLabel(product.status)}
                          color={getStatusColor(product.status)}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {product.description?.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </Typography>

                      <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                        ${product.price || product.basePrice}
                      </Typography>

                      {product.tags && product.tags.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          {product.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {product.tags.length > 3 && (
                            <Chip
                              label={`+${product.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(product.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Button
                          size="small"
                          onClick={() => window.open(`/products/${product.id}`, "_blank")}
                          title="View Product"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleEditClick(product)}
                          title="Edit Product"
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          onClick={() => handleDeleteClick(product)}
                          title="Delete Product"
                          color="error"
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {renderEditDialog()}
      {renderDeleteDialog()}
    </Box>
  );
};

export default ProductManagement;
