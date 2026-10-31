import axios from 'axios';

const api = axios.create({
  baseURL: 'http://100.126.173.43:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to inject Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional hook for session expiration
    }
    return Promise.reject(error);
  }
);

export default api;
