import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { authAPI } from "../services/api";

const UserRegistration = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    roleID: 3, // Default to Customer
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authAPI.register(formData);
      setRegisteredUser(response.data);
      setSuccess("User registered successfully!");
      
      // Store user ID for API calls
      if (response.data.userID) {
        localStorage.setItem("userId", response.data.userID);
      }
      
      setFormData({
        email: "",
        password: "",
        fullName: "",
        roleID: 3,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1:
        return "Admin";
      case 2:
        return "Vendor";
      case 3:
        return "Customer";
      default:
        return "Unknown";
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        User Registration
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create New Account
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

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Role</InputLabel>
              <Select
                name="roleID"
                value={formData.roleID}
                label="Role"
                onChange={handleChange}
              >
                <MenuItem value={1}>Admin</MenuItem>
                <MenuItem value={2}>Vendor</MenuItem>
                <MenuItem value={3}>Customer</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {registeredUser && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Registration Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>User ID:</strong> {registeredUser.userID}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> {registeredUser.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Role:</strong> {getRoleName(registeredUser.roleID)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              <strong>Important:</strong> Save the User ID ({registeredUser.userID}) 
              for API requests as the X-User-Id header.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Quick Registration Templates */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Registration Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Based on the API flow, you can quickly create these test accounts:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary">
              Admin Account
            </Typography>
            <Typography variant="body2">
              Email: admin@tallt.com | Password: admin123 | Role: Admin
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary">
              Customer Account
            </Typography>
            <Typography variant="body2">
              Email: customer1@gmail.com | Password: customer123 | Role: Customer
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary">
              Vendor Account (will be approved)
            </Typography>
            <Typography variant="body2">
              Email: vendor1@gmail.com | Password: vendor123 | Role: Customer (will become Vendor)
            </Typography>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary">
              Vendor Account (will be rejected)
            </Typography>
            <Typography variant="body2">
              Email: vendor2@gmail.com | Password: vendor123 | Role: Customer (will become Vendor)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserRegistration;
