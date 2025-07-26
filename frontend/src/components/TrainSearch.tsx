import React, { useState } from 'react';
import { Search, Train, Clock, MapPin, Route } from 'lucide-react';

interface Train {
  number: string;
  name: string;
  fromStation: string;
  toStation: string;
  departureTime: string;
  arrivalTime: string;
  status: 'on-time' | 'delayed' | 'cancelled';
  platform: string;
}

const TrainSearch: React.FC = () => {
  const [searchType, setSearchType] = useState<'number' | 'name'>('number');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Train[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sample train data - in real app this would come from backend
  const sampleTrains: Train[] = [
    {
      number: '12951',
      name: 'Mumbai Rajdhani Express',
      fromStation: 'New Delhi',
      toStation: 'Mumbai Central',
      departureTime: '16:55',
      arrivalTime: '08:15',
      status: 'on-time',
      platform: '1'
    },
    {
      number: '12301',
      name: 'Rajdhani Express',
      fromStation: 'New Delhi',
      toStation: 'Howrah',
      departureTime: '16:55',
      arrivalTime: '10:00',
      status: 'delayed',
      platform: '2'
    },
    {
      number: '12952',
      name: 'Mumbai Rajdhani Express',
      fromStation: 'Mumbai Central',
      toStation: 'New Delhi',
      departureTime: '16:35',
      arrivalTime: '08:00',
      status: 'on-time',
      platform: '3'
    }
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const results = sampleTrains.filter(train => {
        if (searchType === 'number') {
          return train.number.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          return train.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
      });
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Train Search</h1>
        <p className="text-gray-600">Search for trains by number or name</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSearchType('number')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                searchType === 'number'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Train Number
            </button>
            <button
              onClick={() => setSearchType('name')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Search by train ${searchType === 'number' ? 'number' : 'name'}...`}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{'--tw-ring-color': '#337ab7'} as any}
              />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{backgroundColor: '#337ab7'}}
            onMouseEnter={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#2a6496')}
            onMouseLeave={(e) => !isSearching && (e.currentTarget.style.backgroundColor = '#337ab7')}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Search Results ({searchResults.length})
          </h2>
          
          <div className="space-y-4">
            {searchResults.map((train, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{backgroundColor: '#f0f7ff'}}>
                      <Train className="w-5 h-5" style={{color: '#337ab7'}} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {train.number} - {train.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(train.status)}`}>
                          {train.status.toUpperCase()}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          Platform {train.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Route className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Route</p>
                      <p className="font-medium">{train.fromStation} → {train.toStation}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Departure</p>
                      <p className="font-medium">{train.departureTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-600">Arrival</p>
                      <p className="font-medium">{train.arrivalTime}</p>
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