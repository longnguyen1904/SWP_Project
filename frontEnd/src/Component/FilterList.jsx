import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProductImageUrl } from "../services/formatters";
import "../Style/FilterList.css";



export default function FilterList() {
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchName, setSearchName] = useState("");
  const navigate = useNavigate();

  function handleSelect(filter) {
    setSelectedFilter(filter);
    setOpen(false);
  }

  const [products, setProducts] = useState([]);
  const FILTERS = ["All", ...new Set(products.map(p => p.categoryName).filter(Boolean))];
  useEffect(() => {
    fetch("${import.meta.env.VITE_API_URL}/api/products")
      .then(res => res.json())
      .then(data => setProducts(data.data.content));
  }, []);

  return (

    <section className="filter-container">
      <div>
        <h2>Product List</h2>
      </div>

      <div className="searching">
        <div className="dropdown">
          <div className="dropdown-header" onClick={() => setOpen(!open)}>
            {selectedFilter}
            <span className={`arrow ${open ? "up" : "down"}`}>▾</span>
          </div>

          {open && (
            <ul className="dropdown-list">
              {FILTERS.map(filter => (
                <li
                  key={filter}
                  className={filter === selectedFilter ? "active" : ""}
                  onClick={() => handleSelect(filter)}
                >
                  {filter}
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search by name..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
      </div>

      <ul className="item-list">
        {products
          .filter(product => {
            if (selectedFilter === "All") return true;
            return product.categoryName === selectedFilter;
          })
          .filter(product =>
            product.productName
              .toLowerCase()
              .includes(searchName.toLowerCase())
          )
          .map(product => (
            <li key={product.productId}>
              <img 
                src={getProductImageUrl(product) || "https://fakeimg.pl/400x400?text=No+Image"} 
                alt={product.productName} 
                style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "12px", marginBottom: "15px" }} 
              />
              <h3>{product.productName}</h3>
              <p>Price: {Number(product.basePrice).toLocaleString("vi-VN")} VND</p>
              <button onClick={() => navigate(`/products/${product.productId}`)}>
                Buy
              </button>
            </li>
          ))}
      </ul>
    </section>);
}