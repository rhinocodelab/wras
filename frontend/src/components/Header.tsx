import React from 'react';
import { Train, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
  username?: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout, username = 'Admin' }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Left side - Title and Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{background: 'linear-gradient(to bottom, #337ab7, #2a6496)'}}>
            <Train className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">WRAS-DHH</h1>
            <p className="text-sm text-gray-600">Western Railway Announcement System</p>
          </div>
        </div>

        {/* Right side - Welcome message and Logout */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <User className="w-4 h-4" />
            <span className="text-sm">
              Welcome, <span className="font-semibold text-blue-600">{username}</span>
            </span>
          </div>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 