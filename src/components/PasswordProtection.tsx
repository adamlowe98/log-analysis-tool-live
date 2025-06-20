import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PasswordProtectionProps {
  onAuthenticated: () => void;
}

export function PasswordProtection({ onAuthenticated }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const correctPassword = 'PW25LOGTOOL!';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Small delay for better UX
    setTimeout(() => {
      if (password === correctPassword) {
        onAuthenticated();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 w-full max-w-md transition-colors duration-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 dark:bg-blue-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Log Analysis Tool</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter password to access the tool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                placeholder="Enter password"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-200">
              <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!password.trim() || isLoading}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Access Tool</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure access required for log analysis tool
          </p>
        </div>
      </div>
    </div>
  );
}