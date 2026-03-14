import React, { useState, useEffect } from "react";
import { getImageUrlByIndex } from "../../services/formatters";

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23282830'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

const ProductImageGallery = ({ images = [], productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => { setSelectedIndex(0); }, [images]);

  const mainSrc = images.length > 0
    ? getImageUrlByIndex(images, selectedIndex)
    : PLACEHOLDER;

  const handleImgError = (e) => {
    e.target.onerror = null;
    e.target.src = PLACEHOLDER;
  };

  return (
    <div className="image-gallery">
      <div className="image-gallery__main">
        <div className="image-gallery__main-wrapper">
          <img
            className="image-gallery__main-img"
            src={mainSrc}
            alt={productName}
            onError={handleImgError}
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="image-gallery__thumbs">
          {images.map((img, i) => (
            <div
              key={i}
              className={`image-gallery__thumb ${selectedIndex === i ? "image-gallery__thumb--active" : ""}`}
              onClick={() => setSelectedIndex(i)}
            >
              <img
                src={getImageUrlByIndex(images, i)}
                alt={`${productName} ${i + 1}`}
                onError={handleImgError}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
