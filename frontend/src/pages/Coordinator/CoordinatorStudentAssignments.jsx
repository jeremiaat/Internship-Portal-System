import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const CoordinatorStudentAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const [formData, setFormData] = useState({
    student: '',
    company: '',
    internship: '',
    supervisor: '',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    if (user?.role !== 'coordinator') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [assignmentsRes, studentsRes, companiesRes, internshipsRes] = await Promise.all([
        fetch('/api/assignments/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('/api/students/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('/api/companies/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch('/api/internships/', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      const assignmentsData = await assignmentsRes.json();
      const studentsData = await studentsRes.json();
      const companiesData = await companiesRes.json();
      const internshipsData = await internshipsRes.json();

      setAssignments(assignmentsData.results || []);
      setStudents(studentsData.results || []);
      setCompanies(companiesData.results || []);
      setInternships(internshipsData.results || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAssignment 
        ? `/api/assignments/${editingAssignment.id}/`
        : '/api/assignments/';
      
      const method = editingAssignment ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      setShowAssignmentForm(false);
      setEditingAssignment(null);
      setFormData({
        student: '',
        company: '',
        internship: '',
        supervisor: '',
        start_date: '',
        end_date: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving assignment:', error);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      student: assignment.student.id,
      company: assignment.company.id,
      internship: assignment.internship?.id || '',
      supervisor: assignment.supervisor?.id || '',
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      notes: assignment.notes || ''
    });
    setShowAssignmentForm(true);
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await fetch(`/api/assignments/${assignmentId}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCompanies = companies.filter(company => company.verification_status === 'approved');
  const filteredInternships = internships.filter(internship => internship.status === 'active');

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
          <h1 className="text-3xl font-bold text-gray-900">Student Assignments</h1>
          <p className="text-gray-600">Manage student internship assignments and supervisor assignments</p>
        </div>
        <button
          onClick={() => setShowAssignmentForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Assignment
        </button>
      </div>

      {/* Assignment Form */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.student}
                    onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.first_name} {student.user.last_name} ({student.student_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  >
                    <option value="">Select Company</option>
                    {filteredCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internship (Optional)</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.internship}
                    onChange={(e) => setFormData({ ...formData, internship: e.target.value })}
                  >
                    <option value="">Select Internship</option>
                    {filteredInternships.map((internship) => (
                      <option key={internship.id} value={internship.id}>
                        {internship.title} at {internship.company.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                  >
                    <option value="">Select Supervisor</option>
                    {/* This would need to be populated with actual supervisors */}
                  </select>
                </div>

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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any additional notes about this assignment..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignmentForm(false);
                    setEditingAssignment(null);
                    setFormData({
                      student: '',
                      company: '',
                      internship: '',
                      supervisor: '',
                      start_date: '',
                      end_date: '',
                      notes: ''
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
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {assignments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {assignment.student?.user?.first_name} {assignment.student?.user?.last_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">
                      {assignment.student?.student_id} • {assignment.student?.department}
                    </p>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Company</p>
                        <p className="text-sm text-gray-600">{assignment.company?.company_name}</p>
                      </div>
                      
                      {assignment.internship && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Internship</p>
                          <p className="text-sm text-gray-600">{assignment.internship.title}</p>
                        </div>
                      )}
                      
                      {assignment.supervisor && (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Supervisor</p>
                          <p className="text-sm text-gray-600">
                            {assignment.supervisor.user?.first_name} {assignment.supervisor.user?.last_name}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">Duration</p>
                        <p className="text-sm text-gray-600">
                          {assignment.start_date} to {assignment.end_date}
                        </p>
                      </div>
                    </div>
                    
                    {assignment.notes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900">Notes</p>
                        <p className="text-sm text-gray-600">{assignment.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first student assignment.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowAssignmentForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Assignment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorStudentAssignments;
