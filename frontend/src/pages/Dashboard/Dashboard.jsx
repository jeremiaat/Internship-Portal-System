import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to appropriate role-specific dashboard
  if (user?.role === 'student') {
    return <Navigate to="/dashboard/student" replace />;
  } else if (user?.role === 'coordinator') {
    return <Navigate to="/dashboard/coordinator" replace />;
  } else if (user?.role === 'company') {
    return <Navigate to="/dashboard/company" replace />;
  } else if (user?.role === 'registrar') {
    return <Navigate to="/dashboard/registrar" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Dashboard;
