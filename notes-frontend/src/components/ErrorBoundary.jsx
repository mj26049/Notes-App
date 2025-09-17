import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-study-50 px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-study-800 mb-4">Oops! Something went wrong</h1>
            <p className="text-study-600 mb-8">We're sorry for the inconvenience. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-fox-500 to-fox-600 hover:from-fox-600 hover:to-fox-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fox-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
