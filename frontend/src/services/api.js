import axios from 'axios';

const API_BASE = '/api/licenses';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const licenseApi = {
  login: async (credentials) => {
    const { data } = await axios.post(`${API_BASE}/login`, credentials);
    return data;
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    const { data } = await api.get(`?${params}`);
    return data;
  },

  count: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const { data } = await api.get(`/count?${params}`);
    return data.count;
  },

  getById: async (id) => {
    const { data } = await api.get(`/${id}`);
    return data;
  },

  create: async (license) => {
    const { data } = await api.post('', license);
    return data;
  },

  update: async (id, license) => {
    const { data } = await api.put(`/${id}`, license);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/${id}`);
    return data;
  },

  generateKey: async () => {
    const { data } = await api.get('/generate-key');
    return data.key;
  },

  validate: async (key) => {
    const { data } = await api.post('/validate', { key });
    return data;
  },

  // Users
  getUsers: async () => {
    const { data } = await api.get('/users');
    return data;
  },

  createUser: async (user) => {
    const { data } = await api.post('/users', user);
    return data;
  },

  updateUser: async (id, user) => {
    const { data } = await api.put(`/users/${id}`, user);
    return data;
  },

  deleteUser: async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },

  changePassword: async (passwords) => {
    const { data } = await api.post('/users/change-password', passwords);
    return data;
  },

  // Statistics and logs
  getStatistics: async () => {
    const { data } = await api.get('/statistics');
    return data;
  },

  getAuditLogs: async () => {
    const { data } = await api.get('/users/audit-logs');
    return data;
  },

  // Export
  exportCSV: () => {
    window.open(`${API_BASE}/export`, '_blank');
  }
};
