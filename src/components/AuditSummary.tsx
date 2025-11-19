import React from 'react';
import { AlertTriangle, CheckCircle, Info, FileX, Move, RefreshCw, Replace, Clock, FileText, Users, Activity } from 'lucide-react';
import { AuditSummary as AuditSummaryType } from '../types/audit';
import { format } from 'date-fns';

interface AuditSummaryProps {
  summary: AuditSummaryType;
}

export function AuditSummary({ summary }: AuditSummaryProps) {
  const stats = [
    {
      name: 'Total Entries',
      value: summary.totalEntries.toLocaleString(),
      icon: FileText,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
    },
    {
      name: 'Missing Files',
      value: summary.fileMissingCount.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      name: 'Deleted Files',
      value: summary.fileDeletedCount.toLocaleString(),
      icon: FileX,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      name: 'File Operations',
      value: summary.fileOperationsCount.toLocaleString(),
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      name: 'Security Events',
      value: summary.securityEventsCount.toLocaleString(),
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Period</h3>
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

        {/* Investigation Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <Activity className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Investigation Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Key Events Found</span>
              <span className={`text-sm font-medium ${
                summary.keyEvents.length > 10 ? 'text-red-600 dark:text-red-400' : 
                summary.keyEvents.length > 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {summary.keyEvents.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Deletion Rate</span>
              <span className={`text-sm font-medium ${
                summary.deletionCount / summary.totalEntries > 0.1 ? 'text-red-600 dark:text-red-400' : 
                summary.deletionCount / summary.totalEntries > 0.05 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {((summary.deletionCount / summary.totalEntries) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Events Requiring Investigation */}
      {summary.keyEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Key Events Requiring Investigation</h3>
          </div>
          <div className="space-y-3">
            {summary.keyEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="bg-red-600 dark:bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {event.action}
                      </span>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {event.timestamp ? format(event.timestamp, 'yyyy-MM-dd HH:mm:ss') : 'No timestamp'}
                      </span>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <strong>User:</strong> {event.user} | <strong>Document:</strong> {event.document || 'N/A'}
                    </p>
                    {event.folder && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        <strong>Folder:</strong> {event.folder}
                      </p>
                    )}
                    {event.details && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        <strong>Details:</strong> {event.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Users */}
      {summary.mostActiveUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Active Users</h3>
          </div>
          <div className="space-y-3">
            {summary.mostActiveUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 dark:bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {user.user}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2 py-1 rounded transition-colors duration-200">
                  {user.count} actions
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Documents */}
      {summary.mostAffectedResources.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Affected Resources</h3>
          </div>
          <div className="space-y-3">
            {summary.mostAffectedResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors duration-200">
                <div className="flex-1">
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200 truncate pr-4">
                    {resource.resource}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 px-2 py-1 rounded transition-colors duration-200">
                  {resource.count} events
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}