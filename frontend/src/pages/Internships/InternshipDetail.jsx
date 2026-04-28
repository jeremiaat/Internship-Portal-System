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
        const apps = await applicationAPI.getApplications({ internship: id });
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
    <div className="space-y-6">
      <button onClick={() => navigate('/internships')} className="text-sm text-blue-700 hover:text-blue-900">
        Back to internships
      </button>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{internship.title}</h1>
            <p className="text-sm text-gray-600">{internship.company?.company_name} - {internship.location}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 capitalize">{internship.status}</span>
        </div>
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{internship.description}</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h2>
              <p className="text-gray-700">{internship.requirements}</p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h2>
              <p className="text-gray-700">{internship.responsibilities}</p>
            </section>
          </div>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Department:</span> {internship.department}</p>
            <p><span className="font-medium">Start:</span> {new Date(internship.start_date).toLocaleDateString()}</p>
            <p><span className="font-medium">End:</span> {new Date(internship.end_date).toLocaleDateString()}</p>
            <p><span className="font-medium">Deadline:</span> {new Date(internship.application_deadline).toLocaleDateString()}</p>
            <p><span className="font-medium">Stipend:</span> {internship.stipend ? `$${internship.stipend}` : 'Not specified'}</p>
            {canApply && (
              <button onClick={() => setShowForm(true)} className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Apply Now
              </button>
            )}
            {hasApplied && (
              <div className="mt-3 p-2 text-sm bg-green-50 border border-green-200 text-green-700 rounded-md">Application submitted</div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white w-full max-w-xl rounded-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Application</h2>
            <form onSubmit={handleApply} className="space-y-3">
              <textarea
                required
                rows={7}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Write your cover letter"
              />
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md">
                  Cancel
                </button>
                <button disabled={submitting} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
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
