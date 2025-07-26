import React from 'react';
import { Home, Route, Volume2, Upload, Database } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'routes', label: 'Route Management', icon: Route },
    { id: 'announcements', label: 'Announcements', icon: Volume2 },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'ai-database', label: 'AI Database', icon: Database },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 relative text-sm ${
                  activeTab === item.id
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {activeTab === item.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-full"></div>
                )}
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>


    </div>
  );
};

export default Sidebar;