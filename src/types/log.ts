export interface LogEntry {
  id: string;
  timestamp: Date | null; // Allow null timestamps
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
  message: string;
  source?: string;
  raw: string;
}

export interface LogSummary {
  totalEntries: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  criticalErrors: LogEntry[];
  topErrors: { message: string; count: number }[];
  timeRange: { start: Date; end: Date };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    fill?: boolean;
  }[];
}