import { useState, useEffect } from 'react';
import api from '../api/axios';

const EditNote = ({ note, onClose, onNoteUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: note.title,
    content: note.content,
    tags: Array.isArray(note.tags) ? note.tags.join(', ') : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Updating note:', note._id);
      
      // Convert tags string to array and remove empty strings
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

      const response = await api.put(`/notes/${note._id}`, {
        title: formData.title,
        content: formData.content,
        tags: tagsArray
      });

      console.log('Update response:', response.data);

      if (response.data.note) {
        // Notify parent component
        onNoteUpdated(response.data.note);
        onClose();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Edit note error:', err);
      setError(err.response?.data?.message || 'Failed to update note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fox-500 to-fox-700">
            Edit Note
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

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="title" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label 
              htmlFor="content" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Content
            </label>
            <textarea
              id="content"
              required
              rows="6"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent resize-none"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div>
            <label 
              htmlFor="tags" 
              className="block text-sm font-medium text-study-700 mb-1"
            >
              Tags
            </label>
            <input
              id="tags"
              type="text"
              placeholder="Enter tags separated by commas"
              className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-study-500">
              Example: work, ideas, todo
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-medium text-study-700 hover:text-study-900 hover:bg-study-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-study-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-fox-500 to-fox-600 hover:from-fox-600 hover:to-fox-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fox-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNote;
