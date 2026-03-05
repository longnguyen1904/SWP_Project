import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
} from "@mui/material";

const SearchBar = ({ onSearch, placeholder = "Search software..." }) => {
  const [query, setQuery] = useState("");

  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ fontSize: "20px", color: "#8b949e" }}>🔍</Typography>
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            backgroundColor: "rgba(22, 27, 34, 0.9)",
            border: "1px solid rgba(99, 102, 106, 0.4)",
            color: "#e6edf3",
            "& fieldset": { border: "none" },
            "&:hover": {
              borderColor: "rgba(248, 97, 21, 0.5)",
              backgroundColor: "rgba(28, 33, 40, 0.95)",
            },
            "&.Mui-focused": {
              borderColor: "rgb(248, 97, 21)",
              boxShadow: "0 0 0 2px rgba(248, 97, 21, 0.25)",
            },
          },
          "& .MuiInputBase-input::placeholder": {
            color: "#8b949e",
            opacity: 1,
          },
        }}
      />
    </Box>
  );
};

export default SearchBar;
