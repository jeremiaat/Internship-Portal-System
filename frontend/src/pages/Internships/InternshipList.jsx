import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { internshipAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = {
  title: '',
  description: '',
  department: 'Computer Science',
  location: '',
  start_date: '',
  end_date: '',
  application_deadline: '',
  requirements: '',
  responsibilities: '',
  stipend: '',
  status: 'active',
};

const InternshipList = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadInternships = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const response = await internshipAPI.getInternships(params);
      setInternships(response.data.results || []);
    } catch (_error) {
      setError('Failed to load internships.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInternships();
  }, [search, status]);

  useEffect(() => {
    if (user?.role === 'company' && searchParams.get('create') === '1') {
      setShowCreate(true);
    }
  }, [user?.role, searchParams]);

  const filtered = useMemo(() => {
    if (user?.role !== 'company' || !user?.profile_data?.id) return internships;
    return internships.filter((item) => item.company?.id === user.profile_data.id);
  }, [internships, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await internshipAPI.createInternship({
        ...formData,
        stipend: formData.stipend ? Number(formData.stipend) : null,
      });
      setFormData(emptyForm);
      setShowCreate(false);
      setSearchParams({});
      await loadInternships();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create internship.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Internships</h1>
          <p className="text-gray-500 mt-1">Browse opportunities and manage placements</p>
        </div>
        {user?.role === 'company' && (
          <button
            onClick={() => {
              setShowCreate(true);
              setSearchParams({});
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Post Internship
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or company"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          {user?.role === 'company' && <option value="draft">Draft</option>}
          <option value="">All</option>
        </select>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading internships...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-xl text-gray-500">No internships found</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.company?.company_name} • {item.location}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">{item.status}</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">{item.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{item.department}</span>
                <span>•</span>
                <span>Deadline: {new Date(item.application_deadline).toLocaleDateString()}</span>
                <span>•</span>
                <span>{item.stipend ? `$${item.stipend}/mo` : 'No stipend'}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link to={`/internships/${item.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl border border-gray-200 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Post Internship</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Software Development Intern" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the internship role and what the intern will learn..." rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., Computer Science" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., New York, NY or Remote" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.end_date} 
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.application_deadline} 
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })} 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stipend (optional)</label>
                <input value={formData.stipend} onChange={(e) => setFormData({ ...formData, stipend: e.target.value })} type="number" placeholder="e.g., 1500" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea required value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="List required skills, education level, and experience..." rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                <textarea required value={formData.responsibilities} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })} placeholder="Describe day-to-day responsibilities and tasks..." rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => {
                  setShowCreate(false);
                  setSearchParams({});
                }} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipList;
