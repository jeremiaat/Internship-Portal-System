import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { gradeAPI, applicationAPI } from '../../services/api';

const RegistrarDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, getUnreadCount, fetchNotifications } = useNotifications();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = {};
      
      // Fetch registrar-specific data
      const [grades, applications, students] = await Promise.all([
        gradeAPI.getGrades().catch(() => ({ data: { results: [] } })),
        applicationAPI.getApplications().catch(() => ({ data: { results: [] } })),
        userAPI.getStudents().catch(() => ({ data: { results: [] } })),
      ]);
      
      data.totalGrades = grades.data.results.length;
      data.pendingGrades = grades.data.results.filter(g => g.status === 'pending').length;
      data.approvedGrades = grades.data.results.filter(g => g.status === 'approved').length;
      data.rejectedGrades = grades.data.results.filter(g => g.status === 'rejected').length;
      
      data.totalApplications = applications.data.results.length;
      data.acceptedApplications = applications.data.results.filter(a => a.status === 'accepted').length;
      data.activeInternships = applications.data.results.filter(a => 
        a.status === 'accepted' && a.internship?.status === 'active'
      ).length;
      
      // Calculate department GPA using student CGPA
      const studentsWithGPA = students.data.results.filter(s => s.gpa);
      data.averageGrade = studentsWithGPA.length > 0 
        ? (studentsWithGPA.reduce((sum, s) => sum + Number(s.gpa), 0) / studentsWithGPA.length).toFixed(2)
        : 0;
      
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registrar Dashboard</h1>
        <p className="text-gray-600">Manage academic records and grade processing</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Student Eligibility</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.acceptedApplications || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-gray-600">eligible students</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Grade Processing</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingGrades || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-red-600">pending approval</span>
                <span className="text-xs text-green-600">{stats.approvedGrades || 0} approved</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Academic Performance</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageGrade || 0}%</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-gray-600">average grade</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Academic Records</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalGrades || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-gray-600">total records</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => navigate('/applications')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Verify Eligibility</p>
                <p className="text-sm text-gray-600">Review student requirements</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/grades')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Process Grades</p>
                <p className="text-sm text-gray-600">{stats.pendingGrades || 0} pending</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/grades')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Update Records</p>
                <p className="text-sm text-gray-600">Manage academic records</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/dashboard/registrar')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Generate Reports</p>
                <p className="text-sm text-gray-600">Academic analytics</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
              <div className={`w-2 h-2 rounded-full ${
                notification.priority === 'urgent' ? 'bg-red-500' :
                notification.priority === 'high' ? 'bg-orange-500' :
                notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;
