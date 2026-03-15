export const formatPrice = (price) => {
  if (price == null || price === 0) return "Miễn phí";
  return `${Number(price).toLocaleString("vi-VN")} ₫`;
};

export const getProductImageUrl = (product) => {
  if (product?.images?.length > 0) {
    const first = product.images[0];
    return typeof first === "string" ? first : first?.imageUrl;
  }
  return "/placeholder-product.png";
};

export const getImageUrlByIndex = (images, index) => {
  if (images?.length > index) {
    const item = images[index];
    return typeof item === "string" ? item : item?.imageUrl;
  }
  return "/placeholder-product.jpg";
};
