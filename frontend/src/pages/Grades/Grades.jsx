import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

const defaultForm = {
  gpa: '',
};

const Grades = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const isRegistrar = user?.role === 'registrar';

  const loadStudents = async () => {
    if (!isRegistrar) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await userAPI.getStudents();
      setStudents(response.data.results || response.data || []);
    } catch (errorResponse) {
      setError(errorResponse?.response?.data?.detail || 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [isRegistrar]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) => {
      const fullName = `${student.user?.first_name || ''} ${student.user?.last_name || ''}`.toLowerCase();
      return (
        fullName.includes(query) ||
        (student.student_id || '').toLowerCase().includes(query) ||
        (student.department || '').toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setForm({
      gpa: student.gpa ?? '',
    });
    setShowAssignModal(true);
  };

  const saveProfileGrade = async (event) => {
    event.preventDefault();
    if (!selectedStudent) return;
    try {
      setSaving(true);
      await userAPI.assignStudentProfileGrade(selectedStudent.id, {
        gpa: Number(form.gpa),
      });
      setShowAssignModal(false);
      setSelectedStudent(null);
      setForm(defaultForm);
      await loadStudents();
    } catch (errorResponse) {
      setError(errorResponse?.response?.data?.error || 'Failed to assign profile grade.');
    } finally {
      setSaving(false);
    }
  };

  if (!isRegistrar) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {user?.first_name} {user?.last_name}
          </h3>
        </div>

        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Student ID:</span> {user?.profile_data?.student_id}</div>
          <div><span className="font-medium">Department:</span> {user?.profile_data?.department}</div>
          <div><span className="font-medium">CGPA:</span> {user?.profile_data?.gpa ?? '-'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Student Profile Grades</h1>
        <p className="text-sm text-gray-600">Assign and update grades directly on student profiles.</p>
      </div>

      {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by student name, id or department"
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-600">Loading students...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">CGPA</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">{student.user?.first_name} {student.user?.last_name}</td>
                  <td className="py-3 px-4">{student.student_id}</td>
                  <td className="py-3 px-4">{student.department}</td>
                  <td className="py-3 px-4">
                    {student.gpa ?? '-'}
                  </td>
                  <td className="py-3 px-4">{student.profile_grade_updated_at ? new Date(student.profile_grade_updated_at).toLocaleDateString() : '-'}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openAssignModal(student)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Assign Grade
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="bg-white w-full max-w-xl rounded-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Assign Profile Grade</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedStudent.user?.first_name} {selectedStudent.user?.last_name} ({selectedStudent.student_id})
            </p>
            <form onSubmit={saveProfileGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  required
                  value={form.gpa}
                  onChange={(event) => setForm({ ...form, gpa: event.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter CGPA (0-4)"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 border border-gray-300 rounded-md">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
