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
import { Loader2, AlertCircle, Clock } from 'lucide-react';

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
 * Chart cache to store processed chart data
 * Prevents reprocessing when switching between tabs
 */
interface ChartCache {
  logsHash: string;
  data: {
    validLogs: LogEntry[];
    levelCounts: Record<string, number>;
    timelineDataCache: Record<string, any[]>; // Cache for different intervals
    timeRange: { start: Date; end: Date };
  };
}

// Global chart cache - persists across component unmounts
let chartCache: ChartCache | null = null;

/**
 * Time interval options similar to Grafana
 */
const TIME_INTERVALS = [
  { value: '1m', label: '1 minute', minutes: 1 },
  { value: '5m', label: '5 minutes', minutes: 5 },
  { value: '15m', label: '15 minutes', minutes: 15 },
  { value: '30m', label: '30 minutes', minutes: 30 },
  { value: '1h', label: '1 hour', minutes: 60 },
  { value: '2h', label: '2 hours', minutes: 120 },
  { value: '6h', label: '6 hours', minutes: 360 },
  { value: '12h', label: '12 hours', minutes: 720 },
  { value: '1d', label: '1 day', minutes: 1440 },
];

/**
 * Generate a simple hash from logs array for cache validation
 * Uses log count and first/last entries to detect changes
 */
function generateLogsHash(logs: LogEntry[]): string {
  if (!logs || logs.length === 0) return 'empty';
  
  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];
  
  return `${logs.length}-${firstLog?.id || 'none'}-${lastLog?.id || 'none'}-${firstLog?.timestamp?.getTime() || 0}`;
}

/**
 * LogCharts Component with Performance Optimizations and Caching
 * 
 * This component renders interactive charts for log analysis with special handling
 * for large datasets to prevent UI freezing and provide smooth user experience.
 * 
 * New Features:
 * - Chart data caching to prevent reprocessing when switching tabs
 * - TRACE log level support in timeline charts
 * - Line chart timeline with customizable time intervals (Grafana-style)
 * - Time interval selector for better data exploration
 * 
 * Performance Features:
 * - Async data processing with loading states
 * - Data sampling for very large datasets
 * - Progressive rendering with user feedback
 * - Memory-efficient chart data preparation
 * - Intelligent time interval selection based on data size
 * - Chart data caching across tab switches
 * 
 * The component uses React hooks to manage async processing and provides
 * visual feedback during chart preparation for datasets over 10,000 entries.
 */
