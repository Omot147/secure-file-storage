import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

// Attach the JWT from localStorage to every outgoing request automatically —
// so components never have to remember to do this themselves.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
export { API_BASE_URL };
