import axios from 'axios';

const API_BASE = '/api/licenses';

export const licenseApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    const { data } = await axios.get(`${API_BASE}?${params}`);
    return data;
  },

  getById: async (id) => {
    const { data } = await axios.get(`${API_BASE}/${id}`);
    return data;
  },

  create: async (license) => {
    const { data } = await axios.post(API_BASE, license);
    return data;
  },

  update: async (id, license) => {
    const { data } = await axios.put(`${API_BASE}/${id}`, license);
    return data;
  },

  delete: async (id) => {
    const { data } = await axios.delete(`${API_BASE}/${id}`);
    return data;
  },

  generateKey: async () => {
    const { data } = await axios.get(`${API_BASE}/generate-key`);
    return data.key;
  },

  validate: async (key) => {
    const { data } = await axios.post(`${API_BASE}/validate`, { key });
    return data;
  }
};
