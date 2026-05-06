import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { applicationAPI, internshipAPI } from '../../../services/api';
import Button from '../../../components/UI/Button';
import Skeleton from '../../../components/UI/Skeleton';
import EmptyState from '../../../components/UI/EmptyState';

const CoordinatorApplicationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'coordinator') {
      navigate('/dashboard');
      return;
    }
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getApplication(id);
      setApplication(response.data);
      
      if (response.data.internship_id) {
        try {
          const internshipResponse = await internshipAPI.getInternship(response.data.internship_id);
          setInternship(internshipResponse.data);
        } catch (error) {
          console.error('Error fetching internship:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
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
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadResume = () => {
    if (application?.resume) {
      window.open(application.resume, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-96" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <EmptyState
        title="Application not found"
        description="The application you're looking for doesn't exist or you don't have permission to view it."
        action={
          <Button onClick={() => navigate('/coordinator/applications')} variant="outline">
            Back to Applications
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/coordinator/applications')}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-2"
          >
            ← Back to Applications
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
        </div>
        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(application.status)}`}>
          {application.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Student Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <p className="text-gray-900">{application.student?.user?.first_name} {application.student?.user?.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{application.student?.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <p className="text-gray-900">{application.student?.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <p className="text-gray-900">Year {application.student?.year_of_study}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                <p className="text-gray-900">{application.student?.gpa}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applied Date</label>
                <p className="text-gray-900">{new Date(application.applied_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Resume Download */}
            {application.resume && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Button onClick={downloadResume} className="w-full">
                  📄 Download Resume
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Internship Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Internship Details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Position</dt>
                <dd className="mt-1 text-sm text-gray-900">{internship?.title || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">{internship?.company?.company_name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{internship?.department || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{internship?.location || 'N/A'}</dd>
              </div>
              {internship?.start_date && internship?.end_date && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(internship.start_date).toLocaleDateString()} - {new Date(internship.end_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Cover Letter */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h2>
            <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-800">{application.cover_letter || 'No cover letter provided.'}</p>
            </div>
          </div>

          {/* Company Feedback (if any) */}
          {application.company_feedback && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Feedback</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{application.company_feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorApplicationDetail;

