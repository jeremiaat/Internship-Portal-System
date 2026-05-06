import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { internshipAPI, applicationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const InternshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [internship, setInternship] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const details = await internshipAPI.getInternship(id);
      setInternship(details.data);

      if (user?.role === 'student') {
        const apps = await applicationAPI.getApplications({ internship_id: id });
        const exists = (apps.data.results || []).some((item) => item.internship?.id === Number(id));
        setHasApplied(exists);
      }
    } catch (_error) {
      setError('Failed to load internship details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.role]);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('cover_letter', coverLetter);
      if (resume) data.append('resume', resume);
      await internshipAPI.applyToInternship(id, data);
      setShowForm(false);
      setCoverLetter('');
      setResume(null);
      setHasApplied(true);
      // Fetch notifications to show the new application notification
      fetchNotifications();
    } catch (err) {
      setError(err?.response?.data?.error || 'Application failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading details...</div>;
  if (!internship) return <div className="p-8 text-center text-gray-600">Internship not found.</div>;

  const canApply = user?.role === 'student' && !hasApplied && internship.status === 'active';

  return (
    <div className="space-y-8">
      <button onClick={() => navigate('/internships')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
        ← Back to internships
      </button>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{internship.title}</h1>
            <p className="text-gray-500 mt-2">{internship.company?.company_name} • {internship.location}</p>
          </div>
          <span className="text-sm px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">{internship.status}</span>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{internship.description}</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h2>
              <p className="text-gray-600 leading-relaxed">{internship.requirements}</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h2>
              <p className="text-gray-600 leading-relaxed">{internship.responsibilities}</p>
            </section>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Department</span>
                <span className="text-sm font-medium text-gray-900">{internship.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Start Date</span>
                <span className="text-sm font-medium text-gray-900">{new Date(internship.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">End Date</span>
                <span className="text-sm font-medium text-gray-900">{new Date(internship.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Deadline</span>
                <span className="text-sm font-medium text-gray-900">{new Date(internship.application_deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Stipend</span>
                <span className="text-sm font-medium text-gray-900">{internship.stipend ? `$${internship.stipend}/mo` : 'Not specified'}</span>
              </div>
            </div>
            {canApply && (
              <button onClick={() => setShowForm(true)} className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                Apply Now
              </button>
            )}
            {hasApplied && (
              <div className="mt-6 p-3 text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg text-center font-medium">Application submitted</div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-xl rounded-xl border border-gray-200 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit Application</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <textarea
                  required
                  rows={7}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your cover letter explaining why you're interested in this position..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume (optional)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] || null)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, DOC, DOCX</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button disabled={submitting} type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternshipDetail;