export function LogCharts({ logs }: LogChartsProps) {
  // ============================================================================
  // STATE MANAGEMENT FOR PERFORMANCE AND CACHING
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
    timelineDataCache: Record<string, any[]>;
    timeRange: { start: Date; end: Date };
  } | null>(null);

  /**
   * Selected time interval for timeline chart
   * Allows users to customize the granularity of the timeline view
   */
  const [selectedInterval, setSelectedInterval] = useState('30m');

  /**
   * Loading state for interval changes
   * Shows feedback when switching between time intervals
   */
  const [isChangingInterval, setIsChangingInterval] = useState(false);

  // ============================================================================
  // PERFORMANCE CONSTANTS
  // ============================================================================
  
  /**
   * Performance thresholds for different optimization strategies
   */
  const LARGE_DATASET_THRESHOLD = 10000;  // Show loading for datasets larger than this
  const VERY_LARGE_DATASET_THRESHOLD = 50000;  // Apply aggressive sampling for datasets larger than this
  const MAX_TIMELINE_POINTS = 500;  // Maximum number of points on timeline charts

  // ============================================================================
  // ASYNC DATA PROCESSING EFFECT WITH CACHING
  // ============================================================================
  
  /**
   * Effect to process log data asynchronously with intelligent caching
   * 
   * This effect runs whenever the logs prop changes and handles:
   * - Cache validation and retrieval
   * - Large dataset detection and user feedback
   * - Async processing to prevent UI blocking
   * - Data sampling and optimization for performance
   * - Error handling and recovery
   * - Cache storage for future use
   */
  useEffect(() => {
    const processLogData = async () => {
      // Reset error state
      setProcessingError(null);
      
      // Generate hash for current logs to check cache validity
      const currentHash = generateLogsHash(logs);
      
      // Check if we have valid cached data
      if (chartCache && chartCache.logsHash === currentHash) {
        console.log('Using cached chart data');
        setChartData(chartCache.data);
        return;
      }
      
      // Clear existing chart data
      setChartData(null);
      
      // Show loading for large datasets
      if (logs.length > LARGE_DATASET_THRESHOLD) {
        setIsProcessing(true);
      }

      try {
        // Use setTimeout to yield control back to the browser
        // This prevents the UI from freezing during processing
        await new Promise(resolve => setTimeout(resolve, 10));

        console.log('Processing new chart data...');
        const processedData = await processChartsData(logs);
        
        // Store in cache for future use
        chartCache = {
          logsHash: currentHash,
          data: processedData
        };
        
        setChartData(processedData);
      } catch (error) {
        console.error('Error processing chart data:', error);
        setProcessingError('Failed to process chart data. The dataset may be too large or contain invalid data.');
      } finally {
        setIsProcessing(false);
      }
    };

    if (logs && logs.length > 0) {
      processLogData();
    } else {
      setChartData(null);
      chartCache = null; // Clear cache when no logs
    }
  }, [logs]);

  // ============================================================================
  // INTERVAL CHANGE HANDLER
  // ============================================================================
  
  /**
   * Handle time interval changes with loading feedback
   * Processes new interval data if not already cached
   */
  const handleIntervalChange = async (newInterval: string) => {
    if (!chartData) return;
    
    setIsChangingInterval(true);
    setSelectedInterval(newInterval);
    
    try {
      // Check if this interval is already cached
      if (!chartData.timelineDataCache[newInterval]) {
        // Process new interval data
        await new Promise(resolve => setTimeout(resolve, 10)); // Yield control
        
        const intervalConfig = TIME_INTERVALS.find(i => i.value === newInterval);
        if (intervalConfig) {
          const newTimelineData = await processTimelineData(chartData.validLogs, chartData.timeRange, intervalConfig.minutes);
          
          // Update cache
          const updatedData = {
            ...chartData,
            timelineDataCache: {
              ...chartData.timelineDataCache,
              [newInterval]: newTimelineData
            }
          };
          
          setChartData(updatedData);
          
          // Update global cache
          if (chartCache) {
            chartCache.data = updatedData;
          }
        }
      }
    } catch (error) {
      console.error('Error changing interval:', error);
    } finally {
      setIsChangingInterval(false);
    }
  };

  // ============================================================================
  // ASYNC DATA PROCESSING FUNCTION
  // ============================================================================
  
  /**
   * Process chart data asynchronously with performance optimizations
   * 
   * This function handles the heavy computation of chart data preparation
   * with special optimizations for large datasets including data sampling
   * and intelligent time interval selection.
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

    // ========================================================================
    // STEP 5: DETERMINE OPTIMAL DEFAULT INTERVAL
    // ========================================================================
    
    const totalMinutes = differenceInMinutes(timeRange.end, timeRange.start);
    let defaultInterval = '30m';
    
    // Auto-select appropriate interval based on time range
    if (totalMinutes <= 60) {
      defaultInterval = '1m';
    } else if (totalMinutes <= 300) {
      defaultInterval = '5m';
    } else if (totalMinutes <= 900) {
      defaultInterval = '15m';
    } else if (totalMinutes <= 1440) {
      defaultInterval = '30m';
    } else if (totalMinutes <= 4320) {
      defaultInterval = '1h';
    } else if (totalMinutes <= 10080) {
      defaultInterval = '2h';
    } else {
      defaultInterval = '6h';
    }

    // Update selected interval if it's still the default
    if (selectedInterval === '30m') {
      setSelectedInterval(defaultInterval);
    }

    // ========================================================================
    // STEP 6: PROCESS DEFAULT INTERVAL DATA
    // ========================================================================
    
    const defaultIntervalConfig = TIME_INTERVALS.find(i => i.value === defaultInterval);
    const defaultTimelineData = await processTimelineData(validLogs, timeRange, defaultIntervalConfig?.minutes || 30);

    const timelineDataCache: Record<string, any[]> = {
      [defaultInterval]: defaultTimelineData
    };

    return {
      validLogs,
      levelCounts,
      timelineDataCache,
      timeRange
    };
  };

  // ============================================================================
  // TIMELINE DATA PROCESSING FUNCTION
  // ============================================================================
  
  /**
   * Process timeline data for a specific interval
   * 
   * @param validLogs - Filtered log entries with valid timestamps
   * @param timeRange - Start and end time range
   * @param intervalMinutes - Interval size in minutes
   * @returns Promise resolving to timeline data array
   */
  const processTimelineData = async (validLogs: LogEntry[], timeRange: { start: Date; end: Date }, intervalMinutes: number) => {
    // Generate time intervals based on the specified minutes
    let timeIntervals: Date[] = [];
    let currentTime = new Date(timeRange.start);
    
    // Round down to nearest interval mark
    const roundedMinutes = Math.floor(currentTime.getMinutes() / intervalMinutes) * intervalMinutes;
    currentTime.setMinutes(roundedMinutes, 0, 0);
    
    while (currentTime <= timeRange.end) {
      timeIntervals.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, intervalMinutes);
    }

    // Limit number of points for performance
    if (timeIntervals.length > MAX_TIMELINE_POINTS) {
      const sampleRate = Math.ceil(timeIntervals.length / MAX_TIMELINE_POINTS);
      timeIntervals = timeIntervals.filter((_, index) => index % sampleRate === 0);
    }

    // Yield control to prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 5));

    // ========================================================================
    // GROUP LOGS BY TIME INTERVALS (INCLUDING TRACE)
    // ========================================================================
    
    /**
     * Process timeline data in chunks to prevent UI blocking
     * Groups log entries by specified intervals for timeline visualization
     * Includes all log levels including TRACE
     */
    const timelineData = [];
    const chunkSize = 50; // Process intervals in chunks
    
    for (let i = 0; i < timeIntervals.length; i += chunkSize) {
      const chunk = timeIntervals.slice(i, i + chunkSize);
      
      for (const interval of chunk) {
        const intervalStart = new Date(interval);
        const intervalEnd = addMinutes(interval, intervalMinutes);
        
        const logsInInterval = validLogs.filter(log => 
          log.timestamp! >= intervalStart && log.timestamp! < intervalEnd
        );

        timelineData.push({
          time: interval,
          total: logsInInterval.length,
          errors: logsInInterval.filter(log => log.level === 'ERROR').length,
          warnings: logsInInterval.filter(log => log.level === 'WARN').length,
          info: logsInInterval.filter(log => log.level === 'INFO').length,
          debug: logsInInterval.filter(log => log.level === 'DEBUG').length,
          trace: logsInInterval.filter(log => log.level === 'TRACE').length,
        });
      }
      
      // Yield control after each chunk to prevent UI blocking
      if (i + chunkSize < timeIntervals.length) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    return timelineData;
  };

  // ============================================================================
  // MEMOIZED CHART DATA PREPARATION
  // ============================================================================
  
  /**
   * Memoized chart data objects to prevent unnecessary re-renders
   * Only recalculates when processed chart data or selected interval changes
   * Now includes TRACE level in all chart configurations with line chart timeline
   */
  const { levelData, timelineChartData, chartOptions, lineChartOptions, doughnutOptions } = useMemo(() => {
    if (!chartData) {
      return {
        levelData: null,
        timelineChartData: null,
        chartOptions: null,
        lineChartOptions: null,
        doughnutOptions: null
      };
    }

    const { levelCounts, timelineDataCache } = chartData;
    const timelineData = timelineDataCache[selectedInterval] || [];

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

    // ========================================================================
    // TIMELINE CHART DATA (LINE CHART WITH TRACE)
    // ========================================================================
    
    const intervalConfig = TIME_INTERVALS.find(i => i.value === selectedInterval);
    const formatString = intervalConfig && intervalConfig.minutes >= 60 ? 'HH:mm' : 'HH:mm';
    
    /**
     * Enhanced timeline chart with all log levels including TRACE
     * Uses line chart for better trend visualization and pattern recognition
     * Each log level gets its own line with consistent colors and styling
     */
    const timelineChartData = {
      labels: timelineData.map(d => format(d.time, formatString)),
      datasets: [
        {
          label: 'Errors',
          data: timelineData.map(d => d.errors),
          borderColor: levelColors.ERROR,
          backgroundColor: levelColors.ERROR + '20', // 20% opacity
          borderWidth: 2,
          fill: false,
          tension: 0.1, // Slight curve for smoother lines
          pointRadius: timelineData.length > 100 ? 0 : 3, // Hide points for large datasets
          pointHoverRadius: 5,
        },
        {
          label: 'Warnings',
          data: timelineData.map(d => d.warnings),
          borderColor: levelColors.WARN,
          backgroundColor: levelColors.WARN + '20',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: timelineData.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Info',
          data: timelineData.map(d => d.info),
          borderColor: levelColors.INFO,
          backgroundColor: levelColors.INFO + '20',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: timelineData.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Debug',
          data: timelineData.map(d => d.debug),
          borderColor: levelColors.DEBUG,
          backgroundColor: levelColors.DEBUG + '20',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: timelineData.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
        },
        {
          label: 'Trace',
          data: timelineData.map(d => d.trace),
          borderColor: levelColors.TRACE,
          backgroundColor: levelColors.TRACE + '20',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: timelineData.length > 100 ? 0 : 3,
          pointHoverRadius: 5,
        },
      ],
    };

    // ========================================================================
    // CHART OPTIONS WITH PERFORMANCE OPTIMIZATIONS
    // ========================================================================
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      // Performance optimizations for large datasets
      animation: timelineData.length > 100 ? false : {
        duration: 300,
      },
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
            usePointStyle: true, // Use colored circles instead of lines
            padding: 15, // Add spacing between legend items
          },
        },
        title: {
          display: false,
        },
        // Enhanced tooltips for better data visibility
        tooltip: {
          enabled: timelineData.length <= 200,
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#374151',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: `Time (${intervalConfig?.label || selectedInterval} intervals)`,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          },
          ticks: {
            maxTicksLimit: Math.min(20, Math.ceil(timelineData.length / 10)),
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          },
          grid: {
            color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Log Entries',
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          },
          ticks: {
            stepSize: 1,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          },
          grid: {
            color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
          },
        },
      },
    };

    /**
     * Enhanced line chart options for timeline visualization
     * Optimized for trend analysis and pattern recognition
     */
    const lineChartOptions = {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        legend: {
          ...chartOptions.plugins.legend,
          labels: {
            ...chartOptions.plugins.legend.labels,
            generateLabels: (chart: any) => {
              const original = ChartJS.defaults.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);
              
              // Enhance legend labels with line styling
              labels.forEach((label: any, index: number) => {
                label.fillStyle = chart.data.datasets[index].borderColor;
                label.strokeStyle = chart.data.datasets[index].borderColor;
                label.lineWidth = 3;
              });
              
              return labels;
            },
          },
        },
      },
      scales: {
        ...chartOptions.scales,
        y: {
          ...chartOptions.scales.y,
          title: {
            display: true,
            text: 'Log Count by Level',
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          },
        },
      },
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
      timelineChartData,
      chartOptions,
      lineChartOptions,
      doughnutOptions
    };
  }, [chartData, selectedInterval]);

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
              Large datasets may take a moment to process
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
  
  const { validLogs, levelCounts, timelineDataCache, timeRange } = chartData;
  const currentTimelineData = timelineDataCache[selectedInterval] || [];

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
          CACHE STATUS AND PERFORMANCE NOTICE
          ======================================================================== */}
      {logs.length > LARGE_DATASET_THRESHOLD && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 transition-colors duration-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Large Dataset Optimization
                {chartCache && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">Cached</span>}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                {logs.length > VERY_LARGE_DATASET_THRESHOLD 
                  ? `Dataset contains ${logs.length.toLocaleString()} entries. Applied intelligent sampling for optimal performance.`
                  : `Processing ${logs.length.toLocaleString()} entries with performance optimizations enabled.`
                }
                {chartCache && <span className="block mt-1 text-xs">Charts are cached - switching tabs won't reload data.</span>}
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
          ENHANCED LOG LEVELS TIMELINE (LINE CHART WITH TIME CONTROLS)
          ====================================================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Log Levels Timeline - Trend Analysis
              {currentTimelineData.length > MAX_TIMELINE_POINTS && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  (Optimized for performance)
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Track log activity patterns over time with customizable intervals
            </p>
          </div>
          
          {/* Time Interval Selector */}
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Interval:</span>
            <select
              value={selectedInterval}
              onChange={(e) => handleIntervalChange(e.target.value)}
              disabled={isChangingInterval}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            >
              {TIME_INTERVALS.map(interval => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
            {isChangingInterval && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>
        
        <div className="h-80">
          {timelineChartData && <Line data={timelineChartData} options={lineChartOptions} />}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          {currentTimelineData.length} data points • {TIME_INTERVALS.find(i => i.value === selectedInterval)?.label} intervals
          {currentTimelineData.length > 100 && " • Points hidden for clarity, hover to see values"}
        </div>
      </div>
    </div>
  );
}