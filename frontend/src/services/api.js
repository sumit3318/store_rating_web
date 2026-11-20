import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired (401) on a normal request, clear it and go to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthCheck = url.includes('/auth/login') || url.includes('/auth/me');
    if (error.response?.status === 401 && !isAuthCheck) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Message to show in an alert/toast.
export function getErrorMessage(error) {
  if (!error.response) return 'Cannot reach the server. Is the backend running?';
  return error.response.data?.message || 'Something went wrong';
}

// { fieldName: message } from a 400 validation response.
export function getFieldErrors(error) {
  return error.response?.data?.errors || {};
}

export default api;
