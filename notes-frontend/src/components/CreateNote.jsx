import { useState } from 'react';
import api from '../api/axios';

const CreateNote = ({ onNoteCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState({
    title: '',
    content: '',
    tags: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Creating note with data:', note);
      
      // Convert tags string to array and remove empty strings
      const tagsArray = note.tags && note.tags.trim()
        ? note.tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        : [];

      const requestData = {
        title: note.title.trim(),
        content: note.content.trim(),
        tags: tagsArray
      };

      console.log('Sending request with data:', requestData);

      const response = await api.post('/notes', requestData);

      console.log('Note created successfully:', response.data);

      // Reset form
      setNote({ title: '', content: '', tags: '' });
      
      // Notify parent component
      if (onNoteCreated && response.data.note) {
        onNoteCreated(response.data.note);
      } else {
        console.error('No note data in response:', response.data);
        throw new Error('Failed to create note: Invalid response format');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fox-500 to-fox-700">
          Create New Note
        </h2>
        <p className="text-study-600 text-sm mt-1">
          Capture your thoughts, ideas, and knowledge
        </p>
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
            placeholder="Enter note title"
            className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
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
            placeholder="Write your note content..."
            rows="6"
            className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400 resize-none"
            value={note.content}
            onChange={(e) => setNote({ ...note, content: e.target.value })}
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
            className="w-full px-4 py-3 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent outline-none transition-all placeholder:text-study-400"
            value={note.tags}
            onChange={(e) => setNote({ ...note, tags: e.target.value })}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-study-500">
            Example: work, ideas, todo
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-fox-500 to-fox-600 hover:from-fox-600 hover:to-fox-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fox-500 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Note
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNote;
