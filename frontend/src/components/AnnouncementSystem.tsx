import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, Settings } from 'lucide-react';

interface Station {
  id: string;
  code: string;
  name: string;
  state: string;
  zone: string;
}

interface Announcement {
  id: string;
  trainNumber: string;
  trainName: string;
  fromStation: string;
  toStation: string;
  platform: string;
  expectedTime: string;
  status: 'arriving' | 'departing' | 'delayed' | 'cancelled';
  message: string;
}

const AnnouncementSystem: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
    trainNumber: '',
    trainName: '',
    fromStation: '',
    toStation: '',
    platform: '',
    expectedTime: '',
    status: 'arriving',
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<string>('');

  useEffect(() => {
    const savedStations = localStorage.getItem('railway_stations');
    if (savedStations) {
      setStations(JSON.parse(savedStations));
    }

    const savedAnnouncements = localStorage.getItem('railway_announcements');
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    }
  }, []);

  const generateAnnouncement = (announcement: Announcement): string => {
    const stationName = stations.find(s => s.code === announcement.fromStation)?.name || announcement.fromStation;
    const destinationName = stations.find(s => s.code === announcement.toStation)?.name || announcement.toStation;

    switch (announcement.status) {
      case 'arriving':
        return `Attention passengers, Train number ${announcement.trainNumber}, ${announcement.trainName} from ${stationName} to ${destinationName} is arriving on platform number ${announcement.platform} at ${announcement.expectedTime}. Please stand clear of the platform edge.`;
      case 'departing':
        return `Attention passengers, Train number ${announcement.trainNumber}, ${announcement.trainName} from ${stationName} to ${destinationName} will depart from platform number ${announcement.platform} at ${announcement.expectedTime}. Please board the train immediately.`;
      case 'delayed':
        return `Passengers are informed that Train number ${announcement.trainNumber}, ${announcement.trainName} from ${stationName} to ${destinationName} is running late by approximately 30 minutes. The expected arrival time is ${announcement.expectedTime}.`;
      case 'cancelled':
        return `Attention passengers, Train number ${announcement.trainNumber}, ${announcement.trainName} from ${stationName} to ${destinationName} scheduled at ${announcement.expectedTime} has been cancelled. We regret the inconvenience caused.`;
      default:
        return announcement.message || '';
    }
  };

  const handleAddAnnouncement = () => {
    if (newAnnouncement.trainNumber && newAnnouncement.trainName) {
      const announcement: Announcement = {
        id: Date.now().toString(),
        trainNumber: newAnnouncement.trainNumber || '',
        trainName: newAnnouncement.trainName || '',
        fromStation: newAnnouncement.fromStation || '',
        toStation: newAnnouncement.toStation || '',
        platform: newAnnouncement.platform || '',
        expectedTime: newAnnouncement.expectedTime || '',
        status: newAnnouncement.status || 'arriving',
        message: '',
      };
      
      announcement.message = generateAnnouncement(announcement);
      
      const updatedAnnouncements = [...announcements, announcement];
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('railway_announcements', JSON.stringify(updatedAnnouncements));
      
      setNewAnnouncement({
        trainNumber: '',
        trainName: '',
        fromStation: '',
        toStation: '',
        platform: '',
        expectedTime: '',
        status: 'arriving',
      });
    }
  };

  const playAnnouncement = (announcement: Announcement) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      setCurrentAnnouncement(announcement.id);
      
      const utterance = new SpeechSynthesisUtterance(announcement.message);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentAnnouncement('');
      };
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopAnnouncement = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentAnnouncement('');
    }
  };

  const deleteAnnouncement = (id: string) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(updatedAnnouncements);
    localStorage.setItem('railway_announcements', JSON.stringify(updatedAnnouncements));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Announcement System</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Volume2 className="w-4 h-4" />
          <span>Text-to-Speech Enabled</span>
        </div>
      </div>

      {/* Create New Announcement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Announcement</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Train Number</label>
            <input
              type="text"
              value={newAnnouncement.trainNumber || ''}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, trainNumber: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder="e.g., 12951"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Train Name</label>
            <input
              type="text"
              value={newAnnouncement.trainName || ''}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, trainName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder="e.g., Mumbai Rajdhani Express"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Station</label>
            <select
              value={newAnnouncement.fromStation || ''}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, fromStation: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
            >
              <option value="">Select Station</option>
              {stations.map(station => (
                <option key={station.id} value={station.code}>
                  {station.code} - {station.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Station</label>
            <select
              value={newAnnouncement.toStation || ''}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, toStation: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
            >
              <option value="">Select Station</option>
              {stations.map(station => (
                <option key={station.id} value={station.code}>
                  {station.code} - {station.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <input
              type="text"
              value={newAnnouncement.platform || ''}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, platform: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
              placeholder="e.g., 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Time</label>
            <input
              type="time"
              value={newAnnouncement.expectedTime || ''}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, expectedTime: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={newAnnouncement.status || 'arriving'}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, status: e.target.value as any})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{'--tw-ring-color': '#337ab7'} as any}
            >
              <option value="arriving">Arriving</option>
              <option value="departing">Departing</option>
              <option value="delayed">Delayed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleAddAnnouncement}
          className="text-white px-6 py-3 rounded-lg transition-colors duration-200"
          style={{backgroundColor: '#337ab7'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a6496'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#337ab7'}
        >
          Create Announcement
        </button>
      </div>

      {/* Active Announcements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Announcements</h2>
        
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No announcements created yet. Create your first announcement above.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-lg">{announcement.trainNumber}</span>
                      <span className="text-gray-600">{announcement.trainName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        announcement.status === 'arriving' ? 'bg-green-100 text-green-800' :
                        announcement.status === 'departing' ? 'text-white' :
                        announcement.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                      style={announcement.status === 'departing' ? {backgroundColor: '#337ab7'} : {}}>
                        {announcement.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {announcement.fromStation} → {announcement.toStation} | Platform {announcement.platform} | {announcement.expectedTime}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {currentAnnouncement === announcement.id && isPlaying ? (
                      <button
                        onClick={stopAnnouncement}
                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => playAnnouncement(announcement)}
                        disabled={isPlaying}
                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                  {announcement.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementSystem;