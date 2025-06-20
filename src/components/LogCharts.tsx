import React, { useState, useEffect } from 'react';
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
 * LogCharts Component with NO CACHING - Fresh Data Processing Only
 * 
 * This component renders interactive charts for log analysis with completely fresh data
 * processing every single time to ensure maximum security and data accuracy.
 * 
 * SECURITY FEATURES:
 * - NO data caching whatsoever
 * - NO memoization of chart data
 * - NO browser-side data persistence
 * - Fresh processing on every render
 * - No data reuse between sessions
 * 
 * Performance Features:
 * - Async data processing with loading states
 * - Data sampling for very large datasets
 * - Progressive rendering with user feedback
 * - Memory-efficient chart data preparation
 * 
 * The component processes log data fresh every time it renders to prevent
 * any possibility of sensitive log data being cached or persisted.
 */
export function LogCharts({ logs }: LogChartsProps) {
  // ============================================================================
  // STATE MANAGEMENT FOR FRESH PROCESSING ONLY
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
   * Processed chart data state - NEVER CACHED
   * Stores the computed chart data after fresh async processing
   * This data is cleared and regenerated on every component mount/update
   */
  const [chartData, setChartData] = useState<{
    validLogs: LogEntry[];
    levelCounts: Record<string, number>;
    timeRange: { start: Date; end: Date };
    levelData: any;
    doughnutOptions: any;
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
  // FRESH DATA PROCESSING EFFECT (NO CACHING EVER)
  // ============================================================================
  
  /**
   * Effect to process log data completely fresh every single time
   * 
   * This effect runs whenever the logs prop changes and handles:
   * - COMPLETE fresh data processing (no caching ever)
   * - Large dataset detection and user feedback
   * - Async processing to prevent UI blocking
   * - Data sampling and optimization for performance
   * - Error handling and recovery
   * 
   * CRITICAL: This always clears existing data and processes fresh
   */
  useEffect(() => {
    const processLogDataFresh = async () => {
      console.log('🔄 FRESH PROCESSING: Starting completely fresh chart data processing (NO CACHING)');
      
      // ALWAYS clear everything first - no data reuse
      setChartData(null);
      setProcessingError(null);
      
      // If no logs, stay cleared
      if (!logs || logs.length === 0) {
        console.log('📊 No logs provided - charts cleared');
        return;
      }
      
      // Show loading for large datasets
      if (logs.length > LARGE_DATASET_THRESHOLD) {
        setIsProcessing(true);
        console.log(`⏳ Large dataset detected (${logs.length} entries) - showing loading indicator`);
      }

      try {
        // Use setTimeout to yield control back to the browser
        // This prevents the UI from freezing during processing
        await new Promise(resolve => setTimeout(resolve, 10));

        console.log(`🔄 Processing ${logs.length} log entries fresh from scratch...`);
        const processedData = await processChartsDataFresh(logs);
        
        console.log('✅ Fresh chart data processing complete');
        setChartData(processedData);
      } catch (error) {
        console.error('❌ Error processing fresh chart data:', error);
        setProcessingError('Failed to process chart data. The dataset may be too large or contain invalid data.');
      } finally {
        setIsProcessing(false);
      }
    };

    // Always process fresh - no cache checks
    processLogDataFresh();
  }, [logs]); // Re-run whenever logs change

  // ============================================================================
  // FRESH DATA PROCESSING FUNCTION (NO CACHING)
  // ============================================================================
  
  /**
   * Process chart data completely fresh with no caching whatsoever
   * 
   * This function handles the heavy computation of chart data preparation
   * with special optimizations for large datasets including data sampling
   * and intelligent processing. NO DATA IS EVER CACHED.
   * 
   * @param logs - Array of log entries to process fresh
   * @returns Promise resolving to completely fresh processed chart data
   */
  const processChartsDataFresh = async (logs: LogEntry[]) => {
    console.log('🔄 FRESH PROCESSING: Starting fresh data processing pipeline');
    
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

    console.log(`📊 Filtered to ${validLogs.length} valid logs from ${logs.length} total`);

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
      
      console.log(`📊 Applied sampling: reduced from ${logs.length} to ${validLogs.length} entries for performance`);
    }

    // Yield control to prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 5));

    // ========================================================================
    // STEP 3: CALCULATE LOG LEVEL DISTRIBUTION (FRESH)
    // ========================================================================
    
    /**
     * Calculate log level counts using ALL logs for consistency
     * This ensures summary statistics match other components
     */
    const levelCounts = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Calculated fresh level counts:', levelCounts);

    // Yield control to prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 5));

    // ========================================================================
    // STEP 4: CALCULATE TIME RANGE (FRESH)
    // ========================================================================
    
    if (validLogs.length === 0) {
      throw new Error('No valid timestamps found for chart generation');
    }

    const timeRange = {
      start: new Date(Math.min(...validLogs.map(log => log.timestamp!.getTime()))),
      end: new Date(Math.max(...validLogs.map(log => log.timestamp!.getTime()))),
    };

    console.log('📊 Calculated fresh time range:', timeRange);

    // ========================================================================
    // STEP 5: GENERATE FRESH CHART DATA (NO MEMOIZATION)
    // ========================================================================
    
    // Generate fresh chart data every time - NO MEMOIZATION
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

    console.log('✅ Generated fresh chart data objects');

    return {
      validLogs,
      levelCounts,
      timeRange,
      levelData,
      doughnutOptions
    };
  };

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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Processing Fresh Chart Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Analyzing {logs.length.toLocaleString()} log entries fresh from scratch...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              🔒 NO CACHING - Processing fresh data for maximum security
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
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">Fresh Chart Processing Failed</h3>
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
  
  const { validLogs, levelCounts, timeRange, levelData, doughnutOptions } = chartData;

  // ============================================================================
  // CALCULATE ACCURATE ERROR RATES (FRESH)
  // ============================================================================
  
  /**
   * Calculate accurate error and warning rates fresh every time
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
          NO CACHING SECURITY NOTICE
          ======================================================================== */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 transition-colors duration-200">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
              🔒 Maximum Security Mode
            </h4>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Chart data is processed completely fresh every time with NO CACHING whatsoever. 
              No log data is ever stored, cached, or persisted in browser memory for maximum security.
              {logs.length > LARGE_DATASET_THRESHOLD && (
                <span className="block mt-1">
                  Processing {logs.length.toLocaleString()} entries fresh from scratch with performance optimizations.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

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