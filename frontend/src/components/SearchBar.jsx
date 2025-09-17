const SearchBar = () => {
  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        type="text"
        placeholder="Search notes..."
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
};

export default SearchBar;
