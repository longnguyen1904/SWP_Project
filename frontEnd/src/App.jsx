import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./Page/Home";
import Navbar from "./Component/Navbar";
import About from "./Page/About";
import Policy from "./Page/Policy";
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
import VersionControlManager from "./Page/VersionControlManager";
import LicenseTierConfig from "./Page/LicenseTierConfig";
import CreateSupportTicketWizard from "./Page/CreateSupportTicketWizard";
import VendorTicketManagement from "./Page/VendorTicketManagement";
import CustomerTicketManagement from "./Page/CustomerTicketManagement";
import PaymentResult from "./Page/PaymentResult";
import VendorShop from "./Page/VendorShop";
import WishlistPage from "./Page/WishlistPage";
import AdminCommission from "./Page/AdminCommision.jsx";
import AdminPayout from "./Page/AdminPayout.jsx";
import PayoutResult from "./Page/PayoutResult.jsx";
import QualityAnalyticsDashboard from "./Page/QualityAnalyticsDashboard";
import TransactionLedger from "./Page/TransactionLedger.jsx";
import CouponManagement from "./Page/CouponManagement";
import VendorWallet from "./Page/VendorWallet.jsx";
import HelpCenter from "./Page/HelpCenter.jsx";
import ChatbotWidget from "./Component/ChatbotWidget.jsx";
export default function App() {
  return (
    <div className="app snow">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/authenticate" element={<Authenticate />} />
        <Route path="/Page/About" element={<About />} />
        <Route path="/Page/Event" element={<Event />} />
        <Route path="/Page/Policy" element={<Policy />} />

        <Route path="/Page/Customer" element={<CustomerDashboard />}>
          <Route index element={<Navigate to="PurchasedProducts" replace />} />
          <Route path="PurchasedProducts" element={<PurchasedProducts />} />
          <Route path="Wishlist" element={<WishlistPage />} />
          <Route path="Profile" element={<ProfilePage />} />
          <Route path="CustomerTicketManagement" element={<CustomerTicketManagement />} />
          <Route path="CreateSupportTicket" element={<CreateSupportTicketWizard />} />
          <Route path="HelpCenter" element={<HelpCenter />} />
          <Route path="FollowedVendors" element={<FollowedVendors />} />
        </Route>


        <Route path="/Page/Vendor" element={<VendorDashboard />}>
          <Route index element={<Navigate to="RevenueDashboard" replace />} />
          <Route path="RevenueDashboard" element={<RevenueDashboard />} >
            <Route path="TransactionLedger" element={<TransactionLedger />} />
          </Route>
          <Route path="ProductUpload" element={<ProductUpload />} />
          <Route path="MyProducts" element={<ProductManagement />} />
          <Route path="VersionControl" element={<VersionControlManager />} />
          <Route path="LicenseTiers" element={<LicenseTierConfig />} />
          <Route path="Profile" element={<ProfilePage />} />
          <Route path="VendorTicketManagement" element={<VendorTicketManagement />} />
          <Route path="QualityAnalyticsDashboard" element={<QualityAnalyticsDashboard />} />
          <Route path="CouponManagement" element={<CouponManagement />} />
          <Route path="Wallet" element={<VendorWallet />} />
        </Route>

        <Route path="/Page/ProfilePage" element={<ProfilePage />} />
        <Route path="/Page/Admin" element={<AdminDashboard />}>
          <Route index element={<Navigate to="AdminVendorManagement" replace />} />
          <Route path="AdminVendorManagement" element={<AdminVendorManagement />} />
          <Route path="AdminReview" element={<AdminReview />} />
          <Route path="AdminCommission" element={<AdminCommission />} />
          <Route path="AdminPayout" element={<AdminPayout />} />

        </Route>

        <Route path="/Page/PurchasedProducts" element={<PurchasedProducts />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/vendors/:vendorId" element={<VendorShop />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="/payout-result" element={<PayoutResult />} />
        <Route path="/Page/VendorRegistration" element={<VendorRegistration />} />
      </Routes>
      <ChatbotWidget />
    </div>
  );
}