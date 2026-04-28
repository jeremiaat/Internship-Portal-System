import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { internshipAPI, applicationAPI, reportAPI, gradeAPI } from '../../services/api';

const CoordinatorDashboard = () => {
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
      
      // Fetch coordinator-specific data
      const [internships, applications, reports, grades] = await Promise.all([
        internshipAPI.getInternships().catch(() => ({ data: { results: [] } })),
        applicationAPI.getApplications().catch(() => ({ data: { results: [] } })),
        reportAPI.getReports().catch(() => ({ data: { results: [] } })),
        gradeAPI.getGrades().catch(() => ({ data: { results: [] } })),
      ]);
      
      data.totalInternships = internships.data.results.length;
      data.activeInternships = internships.data.results.filter(i => i.status === 'active').length;
      data.totalApplications = applications.data.results.length;
      data.pendingApplications = applications.data.results.filter(a => a.status === 'pending').length;
      data.acceptedApplications = applications.data.results.filter(a => a.status === 'accepted').length;
      data.totalReports = reports.data.results.length;
      data.pendingReports = reports.data.results.filter(r => r.status === 'submitted').length;
      data.reviewedReports = reports.data.results.filter(r => r.status === 'reviewed').length;
      data.totalGrades = grades.data.results.length;
      data.pendingGrades = grades.data.results.filter(g => g.status === 'pending').length;
      
      // Company statistics
      const companies = [...new Set(internships.data.results.map(i => i.company?.id))].filter(Boolean);
      data.totalCompanies = companies.length;
      data.activeCompanies = internships.data.results
        .filter(i => i.status === 'active')
        .map(i => i.company?.id)
        .filter((id, index, arr) => arr.indexOf(id) === index).length;
      
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
        <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
        <p className="text-gray-600">Manage internships, applications, and student progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Companies</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCompanies || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-gray-600">{stats.totalCompanies || 0} total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Internship Programs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeInternships || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-gray-600">{stats.totalInternships || 0} total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Student Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalApplications || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-yellow-600">{stats.pendingApplications || 0} pending</span>
                <span className="text-xs text-green-600">{stats.acceptedApplications || 0} accepted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m0 4h12a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Report Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReports || 0}</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-red-600">pending review</span>
                <span className="text-xs text-gray-600">{stats.reviewedReports || 0} reviewed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => navigate('/internships')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Approve Companies</p>
                <p className="text-sm text-gray-600">Review company registrations</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/applications')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Assign Students</p>
                <p className="text-sm text-gray-600">Manage student placements</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/applications')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Applications</p>
                <p className="text-sm text-gray-600">Process student applications</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/grades')} className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-2">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Submit Grades</p>
                <p className="text-sm text-gray-600">Manage student evaluations</p>
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

export default CoordinatorDashboard;
