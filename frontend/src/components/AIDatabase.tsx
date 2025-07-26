import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, Eye, Languages, Volume2, ArrowLeft, Home } from 'lucide-react';
import { useToast } from './ToastContainer';

interface TranslationRecord {
  id: number;
  train_route_id: number;
  language_code: string;
  train_number: string;
  train_number_words: string;
  train_name: string;
  start_station_name: string;
  end_station_name: string;
}

interface TrainRoute {
  id: number;
  train_number: string;
  train_name_en: string;
  start_station_en: string;
  end_station_en: string;
}

interface AudioFile {
  id: number;
  train_route_id: number;
  language_code: string;
  audio_type: string;
  audio_file_path: string;
  created_at: string;
}

type ViewMode = 'categories' | 'translations' | 'audio';

const AIDatabase: React.FC = () => {
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [translations, setTranslations] = useState<TranslationRecord[]>([]);
  const [routes, setRoutes] = useState<TrainRoute[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10;
  const [selectedTranslation, setSelectedTranslation] = useState<TranslationRecord | null>(null);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [audioModal, setAudioModal] = useState<{
    isOpen: boolean;
    language: string;
    routeId: number | null;
    audioFiles: AudioFile[];
    routeName: string;
    trainNumber: string;
  }>(
    {
      isOpen: false,
      language: '',
      routeId: null,
      audioFiles: [],
      routeName: '',
      trainNumber: ''
    }
  );

  const languages = [
    { code: 'all', name: 'All Languages' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'mr', name: 'Marathi' },
    { code: 'gu', name: 'Gujarati' }
  ];



  const fetchTranslations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/api/v1/translate/all');
      if (response.ok) {
        const data = await response.json();
        setTranslations(data.translations || []);
        setTotalPages(Math.ceil((data.translations?.length || 0) / recordsPerPage));
      } else {
        showToast('error', 'Failed to fetch translation records');
      }
    } catch (error) {
      showToast('error', 'Error fetching translation records: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/train-routes/');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchAudioFiles = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/v1/audio/files/');
      if (response.ok) {
        const data = await response.json();
        setAudioFiles(data.audio_files || []);
      }
    } catch (error) {
      console.error('Error fetching audio files:', error);
    }
  };

  const getRouteInfo = (routeId: number) => {
    return routes.find(route => route.id === routeId);
  };

  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const getAudioFilesForRoute = (routeId: number) => {
    return audioFiles.filter(af => af.train_route_id === routeId);
  };

  const getAudioTypeName = (audioType: string) => {
    const typeMap: { [key: string]: string } = {
      'train_number_words': 'Train Number (Words)',
      'train_name': 'Train Name',
      'start_station_name': 'Start Station',
      'end_station_name': 'End Station'
    };
    return typeMap[audioType] || audioType;
  };

  const getAudioUrl = (filePath: string) => {
    // Convert file path to web-accessible URL
    const fileName = filePath.split('/').pop();
    return `http://localhost:5001/audio/${fileName}`;
  };

  const getTranslationText = (routeId: number, languageCode: string, audioType: string) => {
    const translation = translations.find(t => 
      t.train_route_id === routeId && t.language_code === languageCode
    );
    
    if (!translation) return 'Translation not found';
    
    switch (audioType) {
      case 'train_number_words':
        return translation.train_number_words;
      case 'train_name':
        return translation.train_name;
      case 'start_station_name':
        return translation.start_station_name;
      case 'end_station_name':
        return translation.end_station_name;
      default:
        return 'Unknown type';
    }
  };

  const filteredTranslations = translations.filter(translation => {
    const route = getRouteInfo(translation.train_route_id);
    const matchesSearch = searchTerm === '' || 
      translation.train_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.start_station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.end_station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.train_number_words.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route?.train_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesLanguage = selectedLanguage === 'all' || translation.language_code === selectedLanguage;
    
    return matchesSearch && matchesLanguage;
  });

  const paginatedTranslations = filteredTranslations.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const handleRefresh = async () => {
    if (viewMode === 'translations') {
      await fetchTranslations();
      showToast('success', 'AI Text Translations refreshed successfully');
    } else if (viewMode === 'audio') {
      await fetchAudioFiles();
      showToast('success', 'AI Audio files refreshed successfully');
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action will permanently delete ALL translation records from the database.\n\n' +
      'This action cannot be undone. Are you sure you want to continue?'
    );
    
    if (confirmed) {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5001/api/v1/translate/clear-all', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const result = await response.json();
          showToast('success', result.message);
          await fetchTranslations(); // Refresh the data
          setCurrentPage(1);
        } else {
          const errorData = await response.json();
          showToast('error', `Failed to clear translations: ${errorData.detail || 'Unknown error'}`);
        }
      } catch (error) {
        showToast('error', 'Error clearing translations: Network error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearAllAudio = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This action will permanently delete ALL audio files from the database and filesystem.\n\n' +
      'This action cannot be undone. Are you sure you want to continue?'
    );
    
    if (confirmed) {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5001/api/v1/audio/clear-all', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const result = await response.json();
          showToast('success', result.message);
          await fetchAudioFiles(); // Refresh the data
          setCurrentPage(1);
        } else {
          const errorData = await response.json();
          showToast('error', `Failed to clear audio files: ${errorData.detail || 'Unknown error'}`);
        }
      } catch (error) {
        showToast('error', 'Error clearing audio files: Network error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const playAudio = (filePath: string) => {
    try {
      // Convert file path to web-accessible URL
      // Remove the base path and create a relative URL
      const relativePath = filePath.replace('/var/www/war-ddh/ai-audio-translations/', '');
      const audioUrl = `http://localhost:5001/ai-audio-translations/${relativePath}`;
      
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        showToast('error', 'Failed to play audio file');
      });
    } catch (error) {
      console.error('Error creating audio element:', error);
      showToast('error', 'Failed to play audio file');
    }
  };

  const handlePlayLanguageAudio = (langAudioFiles: AudioFile[], routeId: number) => {
    if (!langAudioFiles.length) return;
    const route = getRouteInfo(routeId);
    setAudioModal({
      isOpen: true,
      language: langAudioFiles[0].language_code,
      routeId,
      audioFiles: langAudioFiles,
      routeName: route?.train_name_en || '',
      trainNumber: route?.train_number || ''
    });
  };

  const renderBreadcrumb = () => {
    if (viewMode === 'categories') return null;
    
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <button
          onClick={() => setViewMode('categories')}
          className="hover:text-blue-600 transition-colors"
        >
          AI Database
        </button>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          {viewMode === 'translations' ? 'AI Text Translations' : 'AI Text-to-Speech'}
        </span>
      </div>
    );
  };

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Database</h1>
          <p className="text-gray-600 text-xs">
            Explore AI-generated content across different categories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Text Translations Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Languages className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">AI Text Translations</h3>
                <p className="text-sm text-gray-600">Multilingual train route translations</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Languages:</span>
              <span className="font-medium">English, Hindi, Marathi, Gujarati</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Features:</span>
              <span className="font-medium">Train names, stations, number words</span>
            </div>
            <button
              onClick={() => {
                setViewMode('translations');
                fetchTranslations();
                fetchRoutes();
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Translations
            </button>
          </div>
        </div>

        {/* AI Text-to-Speech Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">AI Text-to-Speech</h3>
                <p className="text-sm text-gray-600">Generated audio announcements</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">Available</span>
                </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Features:</span>
              <span className="font-medium">Audio files, voice synthesis</span>
            </div>
            <button
              onClick={() => {
                setViewMode('audio');
                fetchAudioFiles();
              }}
              className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              View Audio Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTranslationsView = () => {
    // Group translations by train_route_id
    const grouped = translations.reduce((acc, t) => {
      if (!acc[t.train_route_id]) acc[t.train_route_id] = [];
      acc[t.train_route_id].push(t);
      return acc;
    }, {} as Record<number, TranslationRecord[]>);

    // Filter by search term
    const filteredRouteIds = Object.keys(grouped).filter(routeId => {
      const group = grouped[Number(routeId)];
      // Check if any translation in the group matches the search
      return group.some(translation => {
        const route = getRouteInfo(translation.train_route_id);
        return (
          searchTerm === '' ||
          translation.train_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          translation.start_station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          translation.end_station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          translation.train_number_words.toLowerCase().includes(searchTerm.toLowerCase()) ||
          translation.train_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (route?.train_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || false)
        );
      });
    });

    // Pagination
    const paginatedRouteIds = filteredRouteIds.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Text Translations</h1>
            <p className="text-gray-600 text-xs">
              View all AI-generated translation records for train routes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`px-3 py-1 text-white transition-colors text-xs font-medium w-20 h-8 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title="Refresh AI database records"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className={`px-3 py-1 text-white transition-colors text-xs font-medium w-20 h-8 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title="Clear all translation records"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search translations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1 border border-gray-300 focus:ring-2 focus:border-transparent h-8"
                style={{'--tw-ring-color': '#337ab7'} as any}
              />
            </div>
          </div>
        </div>

                     {/* Card List - Compact Layout */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {paginatedRouteIds.map(routeId => {
                 const group = grouped[Number(routeId)];
                 const route = getRouteInfo(Number(routeId));
                 const englishTranslation = group.find(tr => tr.language_code === 'en');
                 const otherLanguages = group.filter(tr => tr.language_code !== 'en');
                 
                 return (
                   <div key={routeId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                     {/* Header */}
                     <div className="mb-4 pb-3 border-b border-gray-200">
                       <div className="text-lg font-bold text-blue-700 font-mono">Train #{route?.train_number || routeId}</div>
                       <div className="text-sm text-gray-600">{route?.train_name_en}</div>
                     </div>
                     
                     {/* English Translation (Default) */}
                     {englishTranslation && (
                       <div className="mb-4">
                         <div className="flex items-center justify-between mb-3">
                           <span className="text-sm font-semibold text-gray-800">English</span>
                         </div>
                         
                         <div className="space-y-2">
                           <div>
                             <div className="text-xs text-gray-500 mb-1">Train Name:</div>
                             <div className="text-sm font-medium text-gray-900">{englishTranslation.train_name}</div>
                           </div>
                           
                           <div>
                             <div className="text-xs text-gray-500 mb-1">Start Station:</div>
                             <div className="text-sm text-gray-900">{englishTranslation.start_station_name}</div>
                           </div>
                           
                           <div>
                             <div className="text-xs text-gray-500 mb-1">End Station:</div>
                             <div className="text-sm text-gray-900">{englishTranslation.end_station_name}</div>
                           </div>
                           
                           <div>
                             <div className="text-xs text-gray-500 mb-1">Number Words:</div>
                             <div className="text-sm font-mono text-gray-800">{englishTranslation.train_number_words}</div>
                           </div>
                         </div>
                       </div>
                     )}
                     
                     {/* Other Language Buttons */}
                     <div className="pt-3 border-t border-gray-200">
                       <div className="text-xs text-gray-500 mb-2">Other Languages:</div>
                       <div className="flex flex-wrap gap-2">
                         {otherLanguages.map(translation => (
                           <button
                             key={translation.language_code}
                             onClick={() => {
                               setSelectedTranslation(translation);
                               setIsTranslationModalOpen(true);
                             }}
                             className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors font-medium"
                           >
                             {getLanguageName(translation.language_code)}
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>

        {paginatedRouteIds.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? 'Loading translation records...' : 'No translation records found matching your criteria.'}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(filteredRouteIds.length / recordsPerPage) > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredRouteIds.length)} of {filteredRouteIds.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm rounded border ${
                  currentPage === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(filteredRouteIds.length / recordsPerPage)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === Math.ceil(filteredRouteIds.length / recordsPerPage)}
                className={`px-3 py-1 text-sm rounded border ${
                  currentPage === Math.ceil(filteredRouteIds.length / recordsPerPage)
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

    const renderAudioView = () => {
    // Group audio files by train route
    const groupedAudioFiles = audioFiles.reduce((acc, audioFile) => {
      if (!acc[audioFile.train_route_id]) {
        acc[audioFile.train_route_id] = [];
      }
      acc[audioFile.train_route_id].push(audioFile);
      return acc;
    }, {} as Record<number, AudioFile[]>);

    // Get unique route IDs
    const routeIds = Object.keys(groupedAudioFiles).map(Number);

    // Filter by search term
    const filteredRouteIds = routeIds.filter(routeId => {
      const route = getRouteInfo(routeId);
      const audioFilesForRoute = groupedAudioFiles[routeId];
      
      return searchTerm === '' || 
        (route?.train_name_en.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (route?.train_number.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        audioFilesForRoute.some(af => 
          getLanguageName(af.language_code).toLowerCase().includes(searchTerm.toLowerCase()) ||
          getAudioTypeName(af.audio_type).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Pagination
    const paginatedRouteIds = filteredRouteIds.slice(
      (currentPage - 1) * recordsPerPage,
      currentPage * recordsPerPage
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Text-to-Speech</h1>
            <p className="text-gray-600 text-xs">
              View and play AI-generated audio announcements for train routes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`px-3 py-1 text-white transition-colors text-xs font-medium w-20 h-8 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title="Refresh audio files"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleClearAllAudio}
              disabled={isLoading}
              className={`px-3 py-1 text-white transition-colors text-xs font-medium w-20 h-8 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title="Clear all audio files"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search audio files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-1 border border-gray-300 focus:ring-2 focus:border-transparent h-8"
                style={{'--tw-ring-color': '#337ab7'} as any}
              />
            </div>
          </div>
        </div>

        {/* Compact Audio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRouteIds.map(routeId => {
            const route = getRouteInfo(routeId);
            const audioFilesForRoute = groupedAudioFiles[routeId];
            const englishAudioFiles = audioFilesForRoute.filter(af => af.language_code === 'en');
            const otherLanguages = audioFilesForRoute.filter(af => af.language_code !== 'en');
            
            return (
              <div key={routeId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <div className="text-lg font-bold text-green-700 font-mono">Train #{route?.train_number || routeId}</div>
                  <div className="text-sm text-gray-600">{route?.train_name_en}</div>
                </div>
                
                {/* English Audio Files (Default) */}
                {englishAudioFiles.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-800">English</span>
                    </div>
                    
                    <div className="space-y-2">
                      {englishAudioFiles.map(audioFile => (
                        <div key={audioFile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500">{getAudioTypeName(audioFile.audio_type)}</div>
                            <div className="text-sm font-medium text-gray-900">
                              {getTranslationText(routeId, 'en', audioFile.audio_type)}
                            </div>
                          </div>
                          <button
                            onClick={() => playAudio(audioFile.audio_file_path)}
                            className="ml-2 p-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Play audio"
                          >
                            ▶️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Other Language Buttons */}
                {otherLanguages.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500 mb-2">Other Languages:</div>
                    <div className="flex flex-wrap gap-2">
                      {['hi', 'mr', 'gu'].map(lang => {
                        const langAudioFiles = audioFilesForRoute.filter(af => af.language_code === lang);
                        if (langAudioFiles.length === 0) return null;
                        
                        const getLanguageText = (langCode: string) => {
                          switch (langCode) {
                            case 'hi': return 'हिंदी';
                            case 'mr': return 'मराठी';
                            case 'gu': return 'ગુજરાતી';
                            default: return getLanguageName(langCode);
                          }
                        };
                        
                        return (
                          <button
                            key={lang}
                            onClick={() => handlePlayLanguageAudio(langAudioFiles, routeId)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors font-medium"
                          >
                            {getLanguageText(lang)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {paginatedRouteIds.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? 'Loading audio files...' : 'No audio files found matching your criteria.'}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(filteredRouteIds.length / recordsPerPage) > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredRouteIds.length)} of {filteredRouteIds.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 text-sm rounded border ${
                  currentPage === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, Math.ceil(filteredRouteIds.length / recordsPerPage)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded border ${
                      currentPage === pageNum
                        ? 'bg-green-600 text-white border-green-600'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === Math.ceil(filteredRouteIds.length / recordsPerPage)}
                className={`px-3 py-1 text-sm rounded border ${
                  currentPage === Math.ceil(filteredRouteIds.length / recordsPerPage)
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTranslationModal = () => {
    if (!selectedTranslation || !isTranslationModalOpen) return null;

    const route = getRouteInfo(selectedTranslation.train_route_id);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {getLanguageName(selectedTranslation.language_code)} Translation
            </h3>
            <button
              onClick={() => {
                setIsTranslationModalOpen(false);
                setSelectedTranslation(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Train Number:</div>
              <div className="text-lg font-mono text-blue-600">{selectedTranslation.train_number}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Train Name:</div>
              <div className="text-base text-gray-900">{selectedTranslation.train_name}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Start Station:</div>
              <div className="text-base text-gray-900">{selectedTranslation.start_station_name}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">End Station:</div>
              <div className="text-base text-gray-900">{selectedTranslation.end_station_name}</div>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Number in Words:</div>
              <div className="text-base font-mono text-gray-800">{selectedTranslation.train_number_words}</div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Original: {route?.train_name_en} ({route?.train_number})
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchTranslations();
    fetchRoutes();
    fetchAudioFiles();
  }, []);

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      
      {viewMode === 'categories' && renderCategories()}
      {viewMode === 'translations' && renderTranslationsView()}
      {viewMode === 'audio' && renderAudioView()}
      
      {renderTranslationModal()}
      {audioModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {getLanguageName(audioModal.language)} Audio
              </h3>
              <button
                onClick={() => setAudioModal(m => ({ ...m, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="mb-2 text-xs text-gray-500">
              Train #{audioModal.trainNumber} — {audioModal.routeName}
            </div>
            <div className="space-y-4">
              {audioModal.audioFiles.map(audioFile => (
                <div key={audioFile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">{getAudioTypeName(audioFile.audio_type)}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {getTranslationText(audioModal.routeId!, audioModal.language, audioFile.audio_type)}
                    </div>
                  </div>
                  <button
                    onClick={() => playAudio(audioFile.audio_file_path)}
                    className="ml-2 p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="Play audio"
                  >
                    ▶️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDatabase; 