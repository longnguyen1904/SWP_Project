import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { customerAPI } from "../../services/api";

const FilterPanel = ({ filters, onFiltersChange, onClearFilters }) => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoadingOptions(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          customerAPI.getCategories(),
          customerAPI.getTags(),
        ]);
        const unwrap = (res) => {
          const d = res?.data;
          if (Array.isArray(d)) return d;
          if (d && Array.isArray(d.data)) return d.data;
          if (d && Array.isArray(d.content)) return d.content;
          return [];
        };
        setCategories(unwrap(catRes));
        setTags(unwrap(tagRes));
      } catch (e) {
        console.error("Failed to load filter options", e);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  const handlePriceRangeChange = (event, newValue) => {
    onFiltersChange({
      ...filters,
      priceRange: { min: newValue[0], max: newValue[1] },
    });
  };

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    const ids = typeof value === "string" ? [] : [...(value || [])];
    onFiltersChange({
      ...filters,
      categoryIds: ids.map((v) => Number(v)),
    });
  };

  const handleTagChange = (event) => {
    const value = event.target.value;
    const list = typeof value === "string" ? [] : [...(value || [])];
    onFiltersChange({
      ...filters,
      tags: list,
    });
  };

  const handleClearAll = () => {
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    const priceMax = 1000000;
    if (filters.priceRange?.min > 0 || (filters.priceRange?.max != null && filters.priceRange.max < priceMax)) count++;
    if (Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0) count++;
    if (Array.isArray(filters.tags) && filters.tags.length > 0) count++;
    return count;
  };

  const panelSx = {
    position: "sticky",
    top: 24,
    bgcolor: "rgba(22, 27, 34, 0.95)",
    border: "1px solid rgba(99, 102, 106, 0.4)",
    borderRadius: 2,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    overflow: "hidden",
    "& .MuiAccordion-root": {
      bgcolor: "transparent",
      "&:before": { display: "none" },
      borderBottom: "1px solid rgba(99, 102, 106, 0.25)",
    },
    "& .MuiAccordionSummary-root": { color: "#e6edf3" },
    "& .MuiAccordionDetails-root": { pt: 0 },
    "& .MuiFormControl-root .MuiOutlinedInput-root": {
      bgcolor: "rgba(13, 17, 23, 0.8)",
      border: "1px solid rgba(99, 102, 106, 0.4)",
      color: "#e6edf3",
      "& fieldset": { border: "none" },
      "&:hover": { borderColor: "rgba(248, 97, 21, 0.5)" },
      "&.Mui-focused": { borderColor: "rgb(248, 97, 21)" },
    },
    "& .MuiInputLabel-root": { color: "#8b949e" },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgb(248, 97, 21)" },
    "& .MuiSlider-thumb": { color: "rgb(248, 97, 21)" },
    "& .MuiSlider-rail": { opacity: 0.4 },
    "& .MuiSlider-track": { color: "rgb(248, 97, 21)" },
    "& .MuiSlider-markLabel": { color: "#c9d1d9" },
  };

  return (
    <Card sx={panelSx}>
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ color: "#e6edf3", fontWeight: 600 }}>
            Filters
          </Typography>
          {getActiveFiltersCount() > 0 && (
            <Chip
              label={`${getActiveFiltersCount()} active`}
              size="small"
              sx={{
                bgcolor: "rgba(248, 97, 21, 0.2)",
                color: "rgb(248, 97, 21)",
                border: "1px solid rgba(248, 97, 21, 0.5)",
              }}
            />
          )}
        </Box>

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<Typography sx={{ color: "#8b949e", fontSize: "0.75rem" }}>▼</Typography>}>
            <Typography variant="subtitle1" sx={{ color: "#e6edf3", fontWeight: 500 }}>
              Category
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                multiple
                value={Array.isArray(filters.categoryIds) ? filters.categoryIds : []}
                onChange={handleCategoryChange}
                label="Category"
                disabled={loadingOptions}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#161b22",
                      border: "1px solid rgba(99, 102, 106, 0.4)",
                      "& .MuiMenuItem-root": { color: "#e6edf3" },
                      "& .MuiMenuItem-root.Mui-selected": { bgcolor: "rgba(248, 97, 21, 0.2)" },
                    },
                  },
                }}
                renderValue={(selected) =>
                  selected.length === 0
                    ? " "
                    : selected
                        .map((id) => categories.find((c) => (c.categoryID ?? c.id) === id))
                        .filter(Boolean)
                        .map((c) => c.categoryName ?? c.name)
                        .join(", ")
                }
              >
                {loadingOptions && <MenuItem disabled>Loading...</MenuItem>}
                {!loadingOptions && categories.length === 0 && (
                  <MenuItem disabled>No categories in database</MenuItem>
                )}
                {categories.map((c) => (
                  <MenuItem key={c.categoryID ?? c.id} value={c.categoryID ?? c.id}>
                    {c.categoryName ?? c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<Typography sx={{ color: "#8b949e", fontSize: "0.75rem" }}>▼</Typography>}>
            <Typography variant="subtitle1" sx={{ color: "#e6edf3", fontWeight: 500 }}>
              Tags
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={Array.isArray(filters.tags) ? filters.tags : []}
                onChange={handleTagChange}
                label="Tags"
                disabled={loadingOptions}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#161b22",
                      border: "1px solid rgba(99, 102, 106, 0.4)",
                      "& .MuiMenuItem-root": { color: "#e6edf3" },
                      "& .MuiMenuItem-root.Mui-selected": { bgcolor: "rgba(248, 97, 21, 0.2)" },
                    },
                  },
                }}
                renderValue={(selected) =>
                  selected.length === 0 ? " " : selected.join(", ")
                }
              >
                {loadingOptions && <MenuItem disabled>Loading...</MenuItem>}
                {!loadingOptions && tags.length === 0 && (
                  <MenuItem disabled>No tags in database</MenuItem>
                )}
                {tags.map((t) => (
                  <MenuItem key={t.tagID ?? t.id} value={t.tagName ?? t.name}>
                    {t.tagName ?? t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<Typography sx={{ color: "#8b949e", fontSize: "0.75rem" }}>▼</Typography>}>
            <Typography variant="subtitle1" sx={{ color: "#e6edf3", fontWeight: 500 }}>
              Price Range
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Typography variant="body2" gutterBottom sx={{ color: "#8b949e" }}>
                {(filters.priceRange?.min ?? 0).toLocaleString("vi-VN")} - {(filters.priceRange?.max ?? 1000000).toLocaleString("vi-VN")} ₫
              </Typography>
              <Slider
                value={[filters.priceRange?.min ?? 0, filters.priceRange?.max ?? 1000000]}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v.toLocaleString("vi-VN")} ₫`}
                min={0}
                max={1000000}
                step={25000}
                marks={[
                  { value: 0, label: "0 ₫" },
                  { value: 250000, label: "250k ₫" },
                  { value: 500000, label: "500k ₫" },
                  { value: 1000000, label: "1 tr+ ₫" },
                ]}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(99, 102, 106, 0.3)" }}>
          <Button
            variant="outlined"
            onClick={handleClearAll}
            fullWidth
            disabled={getActiveFiltersCount() === 0}
            sx={{
              color: "#8b949e",
              borderColor: "rgba(99, 102, 106, 0.5)",
              "&:hover": {
                borderColor: "rgb(248, 97, 21)",
                color: "rgb(248, 97, 21)",
                bgcolor: "rgba(248, 97, 21, 0.08)",
              },
              "&.Mui-disabled": { borderColor: "rgba(99, 102, 106, 0.3)", color: "#6e7681" },
            }}
          >
            Clear All Filters
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
