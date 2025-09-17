import api from '../api/axios';

export const checkAuth = () => {
  const token = localStorage.getItem('token');
  return token && token !== 'undefined' && token !== 'null';
};

export const clearAuth = async () => {
  try {
    if (checkAuth()) {
      // Call the logout API endpoint
      await api.post('/auth/logout');
    }
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Clear all auth state regardless of API call success
    localStorage.removeItem('token');
    
    // Clear any pending requests
    api.interceptors.request.clear();
    api.interceptors.response.clear();
    
    // Force redirect to login page
    window.location.href = '/login';
  }
};

export const setAuth = (token) => {
  localStorage.setItem('token', token);
};
