import React from "react";
import { Routes, Route, Link,Navigate } from "react-router-dom";
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
import Marketplace from "./Page/Marketplace";
import ProductDetail from "./Page/ProductDetail";
import VendorRegistration from "./Page/VendorRegistration";
import ProductUpload from "./Page/ProductUpload";
import ProductManagement from "./Page/ProductManagement";
import CreateSupportTicketWizard from "./Page/CreateSupportTicketWizard";
import VendorTicketManagement from "./Page/VendorTicketManagement";
import CustomerTicketManagement from "./Page/CustomerTicketManagement";
import PaymentResult from "./Page/PaymentResult";

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

        <Route path="/Page/Customer" element={<CustomerDashboard />}>
          <Route index element={<Navigate to="PurchasedProducts" replace />} />
          <Route path="PurchasedProducts" element={<PurchasedProducts />} />
          <Route path="Profile" element={<ProfilePage />} />
          <Route path="CustomerTicketManagement" element={<CustomerTicketManagement/>}/>
          <Route path="CreateSupportTicket" element={<CreateSupportTicketWizard />} />
        </Route>


        <Route path="/Page/Vendor" element={<VendorDashboard />}>
          <Route index element={<Navigate to="RevenueDashboard" replace />} />
          <Route path="RevenueDashboard" element={<RevenueDashboard />} />
          <Route path="ProductUpload" element={<ProductUpload />} />
          <Route path="MyProducts" element={<ProductManagement />} />
          <Route path="VendorTicketManagement" element={<VendorTicketManagement/>}/>
        </Route>

        <Route path="/Page/ProfilePage" element={<ProfilePage />} />
        <Route path="/Page/Admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="AdminVendorManagement" replace />} />
          <Route path="AdminVendorManagement" element={<AdminVendorManagement />} />
          <Route path="AdminReview" element={<AdminReview />} />
        </Route>
         


        <Route path="/Page/PurchasedProducts" element={<PurchasedProducts />} />

        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="/Page/VendorRegistration" element={<VendorRegistration />} />
      </Routes>

    </div>
  );
}