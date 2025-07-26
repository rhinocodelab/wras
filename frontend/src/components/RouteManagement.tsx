import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Languages, Volume2 } from 'lucide-react';
import RouteModal from './RouteModal';
import ImportModal from './ImportModal';
import { useToast } from './ToastContainer';

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

interface RouteStatus {
  routeId: number;
  hasTextTranslation: boolean;
  hasAudioTranslation: boolean;
}

const RouteManagement: React.FC = () => {
  const { showToast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeStatuses, setRouteStatuses] = useState<RouteStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [selectedAction, setSelectedAction] = useState('add');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({
    isTranslating: false,
    currentStep: '',
    totalRoutes: 0,
    translatedRoutes: 0,
    failedRoutes: 0
  });

  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [audioProgress, setAudioProgress] = useState({
    isGenerating: false,
    currentStep: '',
    totalRoutes: 0,
    generatedRoutes: 0,
    failedRoutes: 0,
    totalFiles: 0,
    generatedFiles: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const recordsPerPage = 7;

  // Check AI translation and audio status for all routes
  const checkRouteStatuses = async () => {
    try {
      const [translationsResponse, audioResponse] = await Promise.all([
        fetch('http://localhost:5001/api/v1/translate/all'),
        fetch('http://localhost:5001/api/v1/audio/files/')
      ]);

      const translationsData = translationsResponse.ok ? await translationsResponse.json() : { translations: [] };
      const audioData = audioResponse.ok ? await audioResponse.json() : { audio_files: [] };

      const statuses: RouteStatus[] = routes.map(route => {
        const hasTextTranslation = translationsData.translations?.some((t: any) => t.train_route_id === route.id) || false;
        const hasAudioTranslation = audioData.audio_files?.some((a: any) => a.train_route_id === route.id) || false;
        
        return {
          routeId: route.id,
          hasTextTranslation,
          hasAudioTranslation
        };
      });

      setRouteStatuses(statuses);
    } catch (error) {
      console.error('Error checking route statuses:', error);
    }
  };

  // Get status for a specific route
  const getRouteStatus = (routeId: number): RouteStatus | undefined => {
    return routeStatuses.find(status => status.routeId === routeId);
  };

  // Generate individual AI Text Translation
  const handleGenerateIndividualTranslation = async (routeId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/v1/translate/generate/${routeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        showToast('success', 'AI Text Translation generated successfully!');
        await checkRouteStatuses(); // Refresh statuses
      } else {
        const errorData = await response.json();
        showToast('error', `Failed to generate translation: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Error generating AI Text Translation');
    }
  };

  // Generate individual AI Audio Translation
  const handleGenerateIndividualAudio = async (routeId: number) => {
    try {
      const response = await fetch(`http://localhost:5001/api/v1/audio/generate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          train_route_id: routeId, 
          languages: ['en', 'hi', 'mr', 'gu'] 
        })
      });

      if (response.ok) {
        showToast('success', 'AI Audio Translation generated successfully!');
        await checkRouteStatuses(); // Refresh statuses
      } else {
        const errorData = await response.json();
        showToast('error', `Failed to generate audio: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Error generating AI Audio Translation');
    }
  };

  const getButtonColor = () => {
    switch (selectedAction) {
      case 'add': return '#337ab7';
      case 'import': return '#6c757d';
      case 'audio': return '#28a745';
      case 'translation': return '#17a2b8';
      default: return '#337ab7';
    }
  };

  const getButtonHoverColor = () => {
    switch (selectedAction) {
      case 'add': return '#2a6496';
      case 'import': return '#5a6268';
      case 'audio': return '#218838';
      case 'translation': return '#138496';
      default: return '#2a6496';
    }
  };

  const getButtonText = () => {
    switch (selectedAction) {
      case 'add': return 'Add Route';
      case 'import': return 'Import';
      case 'audio': return 'Generate AI Audio';
      case 'translation': return 'Generate AI Translation';
      default: return 'Add Route';
    }
  };

  const getTooltipText = () => {
    switch (selectedAction) {
      case 'add': return 'Create a new railway route';
      case 'import': return 'Import routes from Excel/CSV';
      case 'audio': return 'Generate AI audio for routes';
      case 'translation': return 'Generate AI translations for all routes';
      default: return 'Create a new railway route';
    }
  };

  const handleActionClick = () => {
    switch (selectedAction) {
      case 'add':
        setIsModalOpen(true);
        break;
      case 'import':
        setIsImportModalOpen(true);
        break;
      case 'audio':
        handleGenerateAudio();
        break;
      case 'translation':
        handleGenerateTranslations();
        break;
      default:
        setIsModalOpen(true);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:5001/api/v1/train-routes/import/', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        await fetchRoutes();
        showToast('success', 'Routes imported successfully!');
      } else {
        const errorData = await response.json();
        showToast('error', `Import failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'Import failed: Network error');
    }
  };

  useEffect(() => {
    fetchRoutes(1);
  }, []);

  const fetchRoutes = async (page: number = 1) => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`http://localhost:5001/api/v1/train-routes/?page=${page}&limit=${recordsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || data);
        setTotalPages(data.total_pages || 1);
        setTotalRecords(data.total || data.length || 0);
        setCurrentPage(page);
        
        // Check AI statuses after fetching routes
        await checkRouteStatuses();
      } else {
        showToast('error', 'Failed to fetch routes');
      }
    } catch (error) {
      showToast('error', 'Error fetching routes: Network error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddRoute = async (routeData: Omit<Route, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/train-routes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });
      
      if (response.ok) {
        // Reset to page 1 to show the newly added route first
        await fetchRoutes(1);
        setCurrentPage(1);
        setIsModalOpen(false);
        showToast('success', 'Route added successfully!');
      } else {
        showToast('error', `Failed to add route: ${response.statusText}`);
      }
    } catch (error) {
      showToast('error', 'Error adding route: Network error');
    }
  };

  const handleEditRoute = async (routeData: Omit<Route, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingRoute) {
      try {
        const response = await fetch(`http://localhost:5001/api/v1/train-routes/${editingRoute.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(routeData),
        });
        
        if (response.ok) {
          await fetchRoutes();
          setEditingRoute(null);
          setIsModalOpen(false);
          showToast('success', 'Route updated successfully!');
        } else {
          showToast('error', `Failed to update route: ${response.statusText}`);
        }
      } catch (error) {
        showToast('error', 'Error updating route: Network error');
      }
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/v1/train-routes/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchRoutes();
          showToast('success', 'Route deleted successfully!');
        } else {
          showToast('error', `Failed to delete route: ${response.statusText}`);
        }
      } catch (error) {
        showToast('error', 'Error deleting route: Network error');
      }
    }
  };

  const handleRefreshRoutes = async () => {
    await fetchRoutes(currentPage);
    await checkRouteStatuses();
  };

  const handleClearAllRoutes = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action will permanently delete ALL train routes from the database.\n\n' +
      'This action cannot be undone. Are you sure you want to continue?'
    );
    
    if (confirmed) {
      try {
        const response = await fetch('http://localhost:5001/api/v1/train-routes/', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const result = await response.json();
          showToast('success', result.message);
          await fetchRoutes(1); // Refresh the data
          setCurrentPage(1);
          setTotalPages(1);
          setTotalRecords(0);
        } else {
          const errorData = await response.json();
          showToast('error', `Failed to clear routes: ${errorData.detail || 'Unknown error'}`);
        }
      } catch (error) {
        showToast('error', 'Error clearing routes: Network error');
      }
    }
  };

  const handleGenerateTranslations = async () => {
    // Open translation progress modal
    setIsTranslationModalOpen(true);
    setTranslationProgress({
      isTranslating: true,
      currentStep: 'Initializing translation process...',
      totalRoutes: 0,
      translatedRoutes: 0,
      failedRoutes: 0
    });
    
    try {
      // Update progress
      setTranslationProgress(prev => ({
        ...prev,
        currentStep: 'Connecting to translation service...'
      }));
      
      const response = await fetch('http://localhost:5001/api/v1/translate/bulk/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_language: 'en'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update final progress
        setTranslationProgress({
          isTranslating: false,
          currentStep: 'Translation completed successfully!',
          totalRoutes: result.total_routes,
          translatedRoutes: result.translated_routes,
          failedRoutes: result.failed_routes
        });
        
        // Show success toast
        setTimeout(() => {
          showToast('success', `✅ ${result.message}\nTranslated: ${result.translated_routes}/${result.total_routes} routes`);
          setIsTranslationModalOpen(false);
        }, 2000);
        
      } else {
        const errorData = await response.json();
        setTranslationProgress({
          isTranslating: false,
          currentStep: `Translation failed: ${errorData.detail || 'Unknown error'}`,
          totalRoutes: 0,
          translatedRoutes: 0,
          failedRoutes: 0
        });
        
        setTimeout(() => {
          showToast('error', `Translation failed: ${errorData.detail || 'Unknown error'}`);
          setIsTranslationModalOpen(false);
        }, 3000);
      }
    } catch (error) {
      setTranslationProgress({
        isTranslating: false,
        currentStep: 'Translation failed: Network error',
        totalRoutes: 0,
        translatedRoutes: 0,
        failedRoutes: 0
      });
      
      setTimeout(() => {
        showToast('error', 'Translation failed: Network error');
        setIsTranslationModalOpen(false);
      }, 3000);
    }
  };

  const handleGenerateAudio = async () => {
    setIsAudioModalOpen(true);
    setAudioProgress({
      isGenerating: true,
      currentStep: 'Starting audio generation process...',
      totalRoutes: 0,
      generatedRoutes: 0,
      failedRoutes: 0,
      totalFiles: 0,
      generatedFiles: 0
    });

    try {
      // Call the backend API for bulk audio generation
      setAudioProgress(prev => ({ ...prev, currentStep: 'Fetching routes with translations...' }));
      
      const response = await fetch('http://localhost:5001/api/v1/audio/generate-bulk/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languages: ['en', 'hi', 'mr', 'gu'],
          overwrite_existing: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        setAudioProgress(prev => ({ 
          ...prev, 
          totalRoutes: result.total_routes_processed,
          generatedRoutes: result.total_routes_processed - result.failed_routes.length,
          failedRoutes: result.failed_routes.length,
          totalFiles: result.total_files_generated,
          generatedFiles: result.total_files_generated,
          currentStep: 'Audio generation completed successfully!',
          isGenerating: false
        }));
        
        showToast('success', `Audio generation completed! Generated ${result.total_files_generated} audio files.`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate audio');
      }

    } catch (error) {
      setAudioProgress(prev => ({ 
        ...prev, 
        isGenerating: false, 
        failedRoutes: 1,
        currentStep: 'Audio generation failed. Please try again.'
      }));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast('error', `Failed to generate audio: ${errorMessage}`);
    }
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Check route statuses when routes change
  useEffect(() => {
    if (routes.length > 0) {
      checkRouteStatuses();
    }
  }, [routes]);

  // Initial data fetch
  useEffect(() => {
    fetchRoutes(1);
  }, []);

  const filteredRoutes = routes.filter(route =>
    route.train_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.train_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.start_station_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.end_station_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.start_station_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.end_station_code.toLowerCase().includes(searchTerm.toLowerCase())
  );



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Route Management</h1>
          <p className="text-gray-600 text-xs">
            Manage railway routes and configure connections between stations.
          </p>
        </div>
        <div className="flex flex-col space-y-1">
          <div className="flex space-x-2">
                          <select
                className="px-2 py-1 border border-gray-300 text-xs w-64 h-7 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                onChange={(e) => setSelectedAction(e.target.value)}
                value={selectedAction}
              >
              <option value="add">Add Route</option>
              <option value="import">Import Routes</option>
                              <option value="audio">Generate AI Audio Translation</option>
                              <option value="translation">Generate AI Text Translation</option>
            </select>
            <button
              onClick={() => handleActionClick()}
              className="text-white px-2 py-1 transition-colors duration-200 text-xs w-16 h-7 flex items-center justify-center text-xs"
              style={{backgroundColor: getButtonColor()}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = getButtonHoverColor()}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = getButtonColor()}
            >
              OK
            </button>
          </div>
          <div className="text-xs text-gray-600 ml-0">
            {getTooltipText()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1 border border-gray-300 focus:ring-2 focus:border-transparent h-8"
                style={{'--tw-ring-color': '#337ab7'} as any}
              />
            </div>
            <button
              onClick={handleRefreshRoutes}
              disabled={isRefreshing}
              className={`px-3 py-1 text-white transition-colors text-xs font-medium w-20 h-8 ${
                isRefreshing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Refresh train routes from database"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleClearAllRoutes}
              className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-medium w-20 h-8"
              title="Clear all train routes from database"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Train Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Train Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Station
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.map((route) => {
                const status = getRouteStatus(route.id);
                return (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {route.train_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {route.train_name_en}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {route.start_station_en}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {route.start_station_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {route.end_station_en}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {route.end_station_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {/* AI Text Translation Status */}
                        <div className="flex items-center space-x-1">
                          <Languages className="w-3 h-3 text-blue-600" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            status?.hasTextTranslation 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {status?.hasTextTranslation ? '✓' : '✗'}
                          </span>
                        </div>
                        {/* AI Audio Translation Status */}
                        <div className="flex items-center space-x-1">
                          <Volume2 className="w-3 h-3 text-green-600" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            status?.hasAudioTranslation 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {status?.hasAudioTranslation ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        {/* Individual AI Text Translation Button */}
                        <button
                          onClick={() => handleGenerateIndividualTranslation(route.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            status?.hasTextTranslation
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title={status?.hasTextTranslation ? 'Regenerate AI Text Translation' : 'Generate AI Text Translation'}
                        >
                          <Languages className="w-4 h-4" />
                        </button>
                        
                        {/* Individual AI Audio Translation Button */}
                        <button
                          onClick={() => handleGenerateIndividualAudio(route.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            status?.hasAudioTranslation
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={status?.hasAudioTranslation ? 'Regenerate AI Audio Translation' : 'Generate AI Audio Translation'}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingRoute(route);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteRoute(route.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete route"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No routes found matching your search criteria.
          </div>
        )}

        {/* Pagination */}
        {totalRecords > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} results
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchRoutes(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm rounded border ${
                  currentPage === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchRoutes(pageNum)}
                    className={`px-3 py-1 text-sm rounded border ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => fetchRoutes(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 text-sm rounded border ${
                  currentPage === totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
              )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <RouteModal
          route={editingRoute}
          onSave={editingRoute ? handleEditRoute : handleAddRoute}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRoute(null);
          }}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportFile}
        />
      )}

      {/* Translation Progress Modal */}
      {isTranslationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              {/* Header */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {translationProgress.isTranslating ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : translationProgress.translatedRoutes > 0 ? (
                    <div className="text-green-600 text-2xl">✅</div>
                  ) : (
                    <div className="text-red-600 text-2xl">❌</div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {translationProgress.isTranslating ? 'Generating AI Translations' : 'Translation Complete'}
                </h2>
                <p className="text-sm text-gray-600">
                  {translationProgress.currentStep}
                </p>
              </div>

              {/* Progress Details */}
              {translationProgress.totalRoutes > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Total Routes:</span>
                    <span className="font-medium">{translationProgress.totalRoutes}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Translated:</span>
                    <span className="font-medium text-green-600">{translationProgress.translatedRoutes}</span>
                  </div>
                  {translationProgress.failedRoutes > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{translationProgress.failedRoutes}</span>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${translationProgress.totalRoutes > 0 ? (translationProgress.translatedRoutes / translationProgress.totalRoutes) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Languages Info */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Translating to:</h3>
                <div className="flex justify-center space-x-4 text-xs text-gray-600">
                  <span>English</span>
                  <span>Hindi</span>
                  <span>Marathi</span>
                  <span>Gujarati</span>
                </div>
              </div>

              {/* Close Button */}
              {!translationProgress.isTranslating && (
                <button
                  onClick={() => setIsTranslationModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Generation Progress Modal */}
      {isAudioModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              {/* Header */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {audioProgress.isGenerating ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  ) : audioProgress.generatedFiles > 0 ? (
                    <div className="text-green-600 text-2xl">✅</div>
                  ) : (
                    <div className="text-red-600 text-2xl">❌</div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {audioProgress.isGenerating ? 'Generating AI Audio' : 'Audio Generation Complete'}
                </h2>
                <p className="text-sm text-gray-600">
                  {audioProgress.currentStep}
                </p>
              </div>

              {/* Progress Details */}
              {audioProgress.totalRoutes > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Total Routes:</span>
                    <span className="font-medium">{audioProgress.totalRoutes}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Generated:</span>
                    <span className="font-medium text-green-600">{audioProgress.generatedRoutes}</span>
                  </div>
                  {audioProgress.failedRoutes > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{audioProgress.failedRoutes}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Audio Files:</span>
                    <span className="font-medium text-blue-600">{audioProgress.generatedFiles}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${audioProgress.totalRoutes > 0 ? (audioProgress.generatedRoutes / audioProgress.totalRoutes) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Languages Info */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Generating audio for:</h3>
                <div className="flex justify-center space-x-4 text-xs text-gray-600">
                  <span>English</span>
                  <span>Hindi</span>
                  <span>Marathi</span>
                  <span>Gujarati</span>
                </div>
              </div>

              {/* Close Button */}
              {!audioProgress.isGenerating && (
                <button
                  onClick={() => setIsAudioModalOpen(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;