import React, { useState, useEffect } from 'react';
import { Search, Train, MapPin, X, Check, Volume2, Route } from 'lucide-react';

interface Train {
  id: number;
  train_number: string;
  train_name_en: string;
  start_station_en: string;
  start_station_code: string;
  end_station_en: string;
  end_station_code: string;
  created_at: string;
  updated_at?: string;
}

interface AnnouncementCategory {
  id: number;
  category_code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const TrainSearch: React.FC = () => {
  const [searchType, setSearchType] = useState<'number' | 'name'>('number');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Train[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [platformValues, setPlatformValues] = useState<{ [key: number]: string }>({});
  const [categoryValues, setCategoryValues] = useState<{ [key: number]: number }>({});
  const [announcementCategories, setAnnouncementCategories] = useState<AnnouncementCategory[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allRoutes, setAllRoutes] = useState<Train[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [routesPerPage] = useState(5);
  const [totalRoutes, setTotalRoutes] = useState(0);

  const handleSearch = async () => {
    console.log('handleSearch called with query:', searchQuery);
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      const response = await fetch(`http://localhost:5001/api/v1/train-routes/search/?query=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        // Initialize platform values with default "1" for new results
        const newPlatformValues: { [key: number]: string } = {};
        const newCategoryValues: { [key: number]: number } = {};
        results.forEach((train: Train) => {
          newPlatformValues[train.id] = platformValues[train.id] || "1";
          newCategoryValues[train.id] = categoryValues[train.id] || (announcementCategories.length > 0 ? announcementCategories[0].id : 0);
        });
        setPlatformValues(newPlatformValues);
        setCategoryValues(newCategoryValues);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlatformChange = (trainId: number, value: string) => {
    setPlatformValues(prev => ({
      ...prev,
      [trainId]: value
    }));
  };

  const handleCategoryChange = (trainId: number, categoryId: number) => {
    setCategoryValues(prev => ({
      ...prev,
      [trainId]: categoryId
    }));
  };

  const fetchAnnouncementCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/announcements/categories');
      
      if (response.ok) {
        const data = await response.json();
        setAnnouncementCategories(data.categories || []);
      } else {
        console.error('Failed to fetch announcement categories');
      }
    } catch (error) {
      console.error('Error fetching announcement categories:', error);
    }
  };

  const fetchAllRoutes = async (page: number = 1) => {
    setIsLoadingRoutes(true);
    try {
      const response = await fetch(`http://localhost:5001/api/v1/train-routes/?skip=${(page - 1) * routesPerPage}&limit=${routesPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setAllRoutes(data.routes || []);
        setTotalRoutes(data.total || 0);
        setCurrentPage(page);
      } else {
        console.error('Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const handlePickRoute = () => {
    setIsModalOpen(true);
    setCurrentPage(1);
    fetchAllRoutes(1);
  };

  const handleRouteSelection = (routeId: number) => {
    setSelectedRoutes(prev => 
      prev.includes(routeId) 
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const handleApplySelection = () => {
    // Get all selected routes from all pages by fetching them individually
    const fetchSelectedRoutes = async () => {
      const selectedTrainData: Train[] = [];
      
      // Group selected route IDs by page to minimize API calls
      const routeIds = [...selectedRoutes];
      
      // Fetch all selected routes in batches
      for (let i = 0; i < routeIds.length; i += routesPerPage) {
        const batch = routeIds.slice(i, i + routesPerPage);
        try {
          const response = await fetch(`http://localhost:5001/api/v1/train-routes/?limit=1000`);
          if (response.ok) {
            const data = await response.json();
            const allRoutesData = data.routes || [];
            const batchRoutes = allRoutesData.filter((route: Train) => batch.includes(route.id));
            selectedTrainData.push(...batchRoutes);
          }
        } catch (error) {
          console.error('Error fetching selected routes:', error);
        }
      }
      
      setSearchResults(selectedTrainData);
      
      // Initialize platform and category values for selected routes
      const newPlatformValues: { [key: number]: string } = {};
      const newCategoryValues: { [key: number]: number } = {};
      selectedTrainData.forEach((train: Train) => {
        newPlatformValues[train.id] = platformValues[train.id] || "1";
        newCategoryValues[train.id] = categoryValues[train.id] || (announcementCategories.length > 0 ? announcementCategories[0].id : 0);
      });
      setPlatformValues(newPlatformValues);
      setCategoryValues(newCategoryValues);
      
      setIsModalOpen(false);
      setSelectedRoutes([]);
    };
    
    fetchSelectedRoutes();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoutes([]);
  };

  const handlePageChange = (page: number) => {
    fetchAllRoutes(page);
  };

  const totalPages = Math.ceil(totalRoutes / routesPerPage);

  // Fetch announcement categories on component mount
  useEffect(() => {
    fetchAnnouncementCategories();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Train Search</h1>
        <p className="text-gray-600">Search for trains by number or name</p>
      </div>

            {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Type Toggle */}
          <div className="flex bg-gray-100 rounded p-1">
            <button
              onClick={() => setSearchType('number')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                searchType === 'number'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Train Number
            </button>
              <button
                onClick={() => setSearchType('name')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  searchType === 'name'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Train Name
              </button>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by train ${searchType === 'number' ? 'number' : 'name'}...`}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:border-transparent text-sm"
                style={{'--tw-ring-color': '#337ab7'} as any}
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 text-white text-xs font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#337ab7'}}
            onMouseEnter={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#2a6496')}
            onMouseLeave={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#337ab7')}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          
          {/* Pick Route Button */}
          <button
            onClick={handlePickRoute}
            className="px-4 py-2 text-white text-xs font-medium transition-colors duration-200"
            style={{backgroundColor: '#28a745'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            Pick Route
          </button>
          
          {/* Clear Button */}
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setPlatformValues({});
              setCategoryValues({});
            }}
            disabled={isSearching && !searchQuery && searchResults.length === 0}
            className="ml-2 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 transition-colors duration-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Route Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[70vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Select Train Routes</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingRoutes ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading routes...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 bg-gray-50 w-8">
                          <input
                            type="checkbox"
                            checked={selectedRoutes.length === allRoutes.length && allRoutes.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoutes(prev => [...new Set([...prev, ...allRoutes.map(route => route.id)])]);
                              } else {
                                setSelectedRoutes(prev => prev.filter(id => !allRoutes.map(route => route.id).includes(id)));
                              }
                            }}
                            className="w-3 h-3"
                          />
                        </th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 bg-gray-50">Train Number</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 bg-gray-50">Train Name</th>
                        <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700 bg-gray-50">Route</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allRoutes.map((route) => (
                        <tr 
                          key={route.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                          onClick={() => handleRouteSelection(route.id)}
                        >
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={selectedRoutes.includes(route.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleRouteSelection(route.id);
                              }}
                              className="w-3 h-3"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center space-x-1">
                              <div className="flex items-center justify-center w-4 h-4 rounded-full" style={{backgroundColor: '#f0f7ff'}}>
                                <Train className="w-2 h-2" style={{color: '#337ab7'}} />
                              </div>
                              <span className="font-mono font-semibold text-xs text-gray-800">{route.train_number}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <span className="font-medium text-xs text-gray-800">{route.train_name_en}</span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <span>{route.start_station_en}</span>
                              <span>→</span>
                              <span>{route.end_station_en}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!isLoadingRoutes && totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <div className="text-xs text-gray-600">
                  Showing {((currentPage - 1) * routesPerPage) + 1} to {Math.min(currentPage * routesPerPage, totalRoutes)} of {totalRoutes} routes
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-2 py-1 text-xs rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                {selectedRoutes.length} route{selectedRoutes.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCloseModal}
                  className="px-3 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplySelection}
                  disabled={selectedRoutes.length === 0}
                  className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">
            Search Results ({searchResults.length})
          </h2>
          
          {/* Cards List */}
          <div className="space-y-3">
            {searchResults.map((train, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-end justify-between w-full">
                  {/* Left side - Train info */}
                  <div className="flex items-end space-x-8 flex-1">
                    {/* Train Number */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-gray-500 font-medium mb-1">Train #</span>
                      <span className="font-mono font-semibold text-sm text-gray-800">{train.train_number}</span>
                    </div>

                    {/* Train Name */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs text-gray-500 font-medium mb-1">Train Name</span>
                      <span className="font-medium text-sm text-gray-800 truncate">{train.train_name_en}</span>
                    </div>

                    {/* Route */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs text-gray-500 font-medium mb-1">Route</span>
                      <div className="relative group">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600 truncate">{train.start_station_en}</span>
                          <span className="text-sm text-gray-400 flex-shrink-0">→</span>
                          <span className="text-sm text-gray-600 truncate">{train.end_station_en}</span>
                        </div>
                        <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          {train.start_station_en} → {train.end_station_en}
                          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>

                    {/* Platform */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-gray-500 font-medium mb-1">Platform</span>
                      <input
                        type="text"
                        value={platformValues[train.id] || "1"}
                        onChange={(e) => handlePlatformChange(train.id, e.target.value)}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:border-blue-500 focus:outline-none"
                        placeholder="1"
                      />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-gray-500 font-medium mb-1">Category</span>
                      <select
                        value={categoryValues[train.id] || (announcementCategories.length > 0 ? announcementCategories[0].id : '')}
                        onChange={(e) => handleCategoryChange(train.id, Number(e.target.value))}
                        className="w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:border-blue-500 focus:outline-none"
                      >
                        {announcementCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.category_code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right side - Action */}
                  <div className="flex items-end ml-4 flex-shrink-0">
                    <div className="relative group">
                      <button
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 rounded-lg hover:bg-blue-50"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Generate Announcement
                        <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <Train className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">No trains found</h3>
          <p className="text-gray-600">Try searching with different keywords</p>
        </div>
      )}
    </div>
  );
};

export default TrainSearch; 