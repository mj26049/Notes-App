import { useState } from 'react';

const Note = ({ note, onEdit, onDelete, onShare }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-study-800">{note.title}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onShare(note)}
              className="p-2 text-study-600 hover:text-blue-600 transition-colors rounded-full hover:bg-study-50"
              title="Share note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(note)}
              className="p-2 text-study-600 hover:text-fox-600 transition-colors rounded-full hover:bg-study-50"
              title="Edit note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(note)}
              className="p-2 text-study-600 hover:text-red-600 transition-colors rounded-full hover:bg-study-50"
              title="Delete note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Note content */}
        <div className="prose prose-study max-w-none">
          <p className="text-study-600 whitespace-pre-wrap">{note.content}</p>
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium text-fox-700 bg-fox-50 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Last updated */}
        <div className="mt-4 text-right">
          <span className="text-xs text-study-500">
            Last updated: {new Date(note.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Note;
