import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { applicationAPI, reportAPI } from '../../services/api';

const CompanyPerformanceFeedback = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  const [feedbackData, setFeedbackData] = useState({
    overall_rating: 5,
    technical_skills: 5,
    communication: 5,
    teamwork: 5,
    initiative: 5,
    time_management: 5,
    strengths: '',
    areas_for_improvement: '',
    additional_comments: '',
    would_hire_again: true
  });

  useEffect(() => {
    if (user?.role !== 'company') {
      navigate('/dashboard');
      return;
    }
    fetchApplicationData();
  }, [id, user, navigate]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const applicationResponse = await applicationAPI.getApplication(id);
      setApplication(applicationResponse.data);

      // Fetch student reports for this internship
      const reportsResponse = await reportAPI.getReports({
        application: id
      });
      setReports(reportsResponse.data.results || []);

    } catch (error) {
      console.error('Error fetching application data:', error);
      navigate('/company/internships');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (field, value) => {
    setFeedbackData(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create evaluation data
      const evaluationData = {
        application: id,
        overall_rating: feedbackData.overall_rating,
        technical_skills: feedbackData.technical_skills,
        communication: feedbackData.communication,
        teamwork: feedbackData.teamwork,
        initiative: feedbackData.initiative,
        time_management: feedbackData.time_management,
        strengths: feedbackData.strengths,
        areas_for_improvement: feedbackData.areas_for_improvement,
        additional_comments: feedbackData.additional_comments,
        would_hire_again: feedbackData.would_hire_again,
        supervisor: user.profile_data.id
      };

      // Submit feedback via API (you'll need to create this endpoint)
      await applicationAPI.updateApplication(id, {
        status: 'completed',
        company_feedback: JSON.stringify(evaluationData)
      });

      setApplication(prev => ({ ...prev, status: 'completed' }));
      setExistingFeedback(evaluationData);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Average';
    if (rating >= 1.5) return 'Below Average';
    return 'Poor';
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Performance Feedback</h1>
          <p className="text-gray-600">
            Provide feedback for {application.student?.user?.first_name} {application.student?.user?.last_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Information */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Intern Information</h2>
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
                <p className="text-sm font-medium text-gray-900">Department</p>
                <p className="text-sm text-gray-600">{application.student?.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Internship</p>
                <p className="text-sm text-gray-600">{application.internship?.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Duration</p>
                <p className="text-sm text-gray-600">
                  {application.internship?.start_date} to {application.internship?.end_date}
                </p>
              </div>
            </div>
          </div>

          {/* Reports Summary */}
          {reports.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Submitted Reports</h2>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="text-sm">
                    <p className="font-medium text-gray-900">{report.title}</p>
                    <p className="text-gray-600">
                      {report.report_type} • {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Form */}
        <div className="lg:col-span-2">
          {application.status === 'completed' && existingFeedback ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Submitted Feedback</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(existingFeedback).map(([key, value]) => {
                    if (typeof value === 'number' && key !== 'application' && key !== 'supervisor') {
                      return (
                        <div key={key} className="text-center">
                          <div className={`text-2xl font-bold ${getRatingColor(value)}`}>
                            {value}/5
                          </div>
                          <p className="text-sm text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
                
                {existingFeedback.strengths && (
                  <div>
                    <h3 className="font-medium text-gray-900">Strengths</h3>
                    <p className="text-gray-700">{existingFeedback.strengths}</p>
                  </div>
                )}
                
                {existingFeedback.areas_for_improvement && (
                  <div>
                    <h3 className="font-medium text-gray-900">Areas for Improvement</h3>
                    <p className="text-gray-700">{existingFeedback.areas_for_improvement}</p>
                  </div>
                )}
                
                {existingFeedback.additional_comments && (
                  <div>
                    <h3 className="font-medium text-gray-900">Additional Comments</h3>
                    <p className="text-gray-700">{existingFeedback.additional_comments}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Section */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Ratings</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Rate the intern's performance on a scale of 1-5 (1=Poor, 5=Excellent)
                </p>
                
                <div className="space-y-4">
                  {[
                    { key: 'overall_rating', label: 'Overall Performance' },
                    { key: 'technical_skills', label: 'Technical Skills' },
                    { key: 'communication', label: 'Communication Skills' },
                    { key: 'teamwork', label: 'Teamwork' },
                    { key: 'initiative', label: 'Initiative' },
                    { key: 'time_management', label: 'Time Management' }
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">
                          {label}
                        </label>
                        <span className={`text-sm font-medium ${getRatingColor(feedbackData[key])}`}>
                          {feedbackData[key]}/5 - {getRatingLabel(feedbackData[key])}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingChange(key, rating)}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                              feedbackData[key] === rating
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Written Feedback */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Written Feedback</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strengths
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What were the intern's key strengths and positive contributions?"
                      value={feedbackData.strengths}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, strengths: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Areas for Improvement
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="What areas could the intern improve on?"
                      value={feedbackData.areas_for_improvement}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, areas_for_improvement: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Comments
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Any additional feedback or comments?"
                      value={feedbackData.additional_comments}
                      onChange={(e) => setFeedbackData(prev => ({ ...prev, additional_comments: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Future Employment */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Future Employment</h2>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="would_hire_again"
                    checked={feedbackData.would_hire_again}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, would_hire_again: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="would_hire_again" className="ml-2 text-sm text-gray-700">
                    I would consider hiring this intern for a full-time position in the future
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyPerformanceFeedback;
