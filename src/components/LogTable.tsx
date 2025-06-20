import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, AlertCircle, AlertTriangle, Info, Bug, Minus } from 'lucide-react';
import { LogEntry } from '../types/log';
import { format } from 'date-fns';

interface LogTableProps {
  logs: LogEntry[];
}

export function LogTable({ logs }: LogTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const filteredLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      const matchesSearch = searchTerm === '' || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
      
      return matchesSearch && matchesLevel;
    });

    // Sort by timestamp - newest first (oldest at bottom)
    filtered.sort((a, b) => {
      // Handle null timestamps - put them at the end
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      
      // Handle invalid timestamps by putting them at the end
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      
      return timeB - timeA; // Newest first
    });

    return filtered;
  }, [logs, searchTerm, selectedLevel]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      case 'DEBUG':
        return <Bug className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case 'TRACE':
        return <Minus className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'WARN':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'INFO':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'DEBUG':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'TRACE':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp || isNaN(timestamp.getTime())) {
      return 'N/A';
    }
    return format(timestamp, 'yyyy-MM-dd HH:mm:ss');
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Level', 'Message'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.level,
        `"${(log.source ? `[${log.source}] ` : '') + log.message.replace(/"/g, '""')}"` // Escape quotes in CSV
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const levels = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log Entries</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sorted by timestamp (newest first, oldest at bottom)</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              />
            </div>

            {/* Level filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Export button */}
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {paginatedLogs.length} of {filteredLogs.length} entries
            {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
          </span>
          
          <div className="flex items-center space-x-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Message
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-300">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(log.level)}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ${getLevelBadgeClass(log.level)}`}>
                      {log.level}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="font-mono text-xs leading-relaxed break-all">
                    {log.source && (
                      <span className="bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 mr-2">
                        {log.source}
                      </span>
                    )}
                    {log.message}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}