import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ntw_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for response handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    
    // Auto logout on 401 if token expired/invalid
    if (error.response?.status === 401 && localStorage.getItem('ntw_token')) {
      localStorage.removeItem('ntw_token');
      localStorage.removeItem('ntw_user');
      if (!window.location.pathname.startsWith('/signin')) {
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;
