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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { adminAPI } from "../services/api";

const AdminDashboard = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [verifyFormData, setVerifyFormData] = useState({
    status: "APPROVED",
    note: "",
  });

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminAPI.getVendors(statusFilter === "ALL" ? null : statusFilter);
      setVendors(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = (vendor) => {
    setSelectedVendor(vendor);
    setVerifyFormData({
      status: vendor.status === "PENDING" ? "APPROVED" : vendor.status,
      note: vendor.rejectionNote || "",
    });
    setVerifyDialogOpen(true);
  };

  const handleVerifySubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminAPI.verifyVendor(selectedVendor.id, verifyFormData);
      
      setSuccess("Vendor verification updated successfully!");
      setVerifyDialogOpen(false);
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify vendor");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "error";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard - Vendor Management
      </Typography>

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

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filter Vendors
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Vendors</MenuItem>
              <MenuItem value="PENDING">Pending Verification</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Vendors ({vendors.length})
          </Typography>
          
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Tax Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>{vendor.id}</TableCell>
                      <TableCell>{vendor.companyName}</TableCell>
                      <TableCell>{vendor.type}</TableCell>
                      <TableCell>{vendor.taxCode || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.status}
                          color={getStatusColor(vendor.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleVerifyClick(vendor)}
                        >
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify Vendor - {selectedVendor?.companyName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Verification Status</InputLabel>
              <Select
                value={verifyFormData.status}
                label="Verification Status"
                onChange={(e) =>
                  setVerifyFormData({
                    ...verifyFormData,
                    status: e.target.value,
                  })
                }
              >
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Note"
              multiline
              rows={4}
              value={verifyFormData.note}
              onChange={(e) =>
                setVerifyFormData({
                  ...verifyFormData,
                  note: e.target.value,
                })
              }
              placeholder={
                verifyFormData.status === "REJECTED"
                  ? "Reason for rejection..."
                  : "Verification notes..."
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleVerifySubmit} variant="contained">
            Submit Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
