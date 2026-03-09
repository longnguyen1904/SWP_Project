import React from "react";

const StarRating = ({ value = 0, onChange, readOnly = false }) => {
  const rounded = Math.round(value);

  return (
    <span className={`star-rating ${readOnly ? "" : "star-rating--interactive"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-rating__star ${star <= rounded ? "star-rating__star--filled" : ""}`}
          onClick={!readOnly && onChange ? () => onChange(star) : undefined}
        >
          {star <= rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
};

export default StarRating;
