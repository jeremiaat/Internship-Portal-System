import React, { useEffect, useState } from 'react';
import { applicationAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const statusOptions = ['draft', 'submitted', 'reviewed', 'approved', 'rejected'];

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    application_id: '',
    report_type: 'weekly',
    title: '',
    content: '',
    file: null,
  });

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { status: filter };
      console.log('Fetching reports with params:', params);
      const response = await reportAPI.getReports(params);
      console.log('Reports API response:', response.data);
      const reportsData = response.data.results || [];
      console.log('Setting reports:', reportsData);
      setReports(reportsData);
    } catch (_error) {
      console.error('Error loading reports:', _error);
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    if (user?.role !== 'student') return;
    try {
      const response = await applicationAPI.getApplications();
      setApplications(response.data.results || []);
    } catch (_error) {
      setApplications([]);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filter]);

  useEffect(() => {
    loadApplications();
  }, [user?.role]);

  const createReport = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('application_id', formData.application_id);
      payload.append('report_type', formData.report_type);
      payload.append('title', formData.title);
      payload.append('content', formData.content);
      if (formData.file) payload.append('file', formData.file);
      await reportAPI.createReport(payload);
      setShowCreate(false);
      setFormData({ application_id: '', report_type: 'weekly', title: '', content: '', file: null });
      await loadReports();
    } catch (_error) {
      setError('Failed to create report.');
    }
  };

  const submitReport = async (id) => {
    try {
      await reportAPI.submitReport(id);
      await loadReports();
    } catch (_error) {
      setError('Failed to submit report.');
    }
  };

  const updateReportStatus = async (id, status) => {
    try {
      await reportAPI.updateReport(id, { status });
      await loadReports();
    } catch (_error) {
      setError('Failed to update report status.');
    }
  };

  const canReview = user?.role === 'company' || user?.role === 'coordinator';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600">Submit progress reports and review submissions.</p>
        </div>
        {user?.role === 'student' && (
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            New Report
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <label className="text-sm text-gray-700 mr-2">Status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="all">All</option>
          {statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-600">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-8 text-center text-gray-600">No reports found.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-md p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.report_type} report - {item.application?.internship?.title}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 capitalize">{item.status}</span>
              </div>
              <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
              {item.file && (
                <a href={item.file} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-blue-700 hover:text-blue-900">
                  Open attached file
                </a>
              )}
              <div className="mt-3 text-xs text-gray-500">Updated: {new Date(item.updated_at).toLocaleString()}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {user?.role === 'student' && item.status === 'draft' && (
                  <button onClick={() => submitReport(item.id)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                    Submit
                  </button>
                )}
                {canReview && item.status === 'submitted' && (
                  <>
                    <button onClick={() => updateReportStatus(item.id, 'reviewed')} className="px-3 py-1 text-sm bg-gray-800 text-white rounded-md">
                      Mark Reviewed
                    </button>
                    <button onClick={() => updateReportStatus(item.id, 'approved')} className="px-3 py-1 text-sm bg-green-600 text-white rounded-md">
                      Approve
                    </button>
                    <button onClick={() => updateReportStatus(item.id, 'rejected')} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white w-full max-w-xl rounded-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Report</h2>
            <form onSubmit={createReport} className="space-y-3">
              <select
                required
                value={formData.application_id}
                onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.internship?.title} - {app.internship?.company?.company_name}
                  </option>
                ))}
              </select>
              <select value={formData.report_type} onChange={(e) => setFormData({ ...formData, report_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="final">Final</option>
              </select>
              <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Report title" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <textarea required rows={7} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Report content" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input type="file" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-md">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
