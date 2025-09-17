const DeleteConfirmation = ({ note, onClose, onConfirm, isDeleting }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md m-4">
        <h3 className="text-xl font-semibold text-study-800 mb-2">Delete Note</h3>
        <p className="text-study-600 mb-6">
          Are you sure you want to delete &quot;{note.title}&quot;? This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-study-700 hover:text-study-900 hover:bg-study-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-study-200"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-white font-medium bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete Note'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
