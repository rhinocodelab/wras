import React, { useState } from 'react';
import { Train, Lock, User } from 'lucide-react';

interface LoginFormProps {
  onLogin: (success: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the token in localStorage
        localStorage.setItem('railway_token', data.access_token);
        onLogin(true);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid credentials. Please try again.');
        onLogin(false);
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
      onLogin(false);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white shadow-2xl overflow-hidden max-w-3xl w-full">
        <div className="flex">
          {/* Left Panel - Image/Branding */}
          <div className="w-1/2 p-4 flex flex-col justify-center items-center text-white" style={{background: 'linear-gradient(135deg, #337ab7, #2a6496)'}}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20 mb-3">
                <Train className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-lg font-bold mb-2">WRAS-DHH</h1>
              <p className="text-blue-100 text-xs leading-relaxed mb-3">
                Western Railway Announcement System<br />
                for Deaf and Hard of Hearing
              </p>
              <div className="w-12 h-0.5 bg-white bg-opacity-30 mx-auto mb-3"></div>
              <p className="text-blue-100 text-xs">
                Empowering accessibility through<br />
                visual railway announcements
              </p>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-1/2 p-6">
            <div className="h-full flex flex-col justify-center">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome Back</h2>
                <p className="text-gray-600 text-xs">Please sign in to your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition-all duration-200"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:outline-none transition-all duration-200"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-semibold py-2 px-4 text-sm focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#337ab7',
                    '--tw-ring-color': '#337ab7'
                  } as any}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#2a6496')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#337ab7')}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-3 p-2 bg-gray-50">
                <p className="text-xs text-gray-600 mb-1 font-medium">Default Credentials:</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    Username: <span className="font-mono bg-white px-1 py-0.5 border text-xs">admin</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Password: <span className="font-mono bg-white px-1 py-0.5 border text-xs">wras@dhh</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="text-center">
          <p className="text-xs text-gray-600">
            Designed and developed by Sundyne Technologies © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;