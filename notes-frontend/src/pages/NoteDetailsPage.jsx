import { useParams } from 'react-router-dom';

const NoteDetailsPage = () => {
  const { id } = useParams();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Note Details</h1>
          <div className="space-x-4">
            <button className="text-blue-500 hover:text-blue-700">
              Edit
            </button>
            <button className="text-red-500 hover:text-red-700">
              Delete
            </button>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold mb-4">Sample Note Title</h2>
          <p className="text-gray-600">
            This is where the note content will be displayed. The note ID is: {id}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailsPage;
