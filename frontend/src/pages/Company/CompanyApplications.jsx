import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { applicationAPI, internshipAPI } from '../../services/api';
import { useToast } from '../../components/UI/Toast';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Skeleton from '../../components/UI/Skeleton';
import EmptyState from '../../components/UI/EmptyState';

const CompanyApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';

  useEffect(() => {
    if (user?.role !== 'company') {
      navigate('/dashboard');
      return;
    }
    fetchApplications();
  }, [statusFilter, searchTerm]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = { internship_id: undefined }; // Will filter by company internships via backend
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await applicationAPI.getApplications(params);
      let data = response.data.results || [];

      // Client-side search
      if (searchTerm) {
        data = data.filter(app => 
          app.student?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.student?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (appId, newStatus) => {
    setConfirmDialog({
      title: newStatus === 'accepted' ? 'Accept Application?' : 'Reject Application?',
      message: newStatus === 'accepted' 
        ? 'Are you sure you want to accept this application? The student will be notified.' 
        : 'Are you sure you want to reject this application? The student will be notified.',
      onConfirm: async () => {
        setUpdating(appId);
        try {
          await applicationAPI.updateApplication(appId, { status: newStatus });
          setApplications(prev => prev.map(app => 
            app.id === appId ? { ...app, status: newStatus } : app
          ));
          if (selectedApplication?.id === appId) {
            setSelectedApplication(prev => ({ ...prev, status: newStatus }));
          }
          addToast(
            newStatus === 'accepted'
              ? 'Application accepted successfully.'
              : 'Application rejected successfully.',
            'success'
          );
          setConfirmDialog(null);
        } catch (error) {
          console.error('Error updating application:', error);
          addToast('Failed to update application. Please try again.', 'error');
        } finally {
          setUpdating(null);
        }
      }
    });
  };

  const openApplicationModal = async (app) => {
    try {
      // Fetch full application details
      const response = await applicationAPI.getApplication(app.id);
      setSelectedApplication(response.data);
      
      // Fetch internship details
      const internshipResponse = await internshipAPI.getInternship(response.data.internship_id);
      setSelectedInternship(internshipResponse.data);
    } catch (error) {
      console.error('Error fetching application details:', error);
      addToast('Failed to load application details. Please try again.', 'error');
    }
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setSelectedInternship(null);
  };

  const downloadResume = () => {
    if (selectedApplication?.resume) {
      window.open(selectedApplication.resume, '_blank');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statusStats = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const updateStatusFilter = (status) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    if (searchTerm) newParams.set('search', searchTerm);
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Applications</h1>
          <p className="text-gray-600 mt-1">Review applications for your internships</p>
        </div>
        <div className="text-sm text-gray-500">
          Showing {applications.length} applications
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => updateStatusFilter(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  statusFilter === option.value
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            {Object.entries(statusStats).map(([status, count]) => (
              status !== 'all' && (
                <div key={status} className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {status}: {count}
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {applications.length === 0 ? (
          <EmptyState
            title="No applications"
            description="No applications for your internships yet. Create internships to receive applications."
            icon="FileText"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Internship
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-medium text-sm">
                            {application.student?.user?.first_name?.[0]}{application.student?.user?.last_name?.[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.student?.user?.first_name} {application.student?.user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{application.student?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{application.internship?.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(application.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openApplicationModal(application)}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          Review
                        </Button>
                        {application.status !== 'completed' && (
                          <>
                            <button
                              onClick={() => handleQuickAction(application.id, 'accepted')}
                              disabled={updating === application.id}
                              className="px-2 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded transition-colors"
                              title="Accept"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleQuickAction(application.id, 'rejected')}
                              disabled={updating === application.id}
                              className="px-2 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded transition-colors"
                              title="Reject"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 animate-in">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                disabled={updating}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                  confirmDialog.title.includes('Reject')
                    ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                    : 'bg-green-600 hover:bg-green-700 disabled:opacity-50'
                }`}
              >
                {updating ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">Application Review</h2>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                  {selectedApplication.status}
                </span>
              </div>
              <button
                onClick={closeApplicationModal}
                className="text-gray-400 hover:text-gray-600 font-bold text-2xl w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-280px)] p-6">
              {/* Decision Section */}
              {selectedApplication.status !== 'completed' && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <h3 className="font-bold text-blue-900 mb-3 text-sm">Make a Decision</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuickAction(selectedApplication.id, 'accepted')}
                      disabled={updating === selectedApplication.id}
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <span>✓</span> Accept
                    </button>
                    <button
                      onClick={() => handleQuickAction(selectedApplication.id, 'rejected')}
                      disabled={updating === selectedApplication.id}
                      className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <span>✕</span> Reject
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Student Information */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Student Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {selectedApplication.student?.user?.first_name} {selectedApplication.student?.user?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedApplication.student?.student_id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-sm text-blue-600 mt-1">{selectedApplication.student?.user?.email}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedApplication.student?.department}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</p>
                        <p className="text-sm text-gray-900 mt-1">Year {selectedApplication.student?.year_of_study}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">GPA</p>
                        <p className="text-lg font-bold text-green-700 mt-1">{selectedApplication.student?.gpa}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credits</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedApplication.student?.credits_completed}</p>
                      </div>

                      {/* Resume Download */}
                      {selectedApplication.resume && (
                        <button
                          onClick={downloadResume}
                          className="w-full mt-4 px-3 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <span>📄</span> Download Resume
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="md:col-span-2 space-y-4">
                  {/* Internship Details */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3">Internship Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedInternship?.title}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedInternship?.department}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                        <p className="text-sm text-gray-900 mt-1">{selectedInternship?.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedInternship?.start_date} to {selectedInternship?.end_date}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3">Cover Letter</h3>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedApplication.cover_letter}
                      </p>
                    </div>
                  </div>

                  {/* Application Info */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Applied Date</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedApplication.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={closeApplicationModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyApplications;

