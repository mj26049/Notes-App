import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { clearAuth } from '../utils/auth';
import CreateNote from '../components/CreateNote';
import SearchBar from '../components/SearchBar';
import EditNote from '../components/EditNote';
import DeleteConfirmation from '../components/DeleteConfirmation';
import CollaboratorModal from '../components/CollaboratorModal';
import Logo from '../components/Logo';
import Note from '../components/Note';

const NotesPage = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);

  const fetchNotes = async (searchParams = {}) => {
    try {
      setIsLoading(true);
      console.log('Fetching notes with params:', searchParams);
      
      const params = new URLSearchParams();
      
      // Add search parameters
      if (searchParams.query?.trim()) {
        params.append('query', searchParams.query.trim());
      }
      if (searchParams.tags?.trim()) {
        const tagsArray = searchParams.tags.split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
        if (tagsArray.length > 0) {
          params.append('tags', tagsArray.join(','));
        }
      }
      if (searchParams.startDate) {
        params.append('startDate', new Date(searchParams.startDate).toISOString());
      }
      if (searchParams.endDate) {
        params.append('endDate', new Date(searchParams.endDate + 'T23:59:59.999Z').toISOString());
      }

      const endpoint = searchParams.query?.trim() || searchParams.tags?.trim() || 
                      searchParams.startDate || searchParams.endDate
        ? '/notes/search'
        : '/notes';
      
      const response = await api.get(`${endpoint}?${params.toString()}`);
      
      if (Array.isArray(response.data.notes)) {
        setNotes(response.data.notes);
      } else {
        console.warn('Invalid notes data:', response.data);
        setNotes([]);
      }
    } catch (err) {
      console.error('Error fetching notes:', err.response || err);
      if (err.response?.status === 401) {
        console.log('Unauthorized, redirecting to login...');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch notes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current user info
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchNotes();
  }, []);

  const handleNoteCreated = (newNote) => {
    setNotes([newNote, ...notes]);
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes(notes.map(note => 
      note._id === updatedNote._id ? updatedNote : note
    ));
  };

  const handleDeleteNote = async () => {
    if (!deletingNote) return;
    
    setIsDeleting(true);
    setError('');

    try {
      console.log('Deleting note:', deletingNote._id);
      await api.delete(`/notes/${deletingNote._id}`);
      
      // Remove note from UI state and close modal
      setNotes(notes.filter(note => note._id !== deletingNote._id));
      setDeletingNote(null);
      
    } catch (err) {
      console.error('Error deleting note:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete note';
      setError(errorMessage);
      
      // Close delete modal even on error since backend delete might have succeeded
      setDeletingNote(null);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setIsDeleting(false);
    }
  };



  return (
    <div className="min-h-screen bg-study-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo className="transform hover:scale-105 transition-transform" />
            <button
              onClick={async () => {
                await clearAuth();
                navigate('/login');
              }}
              className="text-study-600 hover:text-fox-600 transition-colors text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar onSearch={fetchNotes} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Create Note */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <CreateNote onNoteCreated={handleNoteCreated} />
            </div>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fox-500 to-fox-700 mb-6">
                Your Notes
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <svg className="animate-spin h-8 w-8 mx-auto text-fox-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 text-study-600">
                  <p className="text-lg font-medium">No notes yet</p>
                  <p className="text-sm mt-1">Create your first note to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <Note
                      key={note._id}
                      note={note}
                      onEdit={() => setEditingNote(note)}
                      onDelete={() => setDeletingNote(note)}
                      onShare={() => setSharingNote(note)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {editingNote && (
        <EditNote
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onNoteUpdated={handleNoteUpdated}
        />
      )}

      {deletingNote && (
        <DeleteConfirmation
          note={deletingNote}
          onClose={() => setDeletingNote(null)}
          onConfirm={handleDeleteNote}
          isDeleting={isDeleting}
        />
      )}

      {sharingNote && (
        <CollaboratorModal
          note={sharingNote}
          onClose={() => setSharingNote(null)}
          onCollaboratorAdded={handleNoteUpdated}
        />
      )}
    </div>
  );
};

export default NotesPage;
