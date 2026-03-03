import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@mui/material";
// Using text instead of icons to avoid @mui/icons-material dependency
import { searchAPI } from "../../services/customerAPI";

const FilterPanel = ({ filters, onFiltersChange, onClearFilters }) => {
  const [categories, setCategories] = useState([]);
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    setLoading(true);
    try {
      const [categoriesResponse, languagesResponse] = await Promise.all([
        searchAPI.getCategories(),
        searchAPI.getProgrammingLanguages(),
      ]);

      setCategories(categoriesResponse.data || []);
      setProgrammingLanguages(languagesResponse.data || []);
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event) => {
    const { value } = event.target;
    onFiltersChange({
      ...filters,
      categories: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handleLanguageChange = (event) => {
    const { value } = event.target;
    onFiltersChange({
      ...filters,
      programmingLanguages: typeof value === "string" ? value.split(",") : value,
    });
  };

  const handlePriceRangeChange = (event, newValue) => {
    onFiltersChange({
      ...filters,
      priceRange: { min: newValue[0], max: newValue[1] },
    });
  };

  const handleRatingChange = (rating) => {
    const currentRatings = filters.ratings || [];
    const newRatings = currentRatings.includes(rating)
      ? currentRatings.filter((r) => r !== rating)
      : [...currentRatings, rating];
    
    onFiltersChange({
      ...filters,
      ratings: newRatings,
    });
  };

  const handleClearAll = () => {
    onClearFilters();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.categories?.length) count++;
    if (filters.programmingLanguages?.length) count++;
    if (filters.priceRange?.min > 0 || filters.priceRange?.max < 1000) count++;
    if (filters.ratings?.length) count++;
    return count;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>Loading filters...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ position: "sticky", top: 20 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          {getActiveFiltersCount() > 0 && (
            <Chip 
              label={`${getActiveFiltersCount()} active`} 
              color="primary" 
              size="small" 
            />
          )}
        </Box>

        {/* Categories */}
        <Accordion defaultExpanded>
          <AccordionSummary>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography variant="subtitle1">Categories</Typography>
              <Typography sx={{ ml: "auto" }}>▼</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel>Categories</InputLabel>
              <Select
                multiple
                value={filters.categories || []}
                onChange={handleCategoryChange}
                label="Categories"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id || category} value={category.name || category}>
                    {category.name || category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Programming Languages */}
        <Accordion>
          <AccordionSummary>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography variant="subtitle1">Programming Languages</Typography>
              <Typography sx={{ ml: "auto" }}>▼</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small">
              <InputLabel>Programming Languages</InputLabel>
              <Select
                multiple
                value={filters.programmingLanguages || []}
                onChange={handleLanguageChange}
                label="Programming Languages"
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {programmingLanguages.map((language) => (
                  <MenuItem key={language.id || language} value={language.name || language}>
                    {language.name || language}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Price Range */}
        <Accordion>
          <AccordionSummary>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography variant="subtitle1">Price Range</Typography>
              <Typography sx={{ ml: "auto" }}>▼</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 1 }}>
              <Typography variant="body2" gutterBottom>
                ${filters.priceRange?.min || 0} - ${filters.priceRange?.max || 1000}
              </Typography>
              <Slider
                value={[
                  filters.priceRange?.min || 0,
                  filters.priceRange?.max || 1000,
                ]}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
                marks={[
                  { value: 0, label: "$0" },
                  { value: 50, label: "$50" },
                  { value: 100, label: "$100" },
                  { value: 500, label: "$500" },
                  { value: 1000, label: "$1000+" },
                ]}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Ratings */}
        <Accordion>
          <AccordionSummary>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography variant="subtitle1">Minimum Rating</Typography>
              <Typography sx={{ ml: "auto" }}>▼</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {[4, 3, 2, 1].map((rating) => (
                <FormControlLabel
                  key={rating}
                  control={
                    <Checkbox
                      checked={filters.ratings?.includes(rating) || false}
                      onChange={() => handleRatingChange(rating)}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2">
                        {rating} {"⭐".repeat(rating)} & up
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>

        {/* Clear Filters Button */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          <Button
            variant="outlined"
            onClick={handleClearAll}
            fullWidth
            disabled={getActiveFiltersCount() === 0}
          >
            Clear All Filters
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
