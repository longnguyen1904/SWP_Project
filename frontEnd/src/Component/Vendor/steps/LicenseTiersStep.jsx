import React from "react";
import {
    Box, Typography, Grid, TextField, Button, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";

const LicenseTiersStep = ({ licenseTiers, setLicenseTiers, tierForm, setTierForm }) => {
    const addTier = () => {
        if (tierForm.tierName && tierForm.price) {
            setLicenseTiers((prev) => [...prev, { ...tierForm, id: Date.now() }]);
            setTierForm({ tierName: "", tierCode: "STD", price: "", maxDevices: 1, durationDays: 365, content: "" });
        }
    };

    const removeTier = (id) => setLicenseTiers((prev) => prev.filter((t) => t.id !== id));

    const handleChange = (field) => (e) => setTierForm((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <Box>
            <Typography variant="h6" gutterBottom>License Tiers</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Tier Name" value={tierForm.tierName} onChange={handleChange("tierName")} />
                </Grid>
                <Grid item xs={12} md={2}>
                    <TextField fullWidth label="Tier Code" value={tierForm.tierCode} onChange={handleChange("tierCode")} />
                </Grid>
                <Grid item xs={12} md={2}>
                    <TextField fullWidth label="Price ($)" type="number" value={tierForm.price} onChange={handleChange("price")} />
                </Grid>
                <Grid item xs={12} md={2}>
                    <TextField fullWidth label="Max Devices" type="number" value={tierForm.maxDevices} onChange={handleChange("maxDevices")} />
                </Grid>
                <Grid item xs={12} md={2}>
                    <TextField fullWidth label="Duration (days)" type="number" value={tierForm.durationDays} onChange={handleChange("durationDays")} />
                </Grid>
                <Grid item xs={12} md={1}>
                    <Button fullWidth variant="outlined" onClick={addTier} sx={{ height: "56px" }}>+ Add</Button>
                </Grid>
            </Grid>

            <TextField fullWidth label="License Content" multiline rows={2} value={tierForm.content} onChange={handleChange("content")} sx={{ mb: 3 }} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Tier Name</TableCell><TableCell>Code</TableCell><TableCell>Price</TableCell>
                            <TableCell>Devices</TableCell><TableCell>Duration</TableCell><TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {licenseTiers.map((tier) => (
                            <TableRow key={tier.id}>
                                <TableCell>{tier.tierName}</TableCell>
                                <TableCell>{tier.tierCode}</TableCell>
                                <TableCell>${tier.price}</TableCell>
                                <TableCell>{tier.maxDevices}</TableCell>
                                <TableCell>{tier.durationDays} days</TableCell>
                                <TableCell><Button size="small" color="error" onClick={() => removeTier(tier.id)}>Delete</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default LicenseTiersStep;
