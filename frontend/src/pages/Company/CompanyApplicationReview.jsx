import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { applicationAPI, internshipAPI } from '../../services/api';

const CompanyApplicationReview = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  useEffect(() => {
    if (user?.role !== 'company') {
      navigate('/dashboard');
      return;
    }
    fetchApplication();
  }, [id, user, navigate]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getApplication(id);
      setApplication(response.data);
      
      // Fetch internship details
      const internshipResponse = await internshipAPI.getInternship(response.data.internship);
      setInternship(internshipResponse.data);
    } catch (error) {
      console.error('Error fetching application:', error);
      navigate('/company/internships');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await applicationAPI.updateApplication(id, { status: newStatus });
      setApplication(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating application status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await applicationAPI.updateApplication(id, { 
        status: 'reviewed',
        company_feedback: feedback 
      });
      setApplication(prev => ({ 
        ...prev, 
        status: 'reviewed',
        company_feedback: feedback 
      }));
      setShowFeedbackForm(false);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadResume = () => {
    if (application.resume) {
      window.open(application.resume, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Application not found</h2>
        <p className="mt-2 text-gray-600">The application you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/company/internships')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Internships
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Application Review</h1>
        </div>
        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(application.status)}`}>
          {application.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Student Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Name</p>
                <p className="text-sm text-gray-600">
                  {application.student?.user?.first_name} {application.student?.user?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Student ID</p>
                <p className="text-sm text-gray-600">{application.student?.student_id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{application.student?.user?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Department</p>
                <p className="text-sm text-gray-600">{application.student?.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Year of Study</p>
                <p className="text-sm text-gray-600">{application.student?.year_of_study}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">GPA</p>
                <p className="text-sm text-gray-600">{application.student?.gpa}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Credits Completed</p>
                <p className="text-sm text-gray-600">{application.student?.credits_completed}</p>
              </div>
            </div>

            {/* Resume Download */}
            {application.resume && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={downloadResume}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Resume
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Internship Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Internship Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Position</p>
                <p className="text-sm text-gray-600">{internship?.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Department</p>
                <p className="text-sm text-gray-600">{internship?.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Location</p>
                <p className="text-sm text-gray-600">{internship?.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Duration</p>
                <p className="text-sm text-gray-600">
                  {internship?.start_date} to {internship?.end_date}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Application Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(application.applied_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cover Letter</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {application.cover_letter}
              </p>
            </div>
          </div>

          {/* Company Feedback */}
          {application.company_feedback && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Previous Feedback</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {application.company_feedback}
              </p>
            </div>
          )}

          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Provide Feedback</h2>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provide detailed feedback about this application..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Application Actions</h2>
            <div className="flex flex-wrap gap-3">
              {application.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Request More Information
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('reviewed')}
                    disabled={updating}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Mark as Reviewed
                  </button>
                </>
              )}
              
              {(application.status === 'pending' || application.status === 'reviewed') && (
                <>
                  <button
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept Application
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                </>
              )}

              {application.status === 'accepted' && (
                <button
                  onClick={() => navigate(`/company/feedback/${application.id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Provide Performance Feedback
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyApplicationReview;
