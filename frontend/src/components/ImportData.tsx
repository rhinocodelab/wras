import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle } from 'lucide-react';

const ImportData: React.FC = () => {
  const [importType, setImportType] = useState<'stations' | 'routes'>('stations');
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const sampleStationCSV = `code,name,state,zone
NDLS,New Delhi,Delhi,Northern Railway
CST,Chhatrapati Shivaji Terminus,Maharashtra,Central Railway
HWH,Howrah Junction,West Bengal,Eastern Railway
MAS,Chennai Central,Tamil Nadu,Southern Railway`;

  const sampleRouteCSV = `name,startStation,endStation,stations,distance,duration
Delhi Mumbai Route,NDLS,CST,"NDLS,JP,RTM,BRC,ST,CST",1384,16h 30m
Delhi Kolkata Route,NDLS,HWH,"NDLS,CNB,ALD,MGS,PNBE,ASN,HWH",1447,17h 15m`;

  const handleImport = async () => {
    if (!csvData.trim()) {
      setImportResult({type: 'error', message: 'Please paste CSV data to import'});
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const dataLines = lines.slice(1);

      if (importType === 'stations') {
        const requiredHeaders = ['code', 'name', 'state', 'zone'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const stations = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const station: any = {};
          
          headers.forEach((header, i) => {
            station[header] = values[i] || '';
          });
          
          station.id = Date.now().toString() + index;
          return station;
        });

        const existingStations = JSON.parse(localStorage.getItem('railway_stations') || '[]');
        const combinedStations = [...existingStations, ...stations];
        localStorage.setItem('railway_stations', JSON.stringify(combinedStations));
        
        setImportResult({type: 'success', message: `Successfully imported ${stations.length} stations`});
      } else {
        const requiredHeaders = ['name', 'startStation', 'endStation', 'stations', 'distance', 'duration'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        const routes = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const route: any = {};
          
          headers.forEach((header, i) => {
            if (header === 'stations') {
              route[header] = values[i].split(',').map((s: string) => s.trim());
            } else if (header === 'distance') {
              route[header] = Number(values[i]);
            } else {
              route[header] = values[i] || '';
            }
          });
          
          route.id = Date.now().toString() + index;
          return route;
        });

        const existingRoutes = JSON.parse(localStorage.getItem('railway_routes') || '[]');
        const combinedRoutes = [...existingRoutes, ...routes];
        localStorage.setItem('railway_routes', JSON.stringify(combinedRoutes));
        
        setImportResult({type: 'success', message: `Successfully imported ${routes.length} routes`});
      }

      setCsvData('');
    } catch (error) {
      setImportResult({type: 'error', message: error instanceof Error ? error.message : 'Import failed'});
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    const data = importType === 'stations' 
      ? JSON.parse(localStorage.getItem('railway_stations') || '[]')
      : JSON.parse(localStorage.getItem('railway_routes') || '[]');

    if (data.length === 0) {
      setImportResult({type: 'error', message: `No ${importType} data to export`});
      return;
    }

    let csvContent = '';
    
    if (importType === 'stations') {
      csvContent = 'code,name,state,zone\n';
      csvContent += data.map((station: any) => 
        `${station.code},${station.name},${station.state},${station.zone}`
      ).join('\n');
    } else {
      csvContent = 'name,startStation,endStation,stations,distance,duration\n';
      csvContent += data.map((route: any) => 
        `${route.name},${route.startStation},${route.endStation},"${route.stations.join(',')}",${route.distance},${route.duration}`
      ).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `railway_${importType}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setImportResult({type: 'success', message: `${importType} data exported successfully`});
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Import & Export Data</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Upload className="w-6 h-6 mr-2" style={{color: '#337ab7'}} />
            <h2 className="text-xl font-semibold text-gray-800">Import Data</h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="stations"
                  checked={importType === 'stations'}
                  onChange={(e) => setImportType(e.target.value as 'stations' | 'routes')}
                  className="mr-2"
                />
                Stations
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="routes"
                  checked={importType === 'routes'}
                  onChange={(e) => setImportType(e.target.value as 'stations' | 'routes')}
                  className="mr-2"
                />
                Routes
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV Data</label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono text-sm"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder={`Paste your CSV data here...`}
            />
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting}
           className="w-full text-white px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
           style={{backgroundColor: isImporting ? '#999' : '#337ab7'}}
           onMouseEnter={(e) => !isImporting && (e.currentTarget.style.backgroundColor = '#2a6496')}
           onMouseLeave={(e) => !isImporting && (e.currentTarget.style.backgroundColor = '#337ab7')}
          >
            {isImporting ? 'Importing...' : `Import ${importType}`}
          </button>

          {importResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-start ${
              importResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{importResult.message}</span>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Download className="w-6 h-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Export Data</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Export your current {importType} data as CSV format for backup or sharing.
          </p>

          <button
            onClick={handleExport}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            Export {importType} as CSV
          </button>
        </div>
      </div>

      {/* Sample Data Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <FileText className="w-6 h-6 text-orange-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Sample CSV Format</h2>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Sample {importType === 'stations' ? 'Stations' : 'Routes'} CSV:
          </h3>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            {importType === 'stations' ? sampleStationCSV : sampleRouteCSV}
          </pre>
        </div>

        <div className="text-sm text-gray-600">
          <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
          <ul className="list-disc list-inside space-y-1">
            {importType === 'stations' ? (
              <>
                <li>Required columns: code, name, state, zone</li>
                <li>Station codes should be unique and in uppercase</li>
                <li>Use standard railway zone names</li>
              </>
            ) : (
              <>
                <li>Required columns: name, startStation, endStation, stations, distance, duration</li>
                <li>Stations column should contain comma-separated station codes in quotes</li>
                <li>Distance should be numeric (in kilometers)</li>
                <li>Duration format: "16h 30m"</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportData;