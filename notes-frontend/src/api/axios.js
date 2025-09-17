import axios from 'axios';

import config from '../config/config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 second timeout
  withCredentials: false, // Disable CORS credentials for now
  retry: 3, // Number of retry attempts
  retryDelay: 1000, // Delay between retries in milliseconds
  validateStatus: status => status >= 200 && status < 300, // Only 2xx status codes are valid
  maxRedirects: 5 // Maximum number of redirects to follow
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isAuthRoute = config.url.includes('/auth/');
    
    // For non-auth routes, check token
    if (!isAuthRoute) {
      if (!token || token === 'undefined' || token === 'null') {
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('login')) {
          localStorage.removeItem('token'); // Clear invalid token
          window.location.href = '/login';
          return Promise.reject('Authentication required');
        }
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`, {
      data: response.data
    });
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const status = response?.status;
    const url = config?.url;

    // Handle retry logic for network errors and 5xx responses
    if ((!response || status >= 500) && config && config.retry > 0) {
      config.retry -= 1;
      const backoff = new Promise(resolve => {
        setTimeout(() => resolve(), config.retryDelay || 1000);
      });
      await backoff;
      console.log(`[API] Retrying request to ${url}, ${config.retry} attempts remaining`);
      return api(config);
    }

    // Log error with appropriate message
    const errorMessage = status === 401 || status === 403 ? 'Authentication failed' :
                        status === 404 ? 'Resource not found' :
                        error.code === 'ECONNABORTED' ? 'Request timeout' :
                        !response ? 'Network error' :
                        `Server error (${status})`;

    console.error(`[API] ${errorMessage} from ${url}`, {
      status,
      data: response?.data,
      error: error.message,
      stack: error.stack
    });

    // Handle auth errors
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Add more specific error details to the error object
    error.friendlyMessage = errorMessage;
    error.timestamp = new Date().toISOString();
    error.requestUrl = url;

    return Promise.reject(error);
  }
);

export default api;
