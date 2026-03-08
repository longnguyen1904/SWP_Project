import { useState, useEffect } from "react";
import "../Style/FilterList.css";

const FILTERS = ["All", "Fruit", "Vegetable", "Drink"];

export default function FilterList() {
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchName, setSearchName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  

  function handleSelect(filter) {
    setSelectedFilter(filter);
    setOpen(false);
  }

  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch("http://localhost:8081/api/products")
      .then(res => res.json())
      .then(data => setProducts(data.data.content));
  }, []);



  function openProductDetail(product) {
    setSelectedProduct(product);
  }

  function closeProductDetail() {
    setSelectedProduct(null);
  }
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
              <h3>{product.productName}</h3>
              <p>Price: ${product.basePrice}</p>
              <button onClick={() => openProductDetail(product)}>
                Buy
              </button>
            </li>
          ))}
      </ul>
      {selectedProduct && (
        <div className="product-modal-overlay">

          <div className="product-modal">

            <button className="close-btn" onClick={closeProductDetail}>
              ✕
            </button>

            <h2>Product Detail</h2>

            <div className="product-detail">

              <p><b>Name:</b> {selectedProduct.productName}</p>

              <p><b>Category:</b> {selectedProduct.categoryName}</p>

              <p><b>Price:</b> ${selectedProduct.basePrice}</p>

            </div>

            <button className="checkout-btn">
              Checkout
            </button>

          </div>

        </div>
      )}
    </section>);
}