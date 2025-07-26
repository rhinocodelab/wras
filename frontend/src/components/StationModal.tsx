import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Station {
  id: string;
  code: string;
  name: string;
  state: string;
  zone: string;
}

interface StationModalProps {
  station: Station | null;
  onSave: (station: Omit<Station, 'id'>) => void;
  onClose: () => void;
}

const zones = [
  'Central Railway',
  'Eastern Railway',
  'Northern Railway',
  'Southern Railway',
  'Western Railway',
  'South Central Railway',
  'South Eastern Railway',
  'North Eastern Railway',
  'North Central Railway',
  'South Western Railway',
  'West Central Railway',
  'East Central Railway',
  'North Western Railway',
  'South East Central Railway',
  'East Coast Railway',
  'North East Frontier Railway',
];

const StationModal: React.FC<StationModalProps> = ({ station, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    state: '',
    zone: '',
  });

  useEffect(() => {
    if (station) {
      setFormData({
        code: station.code,
        name: station.name,
        state: station.state,
        zone: station.zone,
      });
    }
  }, [station]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {station ? 'Edit Station' : 'Add New Station'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Station Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono uppercase"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder="e.g., NDLS"
              required
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Station Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder="e.g., New Delhi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder="e.g., Delhi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Railway Zone
            </label>
            <select
              name="zone"
              value={formData.zone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
              required
            >
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors duration-200"
              style={{backgroundColor: '#337ab7'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a6496'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
            >
              {station ? 'Update' : 'Add'} Station
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StationModal;