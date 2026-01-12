import { useState } from "react";
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

  // 🔥 FILTER THEO TYPE + NAME
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

  return (

    <section className="filter-container">
      
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
        {filteredItems.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
