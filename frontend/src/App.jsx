// src/App.jsx
import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Toaster } from "react-hot-toast";

// Core components (eager loaded)
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import SkeletonRow from "./components/SkeletonRow";

// Pages (lazy loaded for code splitting)
const Login = lazy(() => import("./pages/Login"));
const PropertyManagerDashboard = lazy(() => import("./pages/PropertyManagerDashboard"));
const GeneralManagerDashboard = lazy(() => import("./pages/GeneralManagerDashboard"));
const FinancialStaffDashboard = lazy(() => import("./pages/FinancialStaffDashboard"));
const TenantDashboard = lazy(() => import("./pages/TenantDashboard"));

const UnitsPage = lazy(() => import("./pages/UnitsPage"));
const LeasesPage = lazy(() => import("./pages/LeasesPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const PaymentDetailPage = lazy(() => import("./pages/PaymentDetailPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));

const NewLeasePage = lazy(() => import("./pages/NewLeasePage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const NewUserPage = lazy(() => import("./pages/NewUserPage"));
const UserDetailPage = lazy(() => import("./pages/UserDetailPage"));
const TenantDetailPage = lazy(() => import("./pages/TenantDetailPage"));
const UnitDetailPage = lazy(() => import("./pages/UnitDetailPage"));
const LeaseDetailPage = lazy(() => import("./pages/LeaseDetailPage"));
const TenantsPage = lazy(() => import("./pages/TenantsPage"));
const MyLeasePage = lazy(() => import("./pages/MyLeasePage"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ReportDetailPage = lazy(() => import("./pages/ReportDetailPage"));

// Loading fallback component
const PageLoading = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="surface-panel w-full max-w-md p-6">
      <SkeletonRow className="h-4 w-28" />
      <div className="mt-4 space-y-3">
        <SkeletonRow className="h-5 w-full" />
        <SkeletonRow className="h-5 w-3/4" />
      </div>
    </div>
  </div>
);

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
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoading />}>
            <Login />
          </Suspense>
        }
      />

      {/* Protected app shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Layout />
            </Suspense>
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
        <Route
          path="maintenance"
          element={
            user?.role === "ADMIN" || user?.role === "PM" || user?.role === "GM" ? (
              <Suspense fallback={<PageLoading />}>
                <Maintenance />
              </Suspense>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

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
