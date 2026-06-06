import { Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./utils/ProtectedRoutes";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Logout from "./pages/auth/Logout";
import Activation from "./pages/auth/Activation";
import { ToastProvider } from "./context/ToastContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ROLES } from "./utils/roles";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import CancelApplication from "./pages/auth/CancelApplicatin";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Import admin-specific components
import AdminDashboard from "./pages/admin/AdminDash";
import DashboardOverview from "./pages/admin/dashboard/DashboardOverview";
import PermitApprovalQueue from "./pages/admin/dashboard/PermitApprovalQueue";
import GradeDetail from "./pages/admin/coffee-grades/GradeDetail";
import GradeOverview from "./pages/admin/coffee-grades/GradeOverview";
import GradeRegister from "./pages/admin/coffee-grades/GradeRegister";
import PermitDetails from "./pages/admin/permits/PermitDetails";
import PermitManagement from "./pages/admin/permits/PermitManagement";
import WarehouseList from "./pages/admin/warehouse/WarehouseList";
import UsersList from "./pages/admin/users/UsersList";
import SocietyMgmt from "./pages/admin/societies/SocietyMgmt";
import AdminAnalytics from "./pages/admin/analytics/AdminAnalytics";
import SocietyRegister from "./pages/admin/societies/SocietyRegister";
import WarehouseDetail from "./pages/admin/warehouse/WarehouseDetail";
import WarehouseEdit from "./pages/admin/warehouse/WarehouseEdit";
import AdminProfile from "./pages/admin/users/AdminProfile";

// Import farmer-specific components
import Dashboard from "./pages/farmer/FarmerDash";
import FarmerDashboardOverview from "./pages/farmer/dashboard/DashboardOverview";
import NewPermit from "./pages/farmer/dashboard/NewPermit";
import FarmerPermitDetail from "./pages/farmer/dashboard/PermitDetail";
import PermitMgmt from "./pages/farmer/permits/PermitMgmt";
import FactoryMgmt from "./pages/farmer/society/FactoryMgmt";
import FactoryForm from "./pages/farmer/society/FactoryForm";
import CoffeePrice from "./pages/farmer/coffee/CoffeePrice";
import SocietyDetail from "./pages/admin/societies/SocietyDetail";
import FarmerAnalytics from "./pages/farmer/analytics/FarmerAnalytics";
import SocietyProfile from "./pages/farmer/profile/SocietyProfile";
import { SidebarProvider } from "./context/SidebarContext";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <SidebarProvider>
            <ErrorBoundary>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/activation" element={<Activation />} />
                <Route path="/cancel-application/:token" element={<CancelApplication />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute requiredRole={ROLES.FARMER}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                >
                  {/* Farmer Dashboard Nested Routes */}
                  <Route index element={<FarmerDashboardOverview />} />
                  <Route path="permits/" element={<PermitMgmt />} />
                  <Route path="permits/new" element={<NewPermit />} />
                  <Route path="permits/:permitId" element={<FarmerPermitDetail />} />
                  <Route path="factories" element={<FactoryMgmt />} />
                  <Route path="factories/new" element={<FactoryForm />} />
                  <Route path="factories/:factoryId" element={<FactoryForm />} />
                  <Route path="coffee-management" element={<CoffeePrice />} />
                  <Route path="analytics" element={<FarmerAnalytics />} />
                  <Route path="profile" element={<SocietyProfile />} />
                </Route>

                {/* Admin Dashboard Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole={ROLES.ADMIN}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="users" element={<UsersList />} />
                  <Route path="approval-queue" element={<PermitApprovalQueue />} />
                  <Route path="coffee-grades" element={<GradeOverview />} />
                  <Route path="coffee-grades/:gradeId" element={<GradeDetail />} />
                  <Route path="coffee-grades/register" element={<GradeRegister />} />
                  <Route path="permits" element={<PermitManagement />} />
                  <Route path="permits/:permitId" element={<PermitDetails />} />
                  <Route path="warehouses" element={<WarehouseList />} />
                  <Route path="warehouses/:warehouseId" element={<WarehouseDetail />} />
                  <Route path="warehouses/:warehouseId/edit" element={<WarehouseEdit />} />
                  <Route path="societies" element={<SocietyMgmt />} />
                  <Route path="societies/register" element={<SocietyRegister />} />
                  <Route path="societies/:id" element={<SocietyDetail />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>

                {/* 404 Fallback Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </SidebarProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
