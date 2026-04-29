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
    const { data } = await api.get(`?${params}`);
    return data;
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
  }
};
