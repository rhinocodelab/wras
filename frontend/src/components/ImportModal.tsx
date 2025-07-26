import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
          setSelectedFile(file);
        } else {
          alert('Please select a valid Excel (.xlsx) or CSV (.csv) file');
        }
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid Excel (.xlsx) or CSV (.csv) file');
      }
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
      onClose();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Import Train Routes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">

          {/* Drag and Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-gray-800 mb-2">
                  Selected File: {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your Excel file here
                </p>
                <p className="text-xs text-gray-500 mb-4">or</p>
                <button
                  onClick={handleBrowseClick}
                  className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs font-medium w-20 h-8"
                >
                  Browse
                </button>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Sample table preview */}
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2 font-medium">Expected Column Structure:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 py-1 text-left">Train Number</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Train Name</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Start Station</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">Start Code</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">End Station</th>
                    <th className="border border-gray-300 px-2 py-1 text-left">End Code</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-1">12345</td>
                    <td className="border border-gray-300 px-2 py-1">Express Train</td>
                    <td className="border border-gray-300 px-2 py-1">Central Station</td>
                    <td className="border border-gray-300 px-2 py-1">CST</td>
                    <td className="border border-gray-300 px-2 py-1">North Terminal</td>
                    <td className="border border-gray-300 px-2 py-1">NT</td>
                  </tr>
                  <tr className="bg-gray-25">
                    <td className="border border-gray-300 px-2 py-1">67890</td>
                    <td className="border border-gray-300 px-2 py-1">Local Train</td>
                    <td className="border border-gray-300 px-2 py-1">South Station</td>
                    <td className="border border-gray-300 px-2 py-1">SST</td>
                    <td className="border border-gray-300 px-2 py-1">East Terminal</td>
                    <td className="border border-gray-300 px-2 py-1">ET</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample file info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Sample file available:</strong> sample_docs/sample_train_routes.xlsx (Excel/CSV format)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors text-xs font-medium w-16 h-8"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile}
            className={`px-3 py-1 transition-colors text-xs font-medium w-20 h-8 ${
              selectedFile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal; 