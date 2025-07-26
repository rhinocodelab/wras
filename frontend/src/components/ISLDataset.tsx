import React, { useState, useEffect } from 'react';
import { Video, Play, Download, Eye, ChevronLeft, ChevronRight, RefreshCw, Trash2, Upload } from 'lucide-react';

interface ISLVideo {
  category: string;
  name: string;
  filename: string;
  path: string;
  size?: number;
}

const ISLDataset: React.FC = () => {
  const [videos, setVideos] = useState<ISLVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(5);
  const [selectedVideo, setSelectedVideo] = useState<ISLVideo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to fetch video data from backend
  const fetchVideoData = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend API first
      const response = await fetch('http://localhost:5001/api/v1/isl-videos/');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        // Fallback to hardcoded data if API doesn't exist
        console.log('Backend API not available, using hardcoded data');
        setVideos(videoData);
      }
    } catch (error) {
      console.log('Error fetching videos, using hardcoded data:', error);
      setVideos(videoData);
    } finally {
      setLoading(false);
    }
  };

  const videoData: ISLVideo[] = [
    // Numbers
    { category: 'numbers', name: 'Number 1', filename: '1.mp4', path: '1/1.mp4' },
    { category: 'numbers', name: 'Number 2', filename: '2.mp4', path: '2/2.mp4' },
    { category: 'numbers', name: 'Number 3', filename: '3.mp4', path: '3/3.mp4' },
    { category: 'numbers', name: 'One', filename: 'one.mp4', path: 'one/one.mp4' },
    { category: 'numbers', name: 'Two', filename: 'two.mp4', path: 'two/two.mp4' },
    { category: 'numbers', name: 'Three', filename: 'three.mp4', path: 'three/three.mp4' },
    
    // Train Terms
    { category: 'train_terms', name: 'Train', filename: 'train.mp4', path: 'train/train.mp4' },
    { category: 'train_terms', name: 'Platform', filename: 'platform.mp4', path: 'platform/platform.mp4' },
    { category: 'train_terms', name: 'Express', filename: 'express.mp4', path: 'express/express.mp4' },
    { category: 'train_terms', name: 'Running', filename: 'running.mp4', path: 'running/running.mp4' },
    
    // Status Terms
    { category: 'status_terms', name: 'Arrive', filename: 'arrive.mp4', path: 'arrive/arrive.mp4' },
    { category: 'status_terms', name: 'Arriving', filename: 'arriving.mp4', path: 'arriving/arriving.mp4' },
    { category: 'status_terms', name: 'Late', filename: 'late.mp4', path: 'late/late.mp4' },
    { category: 'status_terms', name: 'Cancelled', filename: 'cancelled.mp4', path: 'cancelled/cancelled.mp4' },
    { category: 'status_terms', name: 'Attention', filename: 'attention.mp4', path: 'attention/attention.mp4' },
    
    // Station Names
    { category: 'station_names', name: 'Bandra', filename: 'bandra.mp4', path: 'bandra/bandra.mp4' },
    { category: 'station_names', name: 'Vapi', filename: 'vapi.mp4', path: 'vapi/vapi.mp4' },
    
    // Other
    { category: 'other', name: 'Number', filename: 'number.mp4', path: 'number/number.mp4' }
  ];

  useEffect(() => {
    fetchVideoData();
  }, []);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'numbers', name: 'Numbers' },
    { id: 'train_terms', name: 'Train Terms' },
    { id: 'status_terms', name: 'Status Terms' },
    { id: 'station_names', name: 'Station Names' },
    { id: 'other', name: 'Other' }
  ];

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  // Pagination logic
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'numbers': return 'bg-blue-100 text-blue-800';
      case 'train_terms': return 'bg-green-100 text-green-800';
      case 'status_terms': return 'bg-yellow-100 text-yellow-800';
      case 'station_names': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'numbers': return '🔢';
      case 'train_terms': return '🚂';
      case 'status_terms': return '⏰';
      case 'station_names': return '🏢';
      case 'other': return '📝';
      default: return '📹';
    }
  };

  const handlePlayVideo = (video: ISLVideo) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = async () => {
    await fetchVideoData();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all videos? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:5001/api/v1/isl-videos/clear', {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchVideoData(); // Refresh the list
        } else {
          console.error('Failed to clear videos');
        }
      } catch (error) {
        console.error('Error clearing videos:', error);
      }
    }
  };

  const handleUpload = () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4';
    fileInput.multiple = true;
    
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Here you would typically upload the files to the backend
        // For now, we'll just show a message
        alert(`Selected ${files.length} video file(s). Upload functionality would be implemented here.`);
      }
    };
    
    fileInput.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ISL Dataset</h1>
          <p className="text-sm text-gray-600 mt-1">Indian Sign Language videos for railway announcements</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Refresh Dataset"
          >
            Refresh
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-xs text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
            title="Clear All Videos"
          >
            Clear All
          </button>
          <button
            onClick={handleUpload}
            className="px-3 py-1 text-xs text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
            title="Upload New Video"
          >
            Upload
          </button>
        </div>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedCategory === 'all' ? 'All Videos' : categories.find(c => c.id === selectedCategory)?.name} 
          ({filteredVideos.length})
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Video Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Category</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentVideos.map((video, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-800">{video.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(video.category)}`}>
                      {video.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handlePlayVideo(video)}
                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                      title="Play Video"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {indexOfFirstVideo + 1} to {Math.min(indexOfLastVideo, filteredVideos.length)} of {filteredVideos.length} videos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm rounded transition-colors ${
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
                className="p-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {isModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[70vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-800">{selectedVideo.name}</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-3">
              <div className="bg-gray-100 rounded-lg aspect-video max-w-md mx-auto">
                <video
                  className="w-full h-full object-cover rounded-lg"
                  controls
                  autoPlay
                >
                  <source src={`http://localhost:5001/isl_dataset/${selectedVideo.path}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(selectedVideo.category)}`}>
                    {selectedVideo.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Sign language video for "{selectedVideo.name.toLowerCase()}"</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-3 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISLDataset; 