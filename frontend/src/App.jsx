import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';

// Import components (we'll create these next)
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import InternshipList from './pages/Internships/InternshipList';
import InternshipDetail from './pages/Internships/InternshipDetail';
import Applications from './pages/Applications/Applications';
import Reports from './pages/Reports/Reports';
import Grades from './pages/Grades/Grades';

// Role-specific dashboards
import StudentDashboard from './pages/Student/StudentDashboard';
import CoordinatorDashboard from './pages/Coordinator/CoordinatorDashboard';
import CompanyDashboard from './pages/Company/CompanyDashboard';
import RegistrarDashboard from './pages/Registrar/RegistrarDashboard';

// Coordinator pages
import CoordinatorCompanies from './pages/Coordinator/CoordinatorCompanies';

// Company pages
import CompanyInternships from './pages/Company/CompanyInternships';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Role-specific dashboards */}
        <Route path="dashboard/student" element={<StudentDashboard />} />
        <Route path="dashboard/coordinator" element={<CoordinatorDashboard />} />
        <Route path="dashboard/company" element={<CompanyDashboard />} />
        <Route path="dashboard/registrar" element={<RegistrarDashboard />} />
        
        <Route path="internships" element={<InternshipList />} />
        <Route path="internships/:id" element={<InternshipDetail />} />
        <Route path="applications" element={<Applications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="grades" element={<Grades />} />
        <Route path="companies" element={<CoordinatorCompanies />} />
        <Route path="company/internships" element={<CompanyInternships />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
