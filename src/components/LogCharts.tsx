import React from 'react';
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
import { format, startOfMinute, endOfMinute, eachMinuteOfInterval, differenceInMinutes, startOfHour, endOfHour, eachHourOfInterval } from 'date-fns';

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

export function LogCharts({ logs }: LogChartsProps) {
  // Filter out logs with invalid timestamps (like placeholder dates)
  const validLogs = logs.filter(log => 
    log.timestamp &&
    !isNaN(log.timestamp.getTime()) && 
    log.timestamp.getFullYear() > 2020 && 
    log.timestamp.getFullYear() < 2030 &&
    log.timestamp.getTime() > new Date('2020-01-01').getTime()
  );

  if (validLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No valid timestamps found in log data for charting</p>
        <p className="text-sm mt-2">Charts require logs with proper timestamp formats</p>
      </div>
    );
  }

  // Log levels distribution data - use ALL logs for consistency with other displays
  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Define consistent colors for log levels
  const levelColors = {
    'ERROR': '#ef4444',    // Red
    'WARN': '#f59e0b',     // Yellow/Orange
    'INFO': '#3b82f6',     // Blue
    'DEBUG': '#10b981',    // Green
    'TRACE': '#8b5cf6',    // Purple
  };

  // Create ordered arrays for consistent display
  const orderedLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
  const chartLabels = orderedLevels.filter(level => levelCounts[level] > 0);
  const chartData = chartLabels.map(level => levelCounts[level]);
  const chartColors = chartLabels.map(level => levelColors[level as keyof typeof levelColors]);

  const levelData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartData,
        backgroundColor: chartColors,
        borderWidth: 0,
      },
    ],
  };

  // Calculate time range and determine appropriate interval
  const timeRange = {
    start: new Date(Math.min(...validLogs.map(log => log.timestamp!.getTime()))),
    end: new Date(Math.max(...validLogs.map(log => log.timestamp!.getTime()))),
  };

  const totalMinutes = differenceInMinutes(timeRange.end, timeRange.start);
  const useHourlyInterval = totalMinutes > 120; // Use hourly if more than 2 hours of data

  let timeIntervals: Date[];
  let formatString: string;

  if (useHourlyInterval) {
    timeIntervals = eachHourOfInterval({ start: timeRange.start, end: timeRange.end });
    formatString = 'HH:mm';
  } else {
    timeIntervals = eachMinuteOfInterval({ start: timeRange.start, end: timeRange.end });
    formatString = 'HH:mm';
  }

  // Group logs by time intervals
  const timelineData = timeIntervals.map(interval => {
    let intervalStart: Date, intervalEnd: Date;
    
    if (useHourlyInterval) {
      intervalStart = startOfHour(interval);
      intervalEnd = endOfHour(interval);
    } else {
      intervalStart = startOfMinute(interval);
      intervalEnd = endOfMinute(interval);
    }
    
    const logsInInterval = validLogs.filter(log => 
      log.timestamp! >= intervalStart && log.timestamp! <= intervalEnd
    );

    return {
      time: interval,
      total: logsInInterval.length,
      errors: logsInInterval.filter(log => log.level === 'ERROR').length,
      warnings: logsInInterval.filter(log => log.level === 'WARN').length,
      info: logsInInterval.filter(log => log.level === 'INFO').length,
      debug: logsInInterval.filter(log => log.level === 'DEBUG').length,
    };
  });

  // Timeline chart data as BAR CHART with consistent colors
  const timelineChartData = {
    labels: timelineData.map(d => format(d.time, formatString)),
    datasets: [
      {
        label: 'Errors',
        data: timelineData.map(d => d.errors),
        backgroundColor: levelColors.ERROR,
        borderColor: levelColors.ERROR,
        borderWidth: 1,
      },
      {
        label: 'Warnings',
        data: timelineData.map(d => d.warnings),
        backgroundColor: levelColors.WARN,
        borderColor: levelColors.WARN,
        borderWidth: 1,
      },
      {
        label: 'Info',
        data: timelineData.map(d => d.info),
        backgroundColor: levelColors.INFO,
        borderColor: levelColors.INFO,
        borderWidth: 1,
      },
      {
        label: 'Debug',
        data: timelineData.map(d => d.debug),
        backgroundColor: levelColors.DEBUG,
        borderColor: levelColors.DEBUG,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Time (${useHourlyInterval ? 'Hourly' : 'Per Minute'})`,
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
        ticks: {
          maxTicksLimit: 20,
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

  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'Log Count by Level',
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        },
        stacked: true,
      },
      x: {
        ...chartOptions.scales.x,
        stacked: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
        },
      },
      title: {
        display: false,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats - Use ALL logs for consistency */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Entries</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{levelCounts.ERROR || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{levelCounts.WARN || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{levelCounts.INFO || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Info</div>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Time Range: {format(timeRange.start, 'yyyy-MM-dd HH:mm')} to {format(timeRange.end, 'yyyy-MM-dd HH:mm')}
          {validLogs.length !== logs.length && (
            <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Note: {logs.length - validLogs.length} entries with invalid timestamps excluded from timeline charts
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Levels Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Log Levels Distribution</h3>
          <div className="h-64">
            <Doughnut data={levelData} options={doughnutOptions} />
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Summary</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{logs.length}</div>
              <div className="text-lg text-gray-700 dark:text-gray-300">Total Log Entries Analyzed</div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400">{((levelCounts.ERROR || 0) / logs.length * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">{((levelCounts.WARN || 0) / logs.length * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Warning Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Levels Timeline - BAR CHART */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Log Levels Timeline ({useHourlyInterval ? 'Hourly' : 'Per Minute'})
        </h3>
        <div className="h-80">
          <Bar data={timelineChartData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
}