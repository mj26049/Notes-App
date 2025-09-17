import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const SearchBar = ({ onSearch }) => {
  const [searchParams, setSearchParams] = useState({
    query: '',
    tags: '',
    startDate: '',
    endDate: '',
  });
  const [debouncedSearching, setDebouncedSearching] = useState(false);

  // Create a debounced search function
  const debouncedSearch = debounce((params) => {
    console.log('Executing search with params:', params);
    onSearch(params);
    setDebouncedSearching(false);
  }, 500);

  // Effect to load all notes when component mounts
  useEffect(() => {
    console.log('Initial load of all notes');
    onSearch({}); // Load all notes initially
    return () => debouncedSearch.cancel(); // Cleanup
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Search param changed: ${name} = ${value}`);
    
    const newParams = { ...searchParams, [name]: value };
    setSearchParams(newParams);
    setDebouncedSearching(true);
    
    // Cancel any pending debounced searches
    debouncedSearch.cancel();

    // Check if all search fields are empty
    const hasAnyValue = Object.values(newParams).some(val => 
      typeof val === 'string' && val.trim() !== ''
    );
    
    if (!hasAnyValue) {
      console.log('All search fields empty, loading all notes');
      setDebouncedSearching(false);
      onSearch({});
    } else {
      console.log('Triggering debounced search with params:', newParams);
      debouncedSearch(newParams);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-study-800 mb-4">Search Notes</h3>
      <div className="space-y-4">
        {/* Text Search */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="query" className="block text-sm font-medium text-study-700">
              Search Text
            </label>
            {debouncedSearching && (
              <span className="text-xs text-study-500">Searching...</span>
            )}
          </div>
          <input
            id="query"
            name="query"
            type="text"
            placeholder="Search in titles and content..."
            className="w-full px-4 py-2 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
            value={searchParams.query}
            onChange={handleChange}
          />
        </div>

        {/* Tags Search */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-study-700 mb-1">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="Search by tags (comma separated)..."
            className="w-full px-4 py-2 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
            value={searchParams.tags}
            onChange={handleChange}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-study-700 mb-1">
              From Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
              value={searchParams.startDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-study-700 mb-1">
              To Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-study-200 focus:ring-2 focus:ring-fox-500 focus:border-transparent"
              value={searchParams.endDate}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
