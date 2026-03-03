import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./Page/Home";
import Navbar from "./Component/Navbar";
import About from "./Page/About";
import Tradition from "./Page/Tradition";
import Event from "./Page/Event";
import Authenticate from "./Page/Authenticate";
import VendorDashboard from "./Page/VendorDashboard";
import VendorRegistration from "./Page/VendorRegistration";
import ProductUpload from "./Page/ProductUpload";
import ProductManagement from "./Page/ProductManagement";
import Marketplace from "./Page/Marketplace";
import ProductDetail from "./Page/ProductDetail";
import AdminDashboard from "./Page/AdminDashboard";
import UserRegistration from "./Page/UserRegistration";
import RevenueDashboard from "./Page/RevenueDashboard";
import ProfilePage from "./Page/ProfilePage";
import AdminReview from "./Page/AdminReview";

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
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard/>} />
        <Route path="/admin/register" element={<UserRegistration/>} />
        <Route path="/Page/RevenueDashboard" element={<RevenueDashboard/>} />
        <Route path="/Page/ProfilePage" element={<ProfilePage />} />
        <Route path="/Page/AdminReview" element={<AdminReview/>} />
        
        {/* Vendor Routes */}
        <Route path="/vendor/dashboard" element={<VendorDashboard/>} />
        <Route path="/vendor/register" element={<VendorRegistration/>} />
        <Route path="/vendor/products/upload" element={<ProductUpload/>} />
        <Route path="/vendor/products" element={<ProductManagement/>} />
        
        {/* Customer Routes */}
        <Route path="/marketplace" element={<Marketplace/>} />
        <Route path="/products/:productId" element={<ProductDetail productId={window.location.pathname.split("/")[2]} />} />
        <Route path="/category/:category" element={<Marketplace/>} />
        <Route path="/search" element={<Marketplace/>} />
      </Routes>
      
    </div>
  );
}