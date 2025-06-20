import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { LogEntry } from '../types/log';
import { format, startOfMinute, endOfMinute, eachMinuteOfInterval, differenceInMinutes, startOfHour, endOfHour, eachHourOfInterval, addMinutes } from 'date-fns';
import { Loader2, AlertCircle, Clock, BarChart3, TrendingUp, PieChart } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement
);

interface LogChartsProps {
  logs: LogEntry[];
}

/**
 * LogCharts Component with Fresh Data Processing
 * 
 * This component renders interactive charts for log analysis with fresh data
 * processing every time to ensure data security and accuracy.
 * 
 * Features:
 * - Fresh data processing on every render - no caching
 * - TRACE log level support in charts
 * - Performance optimizations for large datasets
 * - Coming soon section for future chart additions
 * 
 * Performance Features:
 * - Async data processing with loading states
 * - Data sampling for very large datasets
 * - Progressive rendering with user feedback
 * - Memory-efficient chart data preparation
 * 
 * Security Features:
 * - No data caching to prevent sensitive log data persistence
 * - Fresh processing ensures data accuracy
 * - No browser-side data storage
 * 
 * The component uses React hooks to manage async processing and provides
 * visual feedback during chart preparation for datasets over 10,000 entries.
 */
export function LogCharts({ logs }: LogChartsProps) {
  // ============================================================================
  // STATE MANAGEMENT FOR PERFORMANCE
  // ============================================================================
  
  /**
   * Loading state management for async chart data processing
   * Prevents UI blocking during heavy computations
   */
  const [isProcessing, setIsProcessing] = useState(false);
  
  /**
   * Error state for handling processing failures
   * Provides user feedback when chart generation fails
   */
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  /**
   * Processed chart data state
   * Stores the computed chart data after async processing
   */
  const [chartData, setChartData] = useState<{
    validLogs: LogEntry[];
    levelCounts: Record<string, number>;
    timeRange: { start: Date; end: Date };
  } | null>(null);

  // ============================================================================
  // PERFORMANCE CONSTANTS
  // ============================================================================
  
  /**
   * Performance thresholds for different optimization strategies
   */
  const LARGE_DATASET_THRESHOLD = 10000;  // Show loading for datasets larger than this
  const VERY_LARGE_DATASET_THRESHOLD = 50000;  // Apply aggressive sampling for datasets larger than this

  // ============================================================================
  // FRESH DATA PROCESSING EFFECT (NO CACHING)
  // ============================================================================
  
  /**
   * Effect to process log data asynchronously with fresh processing every time
   * 
   * This effect runs whenever the logs prop changes and handles:
   * - Fresh data processing (no caching for security)
   * - Large dataset detection and user feedback
   * - Async processing to prevent UI blocking
   * - Data sampling and optimization for performance
   * - Error handling and recovery
   */
  useEffect(() => {
    const processLogData = async () => {
      // Reset error state
      setProcessingError(null);
      
      // If no logs, clear everything
      if (!logs || logs.length === 0) {
        setChartData(null);
        return;
      }
      
      // Always clear existing chart data for fresh processing
      setChartData(null);
      
      // Show loading for large datasets
      if (logs.length > LARGE_DATASET_THRESHOLD) {
        setIsProcessing(true);
      }

      try {
        // Use setTimeout to yield control back to the browser
        // This prevents the UI from freezing during processing
        await new Promise(resolve => setTimeout(resolve, 10));

        console.log('Processing fresh chart data (no caching)...');
        const processedData = await processChartsData(logs);
        
        setChartData(processedData);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setProcessingError('Failed to process chart data. The dataset may be too large or contain invalid data.');
      } finally {
        setIsProcessing(false);
      }
    };

    processLogData();
  }, [logs]);

  // ============================================================================
  // ASYNC DATA PROCESSING FUNCTION
  // ============================================================================
  
  /**
   * Process chart data asynchronously with performance optimizations
   * 
   * This function handles the heavy computation of chart data preparation
   * with special optimizations for large datasets including data sampling
   * and intelligent processing.
   * 
   * @param logs - Array of log entries to process
   * @returns Promise resolving to processed chart data
   */
  const processChartsData = async (logs: LogEntry[]) => {
    // ========================================================================
    // STEP 1: FILTER VALID LOGS WITH PERFORMANCE OPTIMIZATION
    // ========================================================================
    
    let validLogs = logs.filter(log => 
      log.timestamp &&
      !isNaN(log.timestamp.getTime()) && 
      log.timestamp.getFullYear() > 2020 && 
      log.timestamp.getFullYear() < 2030 &&
      log.timestamp.getTime() > new Date('2020-01-01').getTime()
    );

    // ========================================================================
    // STEP 2: DATA SAMPLING FOR VERY LARGE DATASETS
    // ========================================================================
    
    /**
     * For very large datasets, apply intelligent sampling to maintain
     * chart readability while preserving data distribution patterns
     */
    if (validLogs.length > VERY_LARGE_DATASET_THRESHOLD) {
      // Sample every nth entry to reduce dataset size
      const sampleRate = Math.ceil(validLogs.length / VERY_LARGE_DATASET_THRESHOLD);
      validLogs = validLogs.filter((_, index) => index % sampleRate === 0);
      
      console.log(`Applied sampling: reduced from ${logs.length} to ${validLogs.length} entries for performance`);
    }

    // Yield control to prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 5));

    // ========================================================================
    // STEP 3: CALCULATE LOG LEVEL DISTRIBUTION
    // ========================================================================
    
    /**
     * Calculate log level counts using ALL logs for consistency
     * This ensures summary statistics match other components
     */
    const levelCounts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Yield control to prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 5));

    // ========================================================================
    // STEP 4: CALCULATE TIME RANGE
    // ========================================================================
    
    if (validLogs.length === 0) {
      throw new Error('No valid timestamps found for chart generation');
    }

    const timeRange = {
      start: new Date(Math.min(...validLogs.map(log => log.timestamp!.getTime()))),
      end: new Date(Math.max(...validLogs.map(log => log.timestamp!.getTime()))),
    };

    return {
      validLogs,
      levelCounts,
      timeRange
    };
  };

  // ============================================================================
  // MEMOIZED CHART DATA PREPARATION
  // ============================================================================
  
  /**
   * Memoized chart data objects to prevent unnecessary re-renders
   * Only recalculates when processed chart data changes
   * Now includes TRACE level in all chart configurations
   */
  const { levelData, doughnutOptions } = useMemo(() => {
    if (!chartData) {
      return {
        levelData: null,
        doughnutOptions: null
      };
    }

    const { levelCounts } = chartData;

    // ========================================================================
    // LEVEL DISTRIBUTION CHART DATA (INCLUDING TRACE)
    // ========================================================================
    
    const levelColors = {
      'ERROR': '#ef4444',    // Red
      'WARN': '#f59e0b',     // Yellow/Orange
      'INFO': '#3b82f6',     // Blue
      'DEBUG': '#10b981',    // Green
      'TRACE': '#8b5cf6',    // Purple
    };

    const orderedLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const chartLabels = orderedLevels.filter(level => levelCounts[level] > 0);
    const chartDataValues = chartLabels.map(level => levelCounts[level]);
    const chartColors = chartLabels.map(level => levelColors[level as keyof typeof levelColors]);

    const levelData = {
      labels: chartLabels,
      datasets: [
        {
          data: chartDataValues,
          backgroundColor: chartColors,
          borderWidth: 0,
        },
      ],
    };

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: chartLabels.length > 10 ? false : {
        duration: 300,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
            usePointStyle: true,
            padding: 15,
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
            }
          }
        },
      },
    };

    return {
      levelData,
      doughnutOptions
    };
  }, [chartData]);

  // ============================================================================
  // LOADING STATE RENDER
  // ============================================================================
  
  /**
   * Show loading state for large datasets
   * Provides user feedback during async processing
   */
  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Processing Chart Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Analyzing {logs.length.toLocaleString()} log entries...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Processing fresh data for security and accuracy
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE RENDER
  // ============================================================================
  
  /**
   * Show error state if processing fails
   * Provides user feedback and potential solutions
   */
  if (processingError) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200">
        <div className="text-center space-y-4 p-8">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Chart Processing Failed</h3>
            <p className="text-sm text-red-700 dark:text-red-400 mt-2 max-w-md">
              {processingError}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-2">
              Try refreshing the page or uploading a smaller log file
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // NO DATA STATE RENDER
  // ============================================================================
  
  /**
   * Show no data state when no valid timestamps are found
   */
  if (!chartData || chartData.validLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No valid timestamps found in log data for charting</p>
        <p className="text-sm mt-2">Charts require logs with proper timestamp formats</p>
      </div>
    );
  }

  // ============================================================================
  // MAIN CHARTS RENDER
  // ============================================================================
  
  const { validLogs, levelCounts, timeRange } = chartData;

  // ============================================================================
  // CALCULATE ACCURATE ERROR RATES
  // ============================================================================
  
  /**
   * Calculate accurate error and warning rates
   * Ensure we're using the correct total count and handling edge cases
   */
  const totalEntries = logs.length;
  const errorCount = levelCounts.ERROR || 0;
  const warningCount = levelCounts.WARN || 0;
  
  // Calculate percentages with proper error handling
  const errorRate = totalEntries > 0 ? ((errorCount / totalEntries) * 100).toFixed(1) : '0.0';
  const warningRate = totalEntries > 0 ? ((warningCount / totalEntries) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* ========================================================================
          PERFORMANCE NOTICE FOR LARGE DATASETS
          ======================================================================== */}
      {logs.length > LARGE_DATASET_THRESHOLD && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Large Dataset Processing
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                {logs.length > VERY_LARGE_DATASET_THRESHOLD 
                  ? `Dataset contains ${logs.length.toLocaleString()} entries. Applied intelligent sampling for optimal performance.`
                  : `Processing ${logs.length.toLocaleString()} entries with performance optimizations enabled.`
                }
                <span className="block mt-1">Fresh data processing ensures security and accuracy - no caching applied.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          SUMMARY STATS (INCLUDING TRACE) WITH CORRECTED ERROR RATES
          ======================================================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalEntries.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Entries</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{errorCount.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{warningCount.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(levelCounts.INFO || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Info</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{(levelCounts.TRACE || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Trace</div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Time Range: {format(timeRange.start, 'yyyy-MM-dd HH:mm')} to {format(timeRange.end, 'yyyy-MM-dd HH:mm')}
          {validLogs.length !== logs.length && (
            <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Note: {logs.length - validLogs.length} entries with invalid timestamps excluded from timeline charts
            </div>
          )}
          {logs.length > VERY_LARGE_DATASET_THRESHOLD && (
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Showing sampled data ({validLogs.length.toLocaleString()} of {logs.length.toLocaleString()} entries) for optimal performance
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ====================================================================
            LOG LEVELS DISTRIBUTION (INCLUDING TRACE)
            ==================================================================== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Log Levels Distribution</h3>
          <div className="h-64">
            {levelData && <Doughnut data={levelData} options={doughnutOptions} />}
          </div>
        </div>

        {/* ====================================================================
            ANALYSIS SUMMARY WITH CORRECTED ERROR RATES
            ==================================================================== */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Summary</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalEntries.toLocaleString()}</div>
              <div className="text-lg text-gray-700 dark:text-gray-300">Total Log Entries Analyzed</div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{errorRate}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">({errorCount} errors)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{warningRate}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Warning Rate</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">({warningCount} warnings)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================
          MORE CHARTS COMING SOON SECTION
          ====================================================================== */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-8 transition-colors duration-200">
        <div className="text-center space-y-6">
          <div className="flex justify-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <PieChart className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              More Charts Coming Soon!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're working on exciting new visualization features to help you analyze your logs even better. 
              Stay tuned for timeline analysis, error pattern detection, and advanced filtering capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Timeline Analysis</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Interactive timeline charts with customizable intervals and trend analysis
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Error Patterns</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Advanced pattern recognition and error correlation analysis
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <div className="flex items-center space-x-2 mb-2">
                <PieChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Custom Views</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Personalized dashboards and custom chart configurations
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Have suggestions for new chart types? Let us know what visualizations would help your log analysis workflow!
          </div>
        </div>
      </div>
    </div>
  );
}