import React from 'react';
import { AlertTriangle, CheckCircle, Info, Bug, AlertCircle, Clock, FileText } from 'lucide-react';
import { LogSummary as LogSummaryType } from '../types/log';
import { format } from 'date-fns';

interface LogSummaryProps {
  summary: LogSummaryType;
}

export function LogSummary({ summary }: LogSummaryProps) {
  const stats = [
    {
      name: 'Total Entries',
      value: summary.totalEntries.toLocaleString(),
      icon: FileText,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
    },
    {
      name: 'Errors',
      value: summary.errorCount.toLocaleString(),
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      name: 'Warnings',
      value: summary.warningCount.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      name: 'Info',
      value: summary.infoCount.toLocaleString(),
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'Debug',
      value: summary.debugCount.toLocaleString(),
      icon: Bug,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-2 rounded-lg transition-colors duration-200`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Range */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Time Range</h3>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Start:</span>
              <span className="ml-2 font-mono text-sm text-gray-900 dark:text-gray-100">
                {format(summary.timeRange.start, 'yyyy-MM-dd HH:mm:ss')}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">End:</span>
              <span className="ml-2 font-mono text-sm text-gray-900 dark:text-gray-100">
                {format(summary.timeRange.end, 'yyyy-MM-dd HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Health Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Error Rate</span>
              <span className={`text-sm font-medium ${
                summary.errorCount / summary.totalEntries > 0.1 ? 'text-red-600 dark:text-red-400' : 
                summary.errorCount / summary.totalEntries > 0.05 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {((summary.errorCount / summary.totalEntries) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Critical Issues</span>
              <span className={`text-sm font-medium ${
                summary.criticalErrors.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {summary.criticalErrors.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Errors */}
      {summary.criticalErrors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Critical Errors</h3>
          </div>
          <div className="space-y-3">
            {summary.criticalErrors.slice(0, 5).map((error) => (
              <div key={error.id} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
                      {error.message}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {error.timestamp ? format(error.timestamp, 'yyyy-MM-dd HH:mm:ss') : 'No timestamp'}
                      {error.source && ` • ${error.source}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Errors */}
      {summary.topErrors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Frequent Errors</h3>
          </div>
          <div className="space-y-3">
            {summary.topErrors.map((error, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                <div className="flex-1">
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate pr-4">
                    {error.message}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2 py-1 rounded transition-colors duration-200">
                  {error.count}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}