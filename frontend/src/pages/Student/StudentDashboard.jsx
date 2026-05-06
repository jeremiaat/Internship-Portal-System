import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { internshipAPI, applicationAPI, reportAPI, gradeAPI } from '../../services/api.js';

const StudentDashboard = () => {
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
      
      // Fetch student-specific data
      const [internships, applications, grades] = await Promise.all([
        internshipAPI.getInternships().catch(() => ({ data: { results: [] } })),
        applicationAPI.getApplications().catch(() => ({ data: { results: [] } })),
        gradeAPI.getGrades().catch(() => ({ data: { results: [] } })),
      ]);
      
      data.totalInternships = internships.data.results.length;
      data.myApplications = applications.data.results.length;
      data.pendingApplications = applications.data.results.filter(a => a.status === 'pending').length;
      data.acceptedApplications = applications.data.results.filter(a => a.status === 'accepted').length;
      data.myGrades = grades.data.results.length;
      data.cgpa = user?.profile_data?.gpa || 0;
      
      // Debug logging
      console.log('User data:', user);
      console.log('Profile data:', user?.profile_data);
      console.log('CGPA value:', user?.profile_data?.gpa);
      console.log('Applications:', applications.data.results);
      console.log('Accepted applications:', applications.data.results.filter(a => a.status === 'accepted'));
      
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your internship applications and progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-50 rounded-xl p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Available Internships</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalInternships || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-50 rounded-xl p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Applications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.myApplications || 0}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-xs font-medium text-yellow-600">{stats.pendingApplications || 0} pending</span>
                <span className="text-xs font-medium text-green-600">{stats.acceptedApplications || 0} accepted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-50 rounded-xl p-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">CGPA</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.cgpa || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Cumulative GPA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => navigate('/internships')} className="group p-4 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-blue-50 rounded-lg p-2.5 group-hover:bg-blue-100 transition-colors">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Browse Internships</p>
                <p className="text-sm text-gray-500">{stats.totalInternships || 0} available</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/applications')} className="group p-4 text-left border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-green-50 rounded-lg p-2.5 group-hover:bg-green-100 transition-colors">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">My Applications</p>
                <p className="text-sm text-gray-500">{stats.myApplications || 0} submitted</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/reports')} className="group p-4 text-left border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-purple-50 rounded-lg p-2.5 group-hover:bg-purple-100 transition-colors">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m0 4h12a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Submit Report</p>
                <p className="text-sm text-gray-500">{stats.pendingReports || 0} in progress</p>
              </div>
            </div>
          </button>

          <button onClick={() => navigate('/grades')} className="group p-4 text-left border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-orange-50 rounded-lg p-2.5 group-hover:bg-orange-100 transition-colors">
                <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">View Grades</p>
                <p className="text-sm text-gray-500">Avg: {stats.averageGrade || 0}%</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                notification.priority === 'urgent' ? 'bg-red-500' :
                notification.priority === 'high' ? 'bg-orange-500' :
                notification.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(notification.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
