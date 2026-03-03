import ProtectedRoute from "./Component/ProtectedRoute";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./Page/Home";
import Navbar from "./Component/Navbar";
import About from "./Page/About";
import Tradition from "./Page/Tradition";
import Event from "./Page/Event";
import Authenticate from "./Page/Authenticate";
import RevenueDashboard from "./Page/RevenueDashboard";
import ProfilePage from "./Page/ProfilePage";
import AdminReview from "./Page/AdminReview";
import AdminVendorManagement from "./Page/AdminVendorManagement";
import PurchasedProducts from "./Page/PurchasedProducts";
import AdminDashboard from "./Page/AdminDashboard";
import VendorDashboard from "./Page/VendorDashboard";
import CustomerDashboard from "./Page/CustomerDashboard";
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

        <Route path="/Page/Customer" element={
          <ProtectedRoute>
            <CustomerDashboard />
          </ProtectedRoute>}>
          <Route index element={<Navigate to="PurchasedProducts" replace />} />
          <Route path="PurchasedProducts" element={<PurchasedProducts />} />
          <Route path="Profile" element={<ProfilePage />} />
        </Route>

        <Route path="/Page/Vendor" element={<VendorDashboard />}>
          <Route index element={<Navigate to="RevenueDashboard" replace />} />
          <Route path="RevenueDashboard" element={<RevenueDashboard />} />
        </Route>

        <Route path="/Page/ProfilePage" element={<ProfilePage />} />
        <Route path="/Page/Admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="AdminVendorManagement" replace />} />
          <Route path="AdminVendorManagement" element={<AdminVendorManagement />} />
          <Route path="AdminReview" element={<AdminReview />} />
        </Route>


        <Route path="/Page/PurchasedProducts" element={<PurchasedProducts />} />
      </Routes>

    </div>
  );
}