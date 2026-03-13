import React, { useState, useEffect } from "react";
import { customerAPI } from "../../services/api";
import { unwrapList } from "../../services/apiHelpers";
import { PRICE_MAX } from "../../services/theme";

const FilterPanel = ({ filters, onApplyFilters, onClearFilters }) => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  const [pendingFilters, setPendingFilters] = useState(filters);

  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [catRes, tagRes] = await Promise.all([
          customerAPI.getCategories(),
          customerAPI.getTags(),
        ]);
        setCategories(unwrapList(catRes));
        setTags(unwrapList(tagRes));
      } catch (err) {
        console.error("Failed to load filter options", err);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadFilterOptions();
  }, []);

  const toggleCategory = (categoryId) => {
    const current = Array.isArray(pendingFilters.categoryIds)
      ? pendingFilters.categoryIds
      : [];
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    setPendingFilters({ ...pendingFilters, categoryIds: updated });
  };

  const toggleTag = (tagName) => {
    const current = Array.isArray(pendingFilters.tags)
      ? pendingFilters.tags
      : [];
    const updated = current.includes(tagName)
      ? current.filter((t) => t !== tagName)
      : [...current, tagName];
    setPendingFilters({ ...pendingFilters, tags: updated });
  };

  const handleMinPriceChange = (e) => {
    const raw = e.target.value;
    const min = raw === "" ? "" : Number(raw);
    setPendingFilters({
      ...pendingFilters,
      priceRange: { ...pendingFilters.priceRange, min },
    });
  };

  const handleMaxPriceChange = (e) => {
    const raw = e.target.value;
    const max = raw === "" ? "" : Number(raw);
    setPendingFilters({
      ...pendingFilters,
      priceRange: { ...pendingFilters.priceRange, max },
    });
  };

  const handleApply = () => {
    const finalFilters = {
      ...pendingFilters,
      priceRange: {
        min:
          pendingFilters.priceRange?.min === ""
            ? 0
            : Number(pendingFilters.priceRange?.min) || 0,
        max:
          pendingFilters.priceRange?.max === ""
            ? PRICE_MAX
            : Number(pendingFilters.priceRange?.max) || PRICE_MAX,
      },
    };
    setPendingFilters(finalFilters);
    onApplyFilters(finalFilters);
  };

  const pendingCount = (() => {
    let c = 0;
    if (
      pendingFilters.priceRange?.min > 0 ||
      (pendingFilters.priceRange?.max != null &&
        pendingFilters.priceRange.max < PRICE_MAX)
    )
      c++;
    if (pendingFilters.categoryIds?.length > 0) c++;
    if (pendingFilters.tags?.length > 0) c++;
    return c;
  })();

  const hasChanges = JSON.stringify(pendingFilters) !== JSON.stringify(filters);

  return (
    <div className="filter-panel">
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">Filters</h3>
        {pendingCount > 0 && (
          <span className="filter-panel__badge">{pendingCount} selected</span>
        )}
      </div>

      <details open className="filter-section">
        <summary>Category</summary>
        <div className="filter-section__body">
          {isLoadingOptions && <p className="filter-loading">Loading...</p>}
          {!isLoadingOptions && categories.length === 0 && (
            <p className="filter-loading">No categories</p>
          )}
          {categories.map((c) => (
            <label key={c.categoryID} className="filter-checkbox">
              <input
                type="checkbox"
                checked={
                  Array.isArray(pendingFilters.categoryIds) &&
                  pendingFilters.categoryIds.includes(c.categoryID)
                }
                onChange={() => toggleCategory(c.categoryID)}
              />
              {c.categoryName}
            </label>
          ))}
        </div>
      </details>

      <details open className="filter-section">
        <summary>Tags</summary>
        <div className="filter-section__body">
          {isLoadingOptions && <p className="filter-loading">Loading...</p>}
          {!isLoadingOptions && tags.length === 0 && (
            <p className="filter-loading">No tags</p>
          )}
          {tags.map((t) => (
            <label key={t.tagID} className="filter-checkbox">
              <input
                type="checkbox"
                checked={
                  Array.isArray(pendingFilters.tags) &&
                  pendingFilters.tags.includes(t.tagName)
                }
                onChange={() => toggleTag(t.tagName)}
              />
              {t.tagName}
            </label>
          ))}
        </div>
      </details>

      <details open className="filter-section">
        <summary>Price Range</summary>
        <div className="filter-section__body">
          <div className="filter-price">
            <input
              className="filter-price__input"
              type="number"
              min={0}
              max={PRICE_MAX}
              value={pendingFilters.priceRange?.min ?? 0}
              onChange={handleMinPriceChange}
              placeholder="Min ₫"
            />
            <span className="filter-price__sep">—</span>
            <input
              className="filter-price__input"
              type="number"
              min={0}
              max={PRICE_MAX}
              value={pendingFilters.priceRange?.max ?? PRICE_MAX}
              onChange={handleMaxPriceChange}
              placeholder="Max ₫"
            />
          </div>
        </div>
      </details>

      <button
        className={`filter-panel__apply-btn ${hasChanges ? "filter-panel__apply-btn--active" : ""}`}
        onClick={handleApply}
      >
        Filter
      </button>

      <button
        className="filter-panel__clear-btn"
        onClick={onClearFilters}
        disabled={pendingCount === 0}
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterPanel;
