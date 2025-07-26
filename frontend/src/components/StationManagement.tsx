import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import StationModal from './StationModal';

interface Station {
  id: string;
  code: string;
  name: string;
  state: string;
  zone: string;
}

const StationManagement: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  useEffect(() => {
    const savedStations = localStorage.getItem('railway_stations');
    if (savedStations) {
      setStations(JSON.parse(savedStations));
    } else {
      // Default stations
      const defaultStations: Station[] = [
        { id: '1', code: 'NDLS', name: 'New Delhi', state: 'Delhi', zone: 'Northern Railway' },
        { id: '2', code: 'CST', name: 'Chhatrapati Shivaji Terminus', state: 'Maharashtra', zone: 'Central Railway' },
        { id: '3', code: 'HWH', name: 'Howrah Junction', state: 'West Bengal', zone: 'Eastern Railway' },
        { id: '4', code: 'MAS', name: 'Chennai Central', state: 'Tamil Nadu', zone: 'Southern Railway' },
      ];
      setStations(defaultStations);
      localStorage.setItem('railway_stations', JSON.stringify(defaultStations));
    }
  }, []);

  const saveStations = (updatedStations: Station[]) => {
    setStations(updatedStations);
    localStorage.setItem('railway_stations', JSON.stringify(updatedStations));
  };

  const handleAddStation = (stationData: Omit<Station, 'id'>) => {
    const newStation: Station = {
      ...stationData,
      id: Date.now().toString(),
    };
    const updatedStations = [...stations, newStation];
    saveStations(updatedStations);
    setIsModalOpen(false);
  };

  const handleEditStation = (stationData: Omit<Station, 'id'>) => {
    if (editingStation) {
      const updatedStations = stations.map(station =>
        station.id === editingStation.id
          ? { ...stationData, id: editingStation.id }
          : station
      );
      saveStations(updatedStations);
      setEditingStation(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteStation = (id: string) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      const updatedStations = stations.filter(station => station.id !== id);
      saveStations(updatedStations);
    }
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Station Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center"
          style={{backgroundColor: '#337ab7'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a6496'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Station
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Station Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Station Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">State</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Zone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((station) => (
                <tr key={station.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-mono font-bold" style={{color: '#337ab7'}}>{station.code}</td>
                  <td className="py-4 px-4">{station.name}</td>
                  <td className="py-4 px-4">{station.state}</td>
                  <td className="py-4 px-4">{station.zone}</td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingStation(station);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg transition-colors duration-200"
                        style={{color: '#337ab7'}}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2a6496';
                          e.currentTarget.style.backgroundColor = '#f0f7ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#337ab7';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStation(station.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No stations found matching your search criteria.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <StationModal
          station={editingStation}
          onSave={editingStation ? handleEditStation : handleAddStation}
          onClose={() => {
            setIsModalOpen(false);
            setEditingStation(null);
          }}
        />
      )}
    </div>
  );
};

export default StationManagement;