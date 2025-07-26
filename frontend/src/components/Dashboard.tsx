import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import TrainSearch from './TrainSearch';
import RouteManagement from './RouteManagement';
import AnnouncementSystem from './AnnouncementSystem';
import ImportData from './ImportData';
import AIDatabase from './AIDatabase';
import AnnouncementTemplates from './AnnouncementTemplates';
import ISLDataset from './ISLDataset';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TrainSearch />;
      case 'routes':
        return <RouteManagement />;
      case 'announcements':
        return <AnnouncementSystem />;
      case 'import':
        return <ImportData />;
      case 'ai-database':
        return <AIDatabase />;
      case 'announcement-templates':
        return <AnnouncementTemplates />;
      case 'isl-dataset':
        return <ISLDataset />;
      default:
        return <TrainSearch />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      {/* Full Width Header */}
      <Header onLogout={onLogout} />
      
      {/* Centered Content */}
      <div className="flex flex-1 justify-center">
        <div className="flex max-w-7xl w-full -ml-16">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
          />
          <div className="flex-1 overflow-auto">
            <div className="p-6 pl-4 pb-20">
              {renderActiveComponent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 z-10">
        <div className="text-center">
          <p className="text-xs text-gray-600">
            Designed and developed by Sundyne Technologies © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;