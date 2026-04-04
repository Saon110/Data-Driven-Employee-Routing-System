import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

// Auth Components
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';

// Employee Components
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { PickupRequestForm } from './components/employee/PickupRequestForm';
import { DropoffRequestForm } from './components/employee/DropoffRequestForm';
import { AdhocRequestForm } from './components/employee/AdhocRequestForm';
import { MyRequests } from './components/employee/MyRequests';
import { EmployeeProfile } from './components/employee/EmployeeProfile';

// Driver Components
import { DriverRoute } from './components/driver/DriverRoute';
import { DriverPassengers } from './components/driver/DriverPassengers';
import { DriverVehicleInfo } from './components/driver/DriverVehicleInfo';
import { DriverProfile } from './components/driver/DriverProfile';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'employee' | 'driver' }> = ({
  children,
  requiredRole,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard if wrong role
    if (user.role === 'employee') {
      return <Navigate to="/employee/dashboard" replace />;
    } else {
      return <Navigate to="/driver/route" replace />;
    }
  }

  return <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'employee' ? '/employee/dashboard' : '/driver/route'} replace />} />
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/employee/dashboard" replace />} />

      {/* Employee Routes */}
      <Route
        path="/employee/dashboard"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/pickup"
        element={
          <ProtectedRoute requiredRole="employee">
            <PickupRequestForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/dropoff"
        element={
          <ProtectedRoute requiredRole="employee">
            <DropoffRequestForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/adhoc"
        element={
          <ProtectedRoute requiredRole="employee">
            <AdhocRequestForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/requests"
        element={
          <ProtectedRoute requiredRole="employee">
            <MyRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeProfile />
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver/route"
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/passengers"
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverPassengers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/vehicle"
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverVehicleInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute requiredRole="driver">
            <DriverProfile />
          </ProtectedRoute>
        }
      />

      {/* Default Route */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'employee' ? '/employee/dashboard' : '/driver/route'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 Catch All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;