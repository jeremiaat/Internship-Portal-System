import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      // For now, just redirect to login on 401
      // Token refresh can be implemented later if needed
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refresh_token) => api.post('/auth/logout', { refresh_token }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile/update', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const internshipAPI = {
  getInternships: (params = {}) => api.get('/internships', { params }),
  getInternship: (id) => api.get(`/internships/${id}`),
  createInternship: (data) => api.post('/internships', data),
  updateInternship: (id, data) => api.put(`/internships/${id}`, data),
  deleteInternship: (id) => api.delete(`/internships/${id}`),
  applyToInternship: (internshipId, formData) => {
    const resumeValue = formData.get('resume');
    const data = {
      internship_id: internshipId,
      cover_letter: formData.get('cover_letter'),
      resume: (resumeValue && resumeValue !== '') ? resumeValue : null
    };
    return api.post('/applications', data);
  },
};

export const applicationAPI = {
  getApplications: (params = {}) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  updateApplication: (id, data) => api.put(`/applications/${id}/status`, data),
  updateApplicationStatus: (id, data) => api.put(`/applications/${id}/status`, data),
};

export const reportAPI = {
  getReports: (params = {}) => api.get('/reports', { params }),
  getReport: (id) => api.get(`/reports/${id}`),
  createReport: (data) => api.post('/reports', data),
  updateReport: (id, data) => api.put(`/reports/${id}`, data),
  submitReport: (id) => api.post(`/reports/${id}/submit`),
  uploadReportFile: (id, formData) => api.post(`/reports/${id}/upload-file`, formData),
};

export const gradeAPI = {
  getGrades: (params = {}) => api.get('/grades', { params }),
  getGrade: (id) => api.get(`/grades/${id}`),
  createGrade: (data) => api.post('/grades', data),
  updateGrade: (id, data) => api.put(`/grades/${id}`, data),
  approveGrade: (id) => api.put(`/grades/${id}/approve`),
  rejectGrade: (id, comments = '') => api.put(`/grades/${id}/reject`, { comments }),
  getAppeals: (params = {}) => api.get('/grades/appeals', { params }),
  createAppeal: (data) => api.post('/grades/appeals', data),
};

export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
  getPreferences: () => api.get('/notifications/preferences'),
};

export const userAPI = {
  getStudents: (params = {}) => api.get('/auth/students', { params }),
  assignStudentProfileGrade: (studentId, data) => api.put(`/grades/students/${studentId}/profile-grade`, data),
};

export default api;
