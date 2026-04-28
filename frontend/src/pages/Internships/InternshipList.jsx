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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Internships</h1>
          <p className="text-sm text-gray-600">Browse opportunities and manage placements.</p>
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

      <div className="bg-white p-4 rounded-md border border-gray-200 flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or company"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          {user?.role === 'company' && <option value="draft">Draft</option>}
          <option value="">All</option>
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-gray-600">Loading internships...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-md text-gray-600">No internships found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-md p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.company?.company_name} - {item.location}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 capitalize">{item.status}</span>
              </div>
              <p className="mt-3 text-sm text-gray-700">{item.description}</p>
              <div className="mt-4 text-sm text-gray-600 space-y-1">
                <p>Department: {item.department}</p>
                <p>Deadline: {new Date(item.application_deadline).toLocaleDateString()}</p>
                <p>Stipend: {item.stipend ? `$${item.stipend}` : 'Not specified'}</p>
              </div>
              <div className="mt-4">
                <Link to={`/internships/${item.id}`} className="text-blue-700 hover:text-blue-900 text-sm font-medium">
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white w-full max-w-2xl rounded-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Internship</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="Department" className="px-3 py-2 border border-gray-300 rounded-md" />
                <input required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location" className="px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internship Start Date</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.start_date} 
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                    className="px-3 py-2 border border-gray-300 rounded-md w-full"
                    placeholder="YYYY-MM-DD"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internship End Date</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.end_date} 
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                    className="px-3 py-2 border border-gray-300 rounded-md w-full"
                    placeholder="YYYY-MM-DD"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.application_deadline} 
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })} 
                    className="px-3 py-2 border border-gray-300 rounded-md w-full"
                    placeholder="YYYY-MM-DD"
                    pattern="\d{4}-\d{2}-\d{2}"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <input value={formData.stipend} onChange={(e) => setFormData({ ...formData, stipend: e.target.value })} type="number" placeholder="Stipend (optional)" className="px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <textarea required value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} placeholder="Requirements" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <textarea required value={formData.responsibilities} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })} placeholder="Responsibilities" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => {
                  setShowCreate(false);
                  setSearchParams({});
                }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
