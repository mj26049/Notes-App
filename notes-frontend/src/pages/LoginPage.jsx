import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FloatingNotes from '../components/FloatingNotes';
import Logo from '../components/Logo';
import api from '../api/axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login...');
      const response = await api.post('/auth/login', formData);
      console.log('Login successful:', response.data);
      
      // Store token and set up axios defaults
      const token = response.data.token;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      navigate('/notes');
    } catch (err) {
      console.error('Login error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fox-400 via-fox-500 to-fox-600 relative overflow-hidden">
      <FloatingNotes />
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-2xl transform transition-all hover:scale-[1.01] relative z-10 backdrop-blur-sm bg-white/90">
        <div className="mb-8">
          <div className="text-center">
            <Logo className="mx-auto mb-8 transform hover:scale-105 transition-transform" />
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fox-500 to-fox-700">
              Welcome Back!
            </h1>
            <p className="mt-2 text-study-600">
              Please enter your details to continue
            </p>
          </div>
          
          <div className="mt-6 p-5 bg-gradient-to-br from-study-50 to-fox-50 rounded-xl border border-study-100 text-study-600 text-sm">
            <div className="flex items-start space-x-3">
              <span className="text-xl mt-1">🦊</span>
              <div>
                <p className="font-medium text-study-800 mb-1">Your Personal Knowledge Hub</p>
                <p className="leading-relaxed">Capture ideas effortlessly, organize your thoughts with ease, and build your digital library. With seamless collaboration and powerful search, FoxNotes helps you keep everything that matters in one place.</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-fox-500 to-fox-600 hover:from-fox-600 hover:to-fox-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fox-500 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link 
              to="/register" 
              className="text-sm text-study-600 hover:text-fox-600 transition-colors duration-200"
            >
              Don't have an account? <span className="font-semibold">Register</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
