import { useState } from 'react';
import api from '../api/axios';

const CollaboratorModal = ({ note, onClose, onCollaboratorAdded }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Adding collaborator with email:', email);
      const trimmedEmail = email.trim().toLowerCase();
      
      // Check if trying to add self as collaborator
      if (trimmedEmail === note.user.email) {
        setError('You cannot add yourself as a collaborator');
        setIsLoading(false);
        return;
      }

      // Check if collaborator already exists
      if (note.collaborators.some(c => c.email === trimmedEmail)) {
        setError('This user is already a collaborator');
        setIsLoading(false);
        return;
      }

      const response = await api.post(`/notes/${note._id}/collaborators`, {
        email: trimmedEmail
      });

      console.log('Add collaborator response:', {
        status: response.status,
        data: response.data
      });

      if (response.data && response.data.note) {
        setSuccess(response.data.message || 'Collaborator added successfully!');
        onCollaboratorAdded(response.data.note);
        setEmail('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error adding collaborator:', {
        response: err.response?.data,
        status: err.response?.status,
        message: err.message,
        data: err.response?.data
      });

      const errorMessage = err.response?.data?.message ||
        (err.response?.status === 404 ? 'User not found with this email. Make sure they have registered.' :
         err.response?.status === 403 ? 'You do not have permission to add collaborators to this note.' :
         err.response?.status === 400 ? 'Cannot add this user as a collaborator.' :
         !err.response ? 'Network error. Please check your connection.' :
         'Failed to add collaborator. Please try again.');

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fox-500 to-fox-700">
            Add Collaborator
          </h2>
          <button
            onClick={onClose}
            className="text-study-500 hover:text-study-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-study-600">
            Share &quot;{note.title}&quot; with other users by adding their email address.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Collaborator&apos;s Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Enter email address"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-study-700 hover:text-study-900 hover:bg-study-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-study-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-fox-500 to-fox-600 hover:from-fox-600 hover:to-fox-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fox-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </>
              ) : (
                'Add Collaborator'
              )}
            </button>
          </div>
        </form>

        {note.collaborators?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-study-700 mb-2">Current Collaborators</h3>
            <div className="space-y-2">
              {note.collaborators.map((collaborator, index) => (
                <div 
                  key={collaborator._id || index}
                  className="flex items-center justify-between p-2 rounded-lg bg-study-50"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-study-700">{collaborator.username}</span>
                    <span className="text-xs text-study-600">{collaborator.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorModal;
