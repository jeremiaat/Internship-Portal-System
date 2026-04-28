import React, { useEffect, useState } from 'react';
import { applicationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const allowedStatus = ['pending', 'reviewed', 'accepted', 'rejected', 'completed'];

const Applications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { status: filter };
      const response = await applicationAPI.getApplications(params);
      setApplications(response.data.results || []);
    } catch (_error) {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await applicationAPI.updateApplicationStatus(id, { status });
      await loadApplications();
    } catch (_error) {
      setError('Failed to update application status.');
    }
  };

  const canReview = user?.role === 'company' || user?.role === 'coordinator' || user?.role === 'registrar';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-600">Track and process internship applications by role.</p>
      </div>

      {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <label className="text-sm text-gray-700 mr-2">Status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="all">All</option>
          {allowedStatus.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-600">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-8 text-center text-gray-600">No applications found.</div>
      ) : (
        <div className="space-y-3">
          {applications.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-md p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.internship?.title}</h3>
                  <p className="text-sm text-gray-600">{item.internship?.company?.company_name} - {item.internship?.location}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Student: {item.student?.user?.first_name} {item.student?.user?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">Applied: {new Date(item.applied_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">
                    CGPA: {item.student?.gpa ?? '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Registrar Updated: {item.student?.profile_grade_updated_at ? new Date(item.student.profile_grade_updated_at).toLocaleDateString() : '-'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 capitalize">{item.status}</span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-800 mb-1">Cover Letter</p>
                <p className="text-sm text-gray-700">{item.cover_letter}</p>
              </div>
              {item.resume && (
                <a href={item.resume} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-blue-700 hover:text-blue-900">
                  View resume
                </a>
              )}
              {canReview && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.status !== 'reviewed' && (
                    <button onClick={() => updateStatus(item.id, 'reviewed')} className="px-3 py-1 text-sm bg-gray-800 text-white rounded-md">
                      Mark Reviewed
                    </button>
                  )}
                  {item.status !== 'accepted' && (
                    <button onClick={() => updateStatus(item.id, 'accepted')} className="px-3 py-1 text-sm bg-green-600 text-white rounded-md">
                      Accept
                    </button>
                  )}
                  {item.status !== 'rejected' && (
                    <button onClick={() => updateStatus(item.id, 'rejected')} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">
                      Reject
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
