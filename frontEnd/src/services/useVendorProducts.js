import { useState, useEffect, useCallback } from "react";
import { vendorAPI } from "./api";

/**
 * Shared hook to fetch vendor products.
 * Used by VersionControlManager, LicenseTierConfig, and other vendor components
 * to avoid duplicating fetchProducts logic.
 */
export default function useVendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await vendorAPI.getVendorProducts({ size: 100 });
      const data = response.data?.data ?? response.data;
      const content = data?.content ?? data?.products ?? (Array.isArray(data) ? data : []);
      setProducts(Array.isArray(content) ? content : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
