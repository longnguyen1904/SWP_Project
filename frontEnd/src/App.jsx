import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./Page/Home";
import Navbar from "./Component/Navbar";
import About from "./Page/About";
import Tradition from "./Page/Tradition";
import Event from "./Page/Event";
import Authenticate from "./Page/Authenticate";
import RevenueDashboard from "./Page/RevenueDashboard";
import ProfilePage from "./Page/ProfilePage";

export default function App() {
  return (
    <div className="app snow">
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/authenticate"element={<Authenticate/>}/>
        <Route path="/Page/About" element={<About/>} />
        <Route path="/Page/Event" element={<Event/>} />
        <Route path="/Page/Tradition" element={<Tradition/>} />
        <Route path="/Page/RevenueDashboard" element={<RevenueDashboard/>} />
        <Route path="/Page/ProfilePage" element={<ProfilePage />} />
      </Routes>
      
    </div>
  );
}