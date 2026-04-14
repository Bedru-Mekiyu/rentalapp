// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import PropertyManagerDashboard from "./pages/PropertyManagerDashboard";
import GeneralManagerDashboard from "./pages/GeneralManagerDashboard";
import FinancialStaffDashboard from "./pages/FinancialStaffDashboard";
import TenantDashboard from "./pages/TenantDashboard";

import UnitsPage from "./pages/UnitsPage";
import LeasesPage from "./pages/LeasesPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentDetailPage from "./pages/PaymentDetailPage";
import FinancePage from "./pages/FinancePage";

import NewLeasePage from "./pages/NewLeasePage";
import UsersPage from "./pages/UsersPage";
import NewUserPage from "./pages/NewUserPage";
import UserDetailPage from "./pages/UserDetailPage";
import TenantDetailPage from "./pages/TenantDetailPage";
import UnitDetailPage from "./pages/UnitDetailPage";
import LeaseDetailPage from "./pages/LeaseDetailPage";
import TenantsPage from "./pages/TenantsPage";
import MyLeasePage from "./pages/MyLeasePage";
import Maintenance from "./pages/Maintenance";
import ReportDetailPage from "./pages/ReportDetailPage";
import SkeletonRow from "./components/SkeletonRow";

function App() {
  //    <Routes>
  // <Route path="/dashboard" element={<Dashboard />} />
  // <Route path="/payments" element={<Payments />} />
  // <Route path="/maintenance" element={<Maintenance />} />
  // </Routes>)

  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="page-transition flex min-h-screen items-center justify-center bg-slate-50">
        <div className="surface-panel w-full max-w-md p-6">
          <SkeletonRow className="h-4 w-28" />
          <div className="mt-4 space-y-3">
            <SkeletonRow className="h-5 w-full" />
            <SkeletonRow className="h-5 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <Toaster />
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected app shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Index route - redirect to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Role-based dashboard */}
        <Route
          path="dashboard"
          element={
            user?.role === "ADMIN" ? (
              // You can swap this to a dedicated Admin dashboard if you add one
              <PropertyManagerDashboard />
            ) : user?.role === "PM" ? (
              <PropertyManagerDashboard />
            ) : user?.role === "GM" ? (
              <GeneralManagerDashboard />
            ) : user?.role === "FS" ? (
              <FinancialStaffDashboard />
            ) : user?.role === "TENANT" ? (
              <TenantDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Common pages */}
        <Route path="units" element={<UnitsPage />} />
        <Route path="units/:id" element={<UnitDetailPage />} />

        <Route path="leases" element={<LeasesPage />} />
        <Route
          path="leases/new"
          element={
            user?.role === "ADMIN" || user?.role === "PM" ? (
              <NewLeasePage />
            ) : (
              <Navigate to="/leases" replace />
            )
          }
        />
        <Route path="leases/:id" element={<LeaseDetailPage />} />

        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/:id" element={<PaymentDetailPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="maintenance" element={<Maintenance />} />

        <Route path="users" element={<UsersPage />} />
        <Route path="users/new" element={<NewUserPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />

        <Route path="reports/:reportId" element={<ReportDetailPage />} />

        {/* My Lease - TENANT only */}
        <Route
          path="my-lease"
          element={
            user?.role === "TENANT" ? (
              <MyLeasePage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Tenant management – ADMIN and PM only */}
        <Route
          path="tenants"
          element={
            user?.role === "ADMIN" || user?.role === "PM" ? (
              <TenantsPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="tenants/:id"
          element={
            user?.role === "ADMIN" || user?.role === "PM" ? (
              <TenantDetailPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate to={user ? "/dashboard" : "/login"} replace />
        }
      />
    </Routes>
    </>
  );
}

export default App;
