import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { internshipAPI } from '../../services/api';

const CompanyInternships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [applications, setApplications] = useState({});
  const [showApplications, setShowApplications] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    start_date: '',
    end_date: '',
    application_deadline: '',
    requirements: '',
    responsibilities: '',
    stipend: '',
    status: 'active'
  });

  useEffect(() => {
    if (user?.role !== 'company') {
      navigate('/dashboard');
      return;
    }
    fetchInternships();
  }, [user, navigate]);

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const response = await internshipAPI.getInternships();
      // Filter internships for current company
      const companyInternships = response.data.results?.filter(
        internship => internship.company?.id === user?.company_profile?.id
      ) || [];
      setInternships(companyInternships);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (internshipId) => {
    try {
      const response = await fetch(`/api/applications/?internship=${internshipId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setApplications(prev => ({
        ...prev,
        [internshipId]: data.results || []
      }));
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInternship) {
        await internshipAPI.updateInternship(editingInternship.id, formData);
      } else {
        await internshipAPI.createInternship(formData);
      }
      
      setShowCreateForm(false);
      setEditingInternship(null);
      setFormData({
        title: '',
        description: '',
        department: '',
        location: '',
        start_date: '',
        end_date: '',
        application_deadline: '',
        requirements: '',
        responsibilities: '',
        stipend: '',
        status: 'active'
      });
      fetchInternships();
    } catch (error) {
      console.error('Error saving internship:', error);
    }
  };

  const handleEdit = (internship) => {
    setEditingInternship(internship);
    setFormData({
      title: internship.title,
      description: internship.description,
      department: internship.department,
      location: internship.location,
      start_date: internship.start_date,
      end_date: internship.end_date,
      application_deadline: internship.application_deadline,
      requirements: internship.requirements,
      responsibilities: internship.responsibilities,
      stipend: internship.stipend || '',
      status: internship.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (internshipId) => {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      try {
        await internshipAPI.deleteInternship(internshipId);
        fetchInternships();
      } catch (error) {
        console.error('Error deleting internship:', error);
      }
    }
  };

  const toggleApplications = (internshipId) => {
    if (showApplications === internshipId) {
      setShowApplications(null);
    } else {
      setShowApplications(internshipId);
      if (!applications[internshipId]) {
        fetchApplications(internshipId);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Internships</h1>
          <p className="text-gray-600">Manage internship opportunities posted by your company</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Post New Internship
        </button>
      </div>

      {/* Create/Edit Internship Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingInternship ? 'Edit Internship' : 'Post New Internship'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internship Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Software Development Intern"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., New York, NY or Remote"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List the required skills, education level, and experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="Describe the day-to-day responsibilities and tasks..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stipend (optional)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    placeholder="e.g., 1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingInternship(null);
                    setFormData({
                      title: '',
                      description: '',
                      department: '',
                      location: '',
                      start_date: '',
                      end_date: '',
                      application_deadline: '',
                      requirements: '',
                      responsibilities: '',
                      stipend: '',
                      status: 'active'
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingInternship ? 'Update Internship' : 'Post Internship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internships List */}
      <div className="bg-white shadow rounded-lg">
        {internships.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {internships.map((internship) => (
              <div key={internship.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{internship.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(internship.status)}`}>
                        {internship.status}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">
                      {internship.department} • {internship.location}
                    </p>
                    
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {internship.description}
                    </p>
                    
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Duration: {internship.start_date} to {internship.end_date}</span>
                      <span>Deadline: {internship.application_deadline}</span>
                      {internship.stipend && <span>Stipend: ${internship.stipend}/month</span>}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => toggleApplications(internship.id)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Applications ({applications[internship.id]?.length || 0})
                    </button>
                    <button
                      onClick={() => handleEdit(internship)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(internship.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Applications Section */}
                {showApplications === internship.id && (
                  <div className="mt-6 border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Applications</h4>
                    {applications[internship.id]?.length > 0 ? (
                      <div className="space-y-3">
                        {applications[internship.id].map((application) => (
                          <div key={application.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {application.student?.user?.first_name} {application.student?.user?.last_name}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {application.student?.student_id} • {application.student?.department}
                                </p>
                                <p className="text-sm text-gray-600">
                                  GPA: {application.student?.gpa} • Credits: {application.student?.credits_completed}
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                  Applied: {new Date(application.applied_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApplicationStatusColor(application.status)}`}>
                                  {application.status}
                                </span>
                                <div className="mt-2 space-x-2">
                                  <button
                                    onClick={() => navigate(`/company/applications/${application.id}`)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No applications yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No internships posted</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by posting your first internship opportunity.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Post Internship
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyInternships;
