import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppLayout } from "./components/AppLayout";
import { CustomerLayout } from "./components/CustomerLayout";

//Admin
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import Bookings from "./pages/Bookings";
import Guests from "./pages/Guests";
import Invoices from "./pages/Invoices";
import Services from "./pages/Services";
import Maintenance from "./pages/Maintenance";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

//Khách hàng
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerBooking from "./pages/customer/CustomerBooking";
import CustomerMyBookings from "./pages/customer/CustomerMyBookings";
import CustomerServices from "./pages/customer/CustomerServices";
import CustomerPayment from "./pages/customer/CustomerPayment";
import CustomerHistory from "./pages/customer/CustomerHistory";
import CustomerProfile from "./pages/customer/CustomerProfile";

const queryClient = new QueryClient();

//Admin Protected Route
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

//Khách hàng Protected Route
const CustomerProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isCustomerLoggedIn") === "true";
  return isLoggedIn ? (
    <>{children}</>
  ) : (
    <Navigate to="/customer/login" replace />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Admin Route */}
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Rooms />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Bookings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/guests"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Guests />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Invoices />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Services />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Maintenance />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Staff />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Khách hàng Route */}
          <Route path="/customer/login" element={<CustomerLogin />} />

          <Route path="/customer/register" element={<CustomerRegister />} />

          <Route
            path="/customer"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerDashboard />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />

          <Route
            path="/customer/booking"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerBooking />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />

          <Route
            path="/customer/my-bookings"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerMyBookings />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />

          <Route
            path="/customer/services"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerServices />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />

          <Route
            path="/customer/payment"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerPayment />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />

          <Route
            path="/customer/history"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerHistory />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <CustomerProtectedRoute>
                <CustomerLayout>
                  <CustomerProfile />
                </CustomerLayout>
              </CustomerProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
