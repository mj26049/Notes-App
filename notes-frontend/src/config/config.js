// API configuration
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  environment: import.meta.env.MODE || 'development'
};

export default config;
