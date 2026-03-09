import React, { useState, useEffect } from "react";
import { getImageUrlByIndex } from "../../services/formatters";

const ProductImageGallery = ({ images = [], productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [errorIndex, setErrorIndex] = useState(null);

  useEffect(() => { setErrorIndex(null); }, [selectedIndex, images]);

  const mainSrc =
    errorIndex === selectedIndex
      ? "/placeholder-product.jpg"
      : getImageUrlByIndex(images, selectedIndex);

  return (
    <div className="image-gallery">
      <div className="image-gallery__main">
        <div className="image-gallery__main-wrapper">
          <img
            className="image-gallery__main-img"
            src={mainSrc}
            alt={productName}
            onError={() => setErrorIndex(selectedIndex)}
          />
        </div>
      </div>

      <div className="image-gallery__thumbs">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`image-gallery__thumb ${selectedIndex === i ? "image-gallery__thumb--active" : ""}`}
            onClick={() => setSelectedIndex(i)}
          >
            <img
              src={getImageUrlByIndex(images, i)}
              alt={`${productName} ${i + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;
