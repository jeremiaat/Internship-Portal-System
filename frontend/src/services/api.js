import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: (refresh_token) => api.post('/auth/logout/', { refresh_token }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/update/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

export const internshipAPI = {
  getInternships: (params = {}) => api.get('/internships/', { params }),
  getInternship: (id) => api.get(`/internships/${id}/`),
  createInternship: (data) => api.post('/internships/create/', data),
  updateInternship: (id, data) => api.put(`/internships/${id}/update/`, data),
  deleteInternship: (id) => api.delete(`/internships/${id}/delete/`),
  applyToInternship: (id, formData) => api.post(`/internships/${id}/apply/`, formData),
};

export const applicationAPI = {
  getApplications: (params = {}) => api.get('/internships/applications/', { params }),
  getApplication: (id) => api.get(`/internships/applications/${id}/`),
  updateApplicationStatus: (id, data) => api.put(`/internships/applications/${id}/status/`, data),
};

export const reportAPI = {
  getReports: (params = {}) => api.get('/reports/', { params }),
  getReport: (id) => api.get(`/reports/${id}/`),
  createReport: (data) => api.post('/reports/create/', data),
  updateReport: (id, data) => api.put(`/reports/${id}/update/`, data),
  submitReport: (id) => api.post(`/reports/${id}/submit/`),
  uploadReportFile: (id, formData) => api.post(`/reports/${id}/upload-file/`, formData),
};

export const gradeAPI = {
  getGrades: (params = {}) => api.get('/grades/', { params }),
  getGrade: (id) => api.get(`/grades/${id}/`),
  createGrade: (data) => api.post('/grades/create/', data),
  updateGrade: (id, data) => api.put(`/grades/${id}/update/`, data),
  approveGrade: (id) => api.put(`/grades/${id}/approve/`),
  rejectGrade: (id, comments = '') => api.put(`/grades/${id}/reject/`, { comments }),
  getAppeals: (params = {}) => api.get('/grades/appeals/', { params }),
  createAppeal: (data) => api.post('/grades/appeals/create/', data),
};

export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications/', { params }),
  markAsRead: (id) => api.post(`/notifications/${id}/mark-read/`),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
  updatePreferences: (data) => api.put('/notifications/preferences/update/', data),
  getPreferences: () => api.get('/notifications/preferences/'),
};

export const userAPI = {
  getStudents: (params = {}) => api.get('/auth/students/', { params }),
  assignStudentProfileGrade: (studentId, data) => api.put(`/auth/students/${studentId}/profile-grade/`, data),
};

export default api;
