import { useState , useEffect } from "react";
import "../Style/FilterList.css";

const FILTERS = ["All", "Fruit", "Vegetable", "Drink"];

const ITEMS = [
  { id: 1, name: "Apple", type: "Fruit" },
  { id: 2, name: "Banana", type: "Fruit" },
  { id: 3, name: "Carrot", type: "Vegetable" },
  { id: 4, name: "Broccoli", type: "Vegetable" },
  { id: 5, name: "Coca Cola", type: "Drink" },
  { id: 6, name: "Orange Juice", type: "Drink" },
  { id: 7, name: "Mango Juice", type: "Drink" },
  { id: 8, name: "Melon Juice", type: "Drink" },
  { id: 9, name: "potato Juice", type: "fruit" },
  { id: 10, name: "sđasd Juice", type: "Drink" },
  { id: 11, name: "áđasá Juice", type: "fruit" },
  { id: 12, name: "fgdag Juice", type: "Drink" },
  { id: 13, name: "ưqewqew Juice", type: "fruit" },
  { id: 14, name: "zxcsv Juice", type: "fruit" },
  { id: 15, name: "jjrtetqe Juice", type: "Drink" },
];

export default function FilterList() {
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchName, setSearchName] = useState("");

  const filteredItems = ITEMS
    .filter(item => {
      if (selectedFilter === "All") return true;
      return item.type === selectedFilter;
    })
    .filter(item =>
      item.name.toLowerCase().includes(searchName.toLowerCase())
    );

  function handleSelect(filter) {
    setSelectedFilter(filter);
    setOpen(false);
  } 

  const [products, setProducts] = useState([]);  
  useEffect(() => {
    fetch("http://localhost:8081/api/products")
    .then(res => res.json())
    .then(data => setProducts(data.data.content)) ; 
  } , []); 



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
          <button>Buy</button>
        </li>
      ))}
  </ul>
</section>); 
}