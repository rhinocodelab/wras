import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Route {
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

interface RouteRow {
  train_number: string;
  train_name_en: string;
  start_station_en: string;
  start_station_code: string;
  end_station_en: string;
  end_station_code: string;
}

interface RouteModalProps {
  route: Route | null;
  onSave: (route: Omit<Route, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const RouteModal: React.FC<RouteModalProps> = ({ route, onSave, onClose }) => {
  const [tableData, setTableData] = useState<RouteRow[]>([
    {
      train_number: '',
      train_name_en: '',
      start_station_en: '',
      start_station_code: '',
      end_station_en: '',
      end_station_code: '',
    }
  ]);

  useEffect(() => {
    if (route) {
      setTableData([{
        train_number: route.train_number,
        train_name_en: route.train_name_en,
        start_station_en: route.start_station_en,
        start_station_code: route.start_station_code,
        end_station_en: route.end_station_en,
        end_station_code: route.end_station_code,
      }]);
    }
  }, [route]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, save only the first row (single route mode)
    if (tableData.length > 0) {
      onSave(tableData[0]);
    }
  };

  const handleCellChange = (rowIndex: number, field: keyof RouteRow, value: string) => {
    const updatedData = [...tableData];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [field]: value,
    };
    setTableData(updatedData);
  };

  const addRow = () => {
    setTableData([...tableData, {
      train_number: '',
      train_name_en: '',
      start_station_en: '',
      start_station_code: '',
      end_station_en: '',
      end_station_code: '',
    }]);
  };

  const removeRow = (index: number) => {
    if (tableData.length > 1) {
      setTableData(tableData.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            {route ? 'Edit Route' : 'Add New Route'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                    Train Number
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                    Train Name
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                    Start Station
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                    Start Code
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                    End Station
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase border border-gray-300">
                    End Code
                  </th>

                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.train_number}
                        onChange={(e) => handleCellChange(index, 'train_number', e.target.value)}
                        className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="12345"
                        required
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.train_name_en}
                        onChange={(e) => handleCellChange(index, 'train_name_en', e.target.value)}
                        className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="Express Train"
                        required
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.start_station_en}
                        onChange={(e) => handleCellChange(index, 'start_station_en', e.target.value)}
                        className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="Central Station"
                        required
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.start_station_code}
                        onChange={(e) => handleCellChange(index, 'start_station_code', e.target.value.toUpperCase())}
                        className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                        placeholder="CST"
                        required
                        maxLength={6}
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.end_station_en}
                        onChange={(e) => handleCellChange(index, 'end_station_en', e.target.value)}
                        className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder="North Terminal"
                        required
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={row.end_station_code}
                        onChange={(e) => handleCellChange(index, 'end_station_code', e.target.value.toUpperCase())}
                        className="w-full px-2 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                        placeholder="NT"
                        required
                        maxLength={6}
                      />
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center text-xs transition-colors duration-200"
              style={{color: '#337ab7'}}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2a6496'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#337ab7'}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Row
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200 text-xs font-medium w-16 h-8"
            >
              Cancel
            </button>
            <button
              type="submit"
             className="px-3 py-1 text-white rounded transition-colors duration-200 text-xs font-medium w-20 h-8"
             style={{backgroundColor: '#337ab7'}}
             onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a6496'}
             onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
            >
              {route ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RouteModal;