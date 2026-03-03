import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./Page/Home";
import Navbar from "./Component/Navbar";
import About from "./Page/About";
import Tradition from "./Page/Tradition";
import Event from "./Page/Event";
import Authenticate from "./Page/Authenticate";
import AdminDashboard from "./Page/AdminDashboard";
import CustomerDashboard from "./Page/CustomerDashboard";
import ProfilePage from "./Page/ProfilePage";
import VendorDashboard from "./Page/VendorDashboard";
import VendorRegistration from "./Page/VendorRegistration";
import ProductUpload from "./Page/ProductUpload";
import ProductManagement from "./Page/ProductManagement";
import RevenueDashboard from "./Page/RevenueDashboard";
import AdminReview from "./Page/AdminReview";
import AdminVendorManagement from "./Page/AdminVendorManagement";
import PurchasedProducts from "./Page/PurchasedProducts";

export default function App() {
  return (
    <div className="app snow">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/authenticate" element={<Authenticate />} />
        <Route path="/Page/About" element={<About />} />
        <Route path="/Page/Event" element={<Event />} />
        <Route path="/Page/Tradition" element={<Tradition />} />
        <Route path="/Page/AdminDashboard" element={<AdminDashboard />}>
          <Route index element={<Navigate to="revenue" replace />} />
          <Route path="revenue" element={<RevenueDashboard />} />
          <Route path="vendor-management" element={<AdminVendorManagement />} />
          <Route path="review-management" element={<AdminReview />} />
        </Route>
        <Route path="/Page/CustomerDashboard" element={<CustomerDashboard />}>
          <Route index element={<Navigate to="purchased" replace />} />
          <Route path="purchased" element={<PurchasedProducts />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="/Page/ProfilePage" element={<Navigate to="/Page/CustomerDashboard/profile" replace />} />

        <Route path="/Page/RevenueDashboard" element={<Navigate to="/Page/AdminDashboard/revenue" replace />} />
        <Route path="/Page/AdminReview" element={<Navigate to="/Page/AdminDashboard/review-management" replace />} />
        <Route path="/Page/AdminVendorManagement" element={<Navigate to="/Page/AdminDashboard/vendor-management" replace />} />
        <Route path="/Page/PurchasedProducts" element={<Navigate to="/Page/CustomerDashboard/purchased" replace />} />

        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/revenue" element={<RevenueDashboard />} />
        <Route path="/vendor/register" element={<VendorRegistration />} />
        <Route path="/vendor/products/upload" element={<ProductUpload />} />
        <Route path="/vendor/products" element={<ProductManagement />} />
      </Routes>
    </div>
  );
}
