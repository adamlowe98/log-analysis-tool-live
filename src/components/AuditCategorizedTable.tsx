import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, FileX, Move, RefreshCw, Replace, MoreHorizontal, AlertTriangle, Clock, User, FolderOpen, FileText } from 'lucide-react';
import { AuditEntry, AuditCategory, CategorizedAuditEntries } from '../types/audit';
import { categorizeAllEntries } from '../utils/auditParser';
import { format } from 'date-fns';

interface AuditCategorizedTableProps {
  entries: AuditEntry[];
}

export function AuditCategorizedTable({ entries }: AuditCategorizedTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AuditCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Reduced default page size for better readability

  // Categorize entries
  const categorizedEntries = useMemo(() => categorizeAllEntries(entries), [entries]);

  // Get entries for selected category
  const filteredEntries = useMemo(() => {
    let categoryEntries: AuditEntry[];
    
    if (selectedCategory === 'all') {
      categoryEntries = entries;
    } else {
      categoryEntries = categorizedEntries[selectedCategory];
    }

    // Apply search filter
    if (searchTerm) {
      categoryEntries = categoryEntries.filter(entry => 
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.folder.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return categoryEntries;
  }, [entries, categorizedEntries, selectedCategory, searchTerm]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredEntries.slice(startIndex, startIndex + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredEntries.length / pageSize);

  const getCategoryIcon = (category: AuditCategory | 'all') => {
    switch (category) {
      case 'deletion':
        return <FileX className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case 'movement':
        return <Move className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
      case 'checkinout':
        return <RefreshCw className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
      case 'replacement':
        return <Replace className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
      case 'other':
        return <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
      default:
        return <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getCategoryBadgeClass = (category: AuditCategory) => {
    switch (category) {
      case 'deletion':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'movement':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'checkinout':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'replacement':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp || isNaN(timestamp.getTime())) {
      return 'N/A';
    }
    return format(timestamp, 'MMM dd, yyyy HH:mm:ss');
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Category', 'Action', 'User', 'Document', 'Folder', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => {
        const category = Object.entries(categorizedEntries).find(([, entries]) => 
          entries.some(e => e.id === entry.id)
        )?.[0] || 'other';
        
        return [
          formatTimestamp(entry.timestamp),
          category,
          entry.action,
          entry.user,
          `"${entry.document.replace(/"/g, '""')}"`,
          `"${entry.folder.replace(/"/g, '""')}"`,
          `"${entry.details.replace(/"/g, '""')}"`,
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${selectedCategory}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { id: 'all', name: 'All Events', count: entries.length },
    { id: 'deletion', name: 'Deletion Events', count: categorizedEntries.deletion.length },
    { id: 'movement', name: 'Movement Events', count: categorizedEntries.movement.length },
    { id: 'checkinout', name: 'Check-in/Check-out', count: categorizedEntries.checkinout.length },
    { id: 'replacement', name: 'Replacement Events', count: categorizedEntries.replacement.length },
    { id: 'other', name: 'Other Events', count: categorizedEntries.other.length },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categorized Audit Events</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Events organized by investigation category for systematic analysis
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 w-64"
              />
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

        {/* Category Tabs */}
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id as AuditCategory | 'all');
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-800 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {getCategoryIcon(category.id as AuditCategory | 'all')}
              <span>{category.name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                selectedCategory === category.id
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}>
                {category.count}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
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
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Table with Better Spacing */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                Timestamp
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-48">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Document & Location
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-64">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
            {paginatedEntries.map((entry) => {
              // Determine category for this entry
              const category = Object.entries(categorizedEntries).find(([, entries]) => 
                entries.some(e => e.id === entry.id)
              )?.[0] as AuditCategory || 'other';

              return (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  {/* Timestamp Column */}
                  <td className="px-6 py-5 text-sm font-mono text-gray-600 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category)}
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border transition-colors duration-200 ${getCategoryBadgeClass(category)}`}>
                          {entry.action}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* User Column */}
                  <td className="px-6 py-5 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                        {entry.user.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{entry.user}</span>
                        {entry.application && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded mt-1">
                            {entry.application}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Document & Location Column */}
                  <td className="px-6 py-5 text-sm text-gray-900 dark:text-gray-100">
                    <div className="space-y-3">
                      {/* Document */}
                      {entry.document && (
                        <div className="flex items-start space-x-2">
                          <FileText className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Document</span>
                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded mt-1 break-all">
                              {entry.document}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Folder/Path */}
                      {entry.folder && (
                        <div className="flex items-start space-x-2">
                          <FolderOpen className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Path</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-all">
                              {entry.folder}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Details Column */}
                  <td className="px-6 py-5 text-sm text-gray-900 dark:text-gray-100">
                    <div className="max-w-xs">
                      {entry.details ? (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {entry.details}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic text-xs">No additional details</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200 font-medium"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200 font-medium"
            >
              Next
            </button>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: {filteredEntries.length} events
          </div>
        </div>
      )}
    </div>
  );
}