import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./Page/Home";
import Navbar from "./Component/Navbar";
import About from "./Page/About";
import Tradition from "./Page/Tradition";
import Event from "./Page/Event";
export default function App() {
  return (
    <div className="app snow">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/Page/About" element={<About/>} />
        <Route path="/Page/Event" element={<Event/>} />
        <Route path="/Page/Tradition" element={<Tradition/>} />
      </Routes>
    </div>
  );
}