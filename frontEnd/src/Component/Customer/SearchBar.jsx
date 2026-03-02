import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  Popper,
  ClickAwayListener,
  CircularProgress,
  Typography,
} from "@mui/material";
import { searchAPI } from "../../services/customerAPI";

const SearchBar = ({ onSearch, placeholder = "Search software..." }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await searchAPI.getSuggestions(searchQuery);
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Simple debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  useEffect(() => {
    if (query) {
      debouncedSearch(query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, debouncedSearch]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    setAnchorEl(event.currentTarget);
  };

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name || suggestion);
    handleSearch(suggestion.name || suggestion);
    setShowSuggestions(false);
  };

  const handleClickAway = () => {
    setShowSuggestions(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: "relative", width: "100%" }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography sx={{ fontSize: "20px" }}>🔍</Typography>
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "background.paper",
            },
          }}
        />

        <Popper
          open={showSuggestions}
          anchorEl={anchorEl}
          placement="bottom-start"
          style={{ width: anchorEl?.clientWidth, zIndex: 1300 }}
        >
          <Paper elevation={3} sx={{ mt: 1, maxHeight: 300, overflow: "auto" }}>
            {suggestions.length > 0 ? (
              <List dense>
                {suggestions.map((suggestion, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ListItemText
                      primary={suggestion.name || suggestion}
                      secondary={
                        suggestion.category ? `Category: ${suggestion.category}` : null
                      }
                      primaryTypographyProps={{
                        fontWeight: suggestion.highlight ? "bold" : "normal",
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : query.length >= 2 && !loading ? (
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No suggestions found
                </Typography>
              </Box>
            ) : null}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;
