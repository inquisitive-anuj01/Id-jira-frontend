import axios from 'axios';

const api = axios.create({
  // In dev: Vite proxy forwards /api → http://localhost:5001/api
  // In prod: set VITE_API_URL in Vercel or .env
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api'),
  withCredentials: true, // still send cookies if browser supports it
  headers: { 'Content-Type': 'application/json' },
});

// Token helpers
export const saveToken = (token) => {
  if (token) localStorage.setItem('jwt_token', token);
};
export const clearToken = () => localStorage.removeItem('jwt_token');
export const getToken = () => localStorage.getItem('jwt_token');

// Request interceptor — attach token from localStorage as Bearer header
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
