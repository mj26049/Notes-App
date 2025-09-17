import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from './pages/RegisterPage';
import NotesPage from './pages/NotesPage';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = token && token !== 'undefined' && token !== 'null';
  
  if (!isAuthenticated) {
    // Clear any invalid token
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  // Check token validity on app load
  const token = localStorage.getItem('token');
  const isAuthenticated = token && token !== 'undefined' && token !== 'null';
  
  // Clear invalid tokens
  if (token && !isAuthenticated) {
    localStorage.removeItem('token');
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-study-50">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/notes" /> : <LoginPage />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/notes" /> : <RegisterPage />
              } 
            />
            <Route 
              path="/notes" 
              element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to="/login" />}
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
