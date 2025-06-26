import React, { useState, useMemo } from 'react';
import { Search, Download, Clock, User, FileText, FolderOpen, MessageSquare } from 'lucide-react';
import { AuditEntry } from '../types/audit';
import { format } from 'date-fns';

interface AuditTableProps {
  entries: AuditEntry[];
}

/**
 * AuditTable Component
 * 
 * Displays audit trail entries in a searchable table format using the original
 * CSV column structure. Shows all audit events in a clean, readable format
 * that preserves the original ProjectWise audit trail information.
 */
export function AuditTable({ entries }: AuditTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) return entries;
    
    const searchLower = searchTerm.toLowerCase();
    return entries.filter(entry => 
      entry.action.toLowerCase().includes(searchLower) ||
      entry.user.toLowerCase().includes(searchLower) ||
      entry.document.toLowerCase().includes(searchLower) ||
      entry.folder.toLowerCase().includes(searchLower) ||
      entry.details.toLowerCase().includes(searchLower) ||
      (entry.application && entry.application.toLowerCase().includes(searchLower))
    );
  }, [entries, searchTerm]);

  // Paginate filtered entries
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEntries.slice(startIndex, startIndex + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp || isNaN(timestamp.getTime())) {
      return 'N/A';
    }
    return format(timestamp, 'yyyy-MM-dd HH:mm:ss');
  };

  const exportToCSV = () => {
    const headers = ['Date/Time', 'Action Name', 'User Name', 'Object Name', 'Path', 'Additional Data'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        formatTimestamp(entry.timestamp),
        `"${entry.action.replace(/"/g, '""')}"`,
        `"${entry.user.replace(/"/g, '""')}"`,
        `"${entry.document.replace(/"/g, '""')}"`,
        `"${entry.folder.replace(/"/g, '""')}"`,
        `"${entry.details.replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Header with search and export */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Audit Trail Events</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete audit trail showing all events in chronological order
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search audit events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
              />
            </div>

            {/* Export button */}
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {paginatedEntries.length} of {filteredEntries.length} events
            {filteredEntries.length !== entries.length && ` (filtered from ${entries.length} total)`}
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
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Action Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Object Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Path
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Additional Data
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
            {paginatedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <span className="font-medium">{entry.action}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span>{entry.user}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="max-w-xs">
                    {entry.document ? (
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                        {entry.document}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">No object</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="flex items-center space-x-2 max-w-xs">
                    {entry.folder ? (
                      <>
                        <FolderOpen className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                        <span className="truncate text-xs" title={entry.folder}>
                          {entry.folder}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">No path</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="max-w-xs">
                    {entry.details ? (
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2" title={entry.details}>
                          {entry.details}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">No additional data</span>
                    )}
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