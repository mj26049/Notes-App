import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FloatingNotes from '../components/FloatingNotes';
import api from '../api/axios';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username can only contain letters, numbers, underscores and hyphens (no spaces)');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 30) {
      setError('Username must be between 3 and 30 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      console.log('Starting registration process...');
      
      const response = await api.post('/auth/register', registerData);
      console.log('Registration successful:', response.data);
      
      if (response.data.success && response.data.token) {
        console.log('Saving token and redirecting to notes page...');
        localStorage.setItem('token', response.data.token);
        // Small delay to ensure token is saved
        setTimeout(() => {
          navigate('/notes');
        }, 100);
      } else {
        console.log('No token received, redirecting to login...');
        navigate('/login', { 
          state: { message: 'Registration successful! Please log in.' } 
        });
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      let errorMessage = 'Failed to register. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message === 'Network Error') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fox-400 via-fox-500 to-fox-600 relative">
      <FloatingNotes />
      <div className="w-full max-w-md px-6 py-8 bg-white rounded-2xl shadow-2xl transform transition-all hover:scale-[1.01] relative z-10 backdrop-blur-sm bg-white/90">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fox-500 to-fox-700">
            Create Account
          </h1>
          <p className="mt-2 text-study-600">
            Join FoxNotes today and start organizing your thoughts.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label 
              htmlFor="name" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="Choose a username"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
              disabled={isLoading}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
              disabled={isLoading}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
              disabled={isLoading}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
              disabled={isLoading}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-fox-500 to-fox-600 hover:from-fox-600 hover:to-fox-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fox-500 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link 
              to="/login" 
              className="text-sm text-study-600 hover:text-fox-600 transition-colors duration-200"
            >
              Already have an account? <span className="font-semibold">Sign in</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
