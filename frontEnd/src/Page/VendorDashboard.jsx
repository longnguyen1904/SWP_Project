import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
// Using text buttons instead of icons to avoid @mui/icons-material dependency
import { vendorAPI } from "../services/api";

const VendorDashboard = () => {
  const [vendorData, setVendorData] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    totalRevenue: 0,
    totalDownloads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const unwrapResponse = (raw) => (raw && raw.data !== undefined ? raw.data : raw);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch vendor products
      const productsResponse = await vendorAPI.getVendorProducts();
      const payload = unwrapResponse(productsResponse.data);
      const productsData = Array.isArray(payload?.content)
        ? payload.content
        : Array.isArray(payload)
          ? payload
          : [];
      setProducts(productsData);

      // Calculate stats
      const calculatedStats = {
        totalProducts: productsData.length,
        approvedProducts: productsData.filter(p => p.status === "APPROVED").length,
        pendingProducts: productsData.filter(p => p.status === "PENDING").length,
        totalRevenue: productsData
          .filter(p => p.status === "APPROVED")
          .reduce((sum, p) => sum + (p.price || p.basePrice || 0), 0),
        totalDownloads: productsData
          .filter(p => p.status === "APPROVED")
          .reduce((sum, p) => sum + (p.downloadCount || 0), 0),
      };
      setStats(calculatedStats);

      // TODO: Fetch vendor-specific data when API is available
      // const vendorResponse = await vendorAPI.getVendorProfile();
      // setVendorData(vendorResponse.data);

    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch dashboard data");
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

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${color}.light`, mr: 2 }}>
            <Typography variant="h6" color={`${color}.main`}>
              {icon}
            </Typography>
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" color={`${color}.main`}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vendor Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your products and track your marketplace performance
      </Typography>

      {error && (
        <Card sx={{ mb: 3, bgcolor: "error.light" }}>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon="📦"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approvedProducts}
            icon="✅"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Review"
            value={stats.pendingProducts}
            icon="⏳"
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Downloads"
            value={stats.totalDownloads}
            icon="👁️"
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Products */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography variant="h6">Recent Products</Typography>
                <Button variant="outlined" size="small" href="/vendor/products">
                  View All
                </Button>
              </Box>
              
              {products.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No products yet. Start by uploading your first product.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    href="/vendor/products/upload"
                  >
                    Upload Product
                  </Button>
                </Box>
              ) : (
                <List>
                  {products.slice(0, 5).map((product, index) => (
                    <React.Fragment key={product.id || product.productId || product.productID || index}>
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" color="primary">
                              ${product.price || product.basePrice || 0}
                            </Typography>
                            <Chip
                              label={getStatusLabel(product.status)}
                              color={getStatusColor(product.status)}
                              size="small"
                            />
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={product.name || product.productName}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {product.description?.length > 80
                                  ? `${product.description.substring(0, 80)}...`
                                  : product.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Created: {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < Math.min(products.length - 1, 4) && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  href="/vendor/products/upload"
                  fullWidth
                >
                  Upload New Product
                </Button>
                <Button
                  variant="outlined"
                  href="/vendor/products"
                  fullWidth
                >
                  Manage Products
                </Button>
                <Button
                  variant="outlined"
                  href="/vendor/revenue"
                  fullWidth
                >
                  View Revenue
                </Button>
                <Button
                  variant="outlined"
                  href="/vendor/reviews"
                  fullWidth
                >
                  Customer Reviews
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Vendor Status */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Vendor Status
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Chip
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Your vendor account is verified and active
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Member since: {new Date().toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendorDashboard;
