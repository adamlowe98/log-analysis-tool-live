import jsPDF from 'jspdf';
import { LogEntry, LogSummary } from '../types/log';
import { format } from 'date-fns';

/**
 * PDF Report Generator
 * 
 * This module handles the generation of comprehensive PDF reports from log analysis data.
 * It creates professional, multi-page reports with charts, statistics, and actionable insights.
 * 
 * Features:
 * - Professional report layout with consistent styling
 * - Executive summary with key metrics
 * - Visual charts and data representations
 * - Critical error analysis
 * - Actionable recommendations
 * - Custom additional content from AI assistant
 * 
 * Security: All PDF generation happens client-side in the browser.
 * No data is transmitted to external services.
 */

/**
 * Options interface for PDF report generation
 */
interface PDFReportOptions {
  logs: LogEntry[];
  summary: LogSummary;
  filename: string;
  reportName?: string;
  summaryRef?: HTMLElement | null;
  chartsRef?: HTMLElement | null;
  additionalDetails?: string;
}

/**
 * Main PDF report generation function
 * 
 * Creates a comprehensive PDF report from log analysis data and downloads it.
 * Handles error cases and provides user feedback through exceptions.
 * 
 * @param options - Configuration object with all required data and settings
 */
export async function generatePDFReport(options: PDFReportOptions): Promise<void> {
  try {
    const pdf = await createPDFDocument(options);
    
    // Use custom report name exactly as provided, or generate default with timestamp
    const reportFilename = options.reportName 
      ? `${options.reportName}.pdf`
      : `log-analysis-${options.filename.replace(/\.[^/.]+$/, '')}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
    
    pdf.save(reportFilename);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create the PDF document with all content and formatting
 * 
 * This is the main document creation function that handles:
 * - Page layout and styling
 * - Content organization and flow
 * - Professional formatting
 * - Multi-page document structure
 * 
 * @param options - PDF generation options
 * @returns Configured jsPDF document ready for download
 */
async function createPDFDocument(options: PDFReportOptions): Promise<jsPDF> {
  const { logs, summary, filename, additionalDetails } = options;
  
  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================
  
  // Validate required data before proceeding
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    throw new Error('No log data available for PDF generation');
  }
  
  if (!summary) {
    throw new Error('No summary data available for PDF generation');
  }
  
  if (!filename) {
    throw new Error('No filename provided for PDF generation');
  }

  // ============================================================================
  // PDF DOCUMENT SETUP
  // ============================================================================
  
  // Create new PDF document with A4 page size
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;
  let pageNumber = 1;

  // ============================================================================
  // HELPER FUNCTIONS FOR DOCUMENT LAYOUT
  // ============================================================================
  
  /**
   * Add page headers and footers
   * 
   * Provides consistent page numbering and document identification
   * across all pages of the report.
   */
  const addPageHeader = (isFirstPage = false) => {
    if (!isFirstPage) {
      // Add header line
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.3);
      pdf.line(margin, 18, pageWidth - margin, 18);
      
      // Add page number
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin - 15, 14);
      
      // Add report title in header
      pdf.text('Log Analysis Report', margin, 14);
      
      pageNumber++;
      currentY = 25; // Start content below header
    }
  };

  /**
   * Check if new page is needed and add one if necessary
   * 
   * Prevents content from being cut off at page boundaries
   * and maintains proper page flow.
   */
  const checkPageBreak = (requiredHeight: number, addHeader = true) => {
    if (currentY + requiredHeight > pageHeight - margin - 15) {
      pdf.addPage();
      if (addHeader) {
        addPageHeader();
      } else {
        currentY = margin;
      }
      return true;
    }
    return false;
  };

  /**
   * Add text with automatic word wrapping
   * 
   * Handles long text content by wrapping it across multiple lines
   * and managing page breaks as needed.
   */
  const addWrappedText = (text: string, x: number, maxWidth: number, fontSize: number = 10, lineHeight: number = 1.6) => {
    if (!text || typeof text !== 'string') return;
    
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    const lineHeightPx = fontSize * 0.35 * lineHeight;
    
    lines.forEach((line: string) => {
      checkPageBreak(lineHeightPx + 2);
      pdf.text(line, x, currentY);
      currentY += lineHeightPx;
    });
  };

  /**
   * Create professional section headers
   * 
   * Provides consistent styling for major report sections
   * with background colors and accent lines.
   */
  const addSectionHeader = (title: string, color: [number, number, number] = [50, 50, 50]) => {
    checkPageBreak(35);
    
    currentY += 8;
    
    // Background rectangle for header
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(margin - 3, currentY - 12, contentWidth + 6, 22, 3, 3, 'FD');
    
    // Header text - properly centered vertically in the rectangle
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(title, margin + 2, currentY - 2); // Centered vertically in the 22mm rectangle
    
    // Accent line under title
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(1.2);
    pdf.line(margin + 2, currentY + 2, margin + 2 + pdf.getTextWidth(title), currentY + 2);
    
    currentY += 25;
    pdf.setTextColor(0, 0, 0); // Reset to black
  };

  /**
   * Format timestamp for PDF display
   * 
   * Provides consistent timestamp formatting throughout the report
   * with proper error handling for invalid dates.
   */
  const formatTimestamp = (timestamp: Date | null) => {
    if (!timestamp || isNaN(timestamp.getTime())) {
      return 'N/A';
    }
    try {
      return format(timestamp, 'MMM dd, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  try {
    // ========================================================================
    // TITLE PAGE
    // ========================================================================
    
    addPageHeader(true);
    
    // Company/Tool branding area with gradient background
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.roundedRect(0, 0, pageWidth, 50, 0, 0, 'F');
    
    // White text on blue background
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text('LOG ANALYSIS REPORT', margin, 30);
    
    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Comprehensive System Log Analysis & Insights', margin, 42);
    
    // Reset colors and position
    pdf.setTextColor(0, 0, 0);
    currentY = 70;

    // ========================================================================
    // REPORT METADATA SECTION
    // ========================================================================
    
    // Report metadata card with key information
    pdf.setFillColor(249, 250, 251);
    pdf.setDrawColor(229, 231, 235);
    pdf.roundedRect(margin, currentY, contentWidth, 55, 5, 5, 'FD');
    
    currentY += 15;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Report Summary', margin + 15, currentY);
    
    currentY += 12;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    
    // Key report details in structured format
    const reportDetails = [
      ['File Analyzed:', filename || 'Unknown'],
      ['Generated:', format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm:ss')],
      ['Analysis Period:', `${formatTimestamp(summary.timeRange?.start)} to ${formatTimestamp(summary.timeRange?.end)}`],
      ['Total Entries:', (summary.totalEntries || 0).toLocaleString()]
    ];

    reportDetails.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, margin + 15, currentY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(value, margin + 70, currentY);
      currentY += 8;
    });

    currentY += 25;

    // ========================================================================
    // EXECUTIVE SUMMARY
    // ========================================================================
    
    addSectionHeader('Executive Summary', [16, 185, 129]);

    // Calculate system health metrics
    const errorRate = summary.totalEntries > 0 ? ((summary.errorCount / summary.totalEntries) * 100).toFixed(1) : '0.0';
    
    let healthStatus = 'Excellent';
    let healthColor = [16, 185, 129]; // Green
    
    // Determine health status based on error rate
    if (summary.errorCount > summary.totalEntries * 0.1) {
      healthStatus = 'Critical';
      healthColor = [239, 68, 68]; // Red
    } else if (summary.errorCount > summary.totalEntries * 0.05) {
      healthStatus = 'Warning';
      healthColor = [245, 158, 11]; // Yellow
    } else if (summary.errorCount > 0) {
      healthStatus = 'Good';
      healthColor = [59, 130, 246]; // Blue
    }

    // Health status badge with proper text alignment
    const badgeWidth = 80;
    const badgeHeight = 16;
    pdf.setFillColor(healthColor[0], healthColor[1], healthColor[2]);
    pdf.roundedRect(margin, currentY - 8, badgeWidth, badgeHeight, 8, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    // Center text both horizontally and vertically in the badge
    const statusText = `System Status: ${healthStatus}`;
    const textWidth = pdf.getTextWidth(statusText);
    const textX = margin + (badgeWidth - textWidth) / 2;
    const textY = currentY - 8 + (badgeHeight / 2) + 2; // Center vertically
    pdf.text(statusText, textX, textY);
    pdf.setTextColor(0, 0, 0);
    
    currentY += 20;

    // Executive summary narrative
    const summaryText = `This comprehensive analysis examined ${summary.totalEntries.toLocaleString()} log entries from the file "${filename}". ` +
      `The system demonstrates a ${errorRate}% error rate with ${summary.errorCount.toLocaleString()} errors and ${summary.warningCount.toLocaleString()} warnings detected throughout the analysis period. ` +
      `${(summary.criticalErrors?.length || 0) > 0 ? `${summary.criticalErrors.length} critical issues have been identified that require immediate attention.` : 'No critical issues were identified during this analysis period.'}`;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(55, 65, 81);
    addWrappedText(summaryText, margin, contentWidth, 12, 1.7);
    currentY += 20;

    // ========================================================================
    // KEY METRICS DASHBOARD
    // ========================================================================
    
    addSectionHeader('Key Performance Metrics', [59, 130, 246]);

    // Metrics cards with color-coded styling
    const metrics = [
      { label: 'Total Log Entries', value: summary.totalEntries.toLocaleString(), color: [107, 114, 128], bgColor: [249, 250, 251] },
      { label: 'Error Events', value: summary.errorCount.toLocaleString(), color: [239, 68, 68], bgColor: [254, 242, 242] },
      { label: 'Warning Events', value: summary.warningCount.toLocaleString(), color: [245, 158, 11], bgColor: [255, 251, 235] },
      { label: 'Info Messages', value: summary.infoCount.toLocaleString(), color: [59, 130, 246], bgColor: [239, 246, 255] },
      { label: 'Debug Messages', value: summary.debugCount.toLocaleString(), color: [16, 185, 129], bgColor: [240, 253, 244] }
    ];

    const cardWidth = (contentWidth - 30) / 3;
    const cardHeight = 35;
    let cardX = margin;
    let cardY = currentY;

    metrics.forEach((metric, index) => {
      // Layout cards in rows of 3
      if (index > 0 && index % 3 === 0) {
        cardY += cardHeight + 15;
        cardX = margin;
      }

      // Card background with border
      pdf.setFillColor(metric.bgColor[0], metric.bgColor[1], metric.bgColor[2]);
      pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2]);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'FD');

      // Value - centered horizontally and positioned in upper portion of card
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      const valueText = metric.value;
      const valueWidth = pdf.getTextWidth(valueText);
      const valueX = cardX + (cardWidth - valueWidth) / 2; // Center horizontally
      const valueY = cardY + 16; // Position in upper portion
      pdf.text(valueText, valueX, valueY);

      // Label - centered horizontally and positioned in lower portion of card
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      const labelText = metric.label;
      const labelWidth = pdf.getTextWidth(labelText);
      const labelX = cardX + (cardWidth - labelWidth) / 2; // Center horizontally
      const labelY = cardY + 26; // Position in lower portion
      pdf.text(labelText, labelX, labelY);

      // Percentage - positioned in bottom right corner
      const percentage = summary.totalEntries > 0 ? ((parseInt(metric.value.replace(/,/g, '')) / summary.totalEntries) * 100).toFixed(1) : '0.0';
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const percentageText = `${percentage}%`;
      const percentageWidth = pdf.getTextWidth(percentageText);
      const percentageX = cardX + cardWidth - percentageWidth - 5; // Right-aligned with margin
      const percentageY = cardY + 31; // Bottom position
      pdf.text(percentageText, percentageX, percentageY);

      cardX += cardWidth + 15;
    });

    currentY = cardY + cardHeight + 25;

    // ========================================================================
    // LOG DISTRIBUTION ANALYSIS
    // ========================================================================
    
    checkPageBreak(80);
    addSectionHeader('Log Distribution Analysis', [147, 51, 234]);

    // Calculate log levels distribution
    const levelCounts = logs.reduce((acc, log) => {
      if (log && log.level) {
        acc[log.level] = (acc[log.level] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const orderedLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    const chartLabels = orderedLevels.filter(level => levelCounts[level] > 0);
    const chartData = chartLabels.map(level => levelCounts[level]);

    // Create horizontal bar chart for log level distribution
    if (chartData.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(55, 65, 81);
      pdf.text('Log Level Distribution Overview', margin, currentY);
      currentY += 15;

      const maxCount = Math.max(...chartData);
      const barMaxWidth = contentWidth - 120; // Space for labels and values

      chartLabels.forEach((level, index) => {
        const count = chartData[index];
        const percentage = summary.totalEntries > 0 ? ((count / summary.totalEntries) * 100).toFixed(1) : '0.0';
        const barWidth = Math.max((count / maxCount) * barMaxWidth, 5);

        // Level colors matching the application theme
        let color: [number, number, number];
        let bgColor: [number, number, number];
        switch (level) {
          case 'ERROR': 
            color = [239, 68, 68]; 
            bgColor = [254, 242, 242];
            break;
          case 'WARN': 
            color = [245, 158, 11]; 
            bgColor = [255, 251, 235];
            break;
          case 'INFO': 
            color = [59, 130, 246]; 
            bgColor = [239, 246, 255];
            break;
          case 'DEBUG': 
            color = [16, 185, 129]; 
            bgColor = [240, 253, 244];
            break;
          default: 
            color = [139, 92, 246]; 
            bgColor = [245, 243, 255];
            break;
        }

        // Background bar
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.roundedRect(margin + 40, currentY - 2, barMaxWidth + 5, 12, 2, 2, 'F');

        // Level label - left aligned
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        pdf.text(level, margin, currentY + 6);

        // Actual bar
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(margin + 40, currentY, barWidth, 8, 2, 2, 'F');

        // Count - positioned after the bar with proper spacing
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text(`${count.toLocaleString()}`, margin + 45 + barWidth, currentY + 6);
        
        // Percentage - positioned after count with proper spacing
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`(${percentage}%)`, margin + 70 + barWidth, currentY + 6);

        currentY += 18;
      });

      currentY += 20;
    }

    // ========================================================================
    // CRITICAL ERRORS SECTION
    // ========================================================================
    
    if (summary.criticalErrors && summary.criticalErrors.length > 0) {
      checkPageBreak(50);
      addSectionHeader('Critical Issues Requiring Attention', [239, 68, 68]);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(185, 28, 28);
      pdf.text(`${summary.criticalErrors.length} critical errors have been identified:`, margin, currentY);
      currentY += 15;

      summary.criticalErrors.slice(0, 10).forEach((error, index) => {
        checkPageBreak(35);
        
        // Error card with red styling
        pdf.setFillColor(254, 242, 242);
        pdf.setDrawColor(252, 165, 165);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, currentY, contentWidth, 28, 4, 4, 'FD');

        // Error number badge - properly centered
        const circleRadius = 6;
        const circleX = margin + 10;
        const circleY = currentY + 10;
        pdf.setFillColor(239, 68, 68);
        pdf.circle(circleX, circleY, circleRadius, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        // Center the number in the circle
        const numberText = String(index + 1);
        const numberWidth = pdf.getTextWidth(numberText);
        pdf.text(numberText, circleX - (numberWidth / 2), circleY + 2);

        // Timestamp - properly aligned
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(9);
        const timestamp = formatTimestamp(error.timestamp);
        pdf.text(`Occurred: ${timestamp}`, margin + 20, currentY + 12);

        // Error message - properly positioned
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        const errorMessage = error.message || 'No message available';
        const messageY = currentY + 20;
        currentY = messageY;
        addWrappedText(errorMessage, margin + 8, contentWidth - 16, 10, 1.4);
        
        currentY += 15; // Add some spacing after the message
      });

      currentY += 15;
    }

    // ========================================================================
    // TOP ERRORS SECTION
    // ========================================================================
    
    if (summary.topErrors && summary.topErrors.length > 0) {
      checkPageBreak(50);
      addSectionHeader('Most Frequent Error Patterns', [245, 158, 11]);

      summary.topErrors.forEach((error, index) => {
        checkPageBreak(25);
        
        // Error frequency card
        pdf.setFillColor(255, 251, 235);
        pdf.setDrawColor(253, 230, 138);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'FD');

        // Frequency badge - properly centered
        const badgeWidth = 30;
        const badgeHeight = 12;
        const badgeX = margin + 5;
        const badgeY = currentY + 4;
        pdf.setFillColor(245, 158, 11);
        pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 6, 6, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        const countText = `${error.count}x`;
        const countWidth = pdf.getTextWidth(countText);
        const countX = badgeX + (badgeWidth - countWidth) / 2; // Center horizontally
        const countY = badgeY + (badgeHeight / 2) + 2; // Center vertically
        pdf.text(countText, countX, countY);

        // Error message - properly positioned
        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const errorMessage = error.message || 'No message available';
        const messageY = currentY + 12;
        currentY = messageY;
        addWrappedText(errorMessage, margin + 45, contentWidth - 50, 9, 1.3);
        
        currentY += 13; // Adjust spacing
      });

      currentY += 15;
    }

    // ========================================================================
    // ADDITIONAL DETAILS SECTION
    // ========================================================================
    
    if (additionalDetails && additionalDetails.trim()) {
      checkPageBreak(40);
      addSectionHeader('Additional Analysis & Insights', [59, 130, 246]);

      // Professional attribution for AI-generated content
      pdf.setFillColor(239, 246, 255);
      pdf.setDrawColor(147, 197, 253);
      pdf.roundedRect(margin, currentY, contentWidth, 18, 3, 3, 'FD');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(59, 130, 246);
      pdf.text('Advanced Analysis Section', margin + 8, currentY + 8);
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text('This section contains additional insights and recommendations based on log analysis patterns.', margin + 8, currentY + 14);
      currentY += 25;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);

      addWrappedText(additionalDetails, margin, contentWidth, 11, 1.6);
      currentY += 20;
    }

    // ========================================================================
    // RECOMMENDATIONS SECTION
    // ========================================================================
    
    checkPageBreak(50);
    addSectionHeader('Actionable Recommendations', [16, 185, 129]);

    const recommendations = generateRecommendations(summary);
    
    recommendations.forEach((rec, index) => {
      checkPageBreak(30);
      
      // Recommendation card
      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(134, 239, 172);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, currentY, contentWidth, 22, 4, 4, 'FD');

      // Number badge - properly centered
      const circleRadius = 8;
      const circleX = margin + 12;
      const circleY = currentY + 11;
      pdf.setFillColor(16, 185, 129);
      pdf.circle(circleX, circleY, circleRadius, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const numberText = String(index + 1);
      const numberWidth = pdf.getTextWidth(numberText);
      pdf.text(numberText, circleX - (numberWidth / 2), circleY + 2);

      // Recommendation text - properly positioned
      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const recY = currentY + 8;
      currentY = recY;
      addWrappedText(rec, margin + 25, contentWidth - 30, 10, 1.4);
      
      currentY += 19; // Adjust spacing
    });

    // ========================================================================
    // DOCUMENT FOOTER
    // ========================================================================
    
    currentY += 15;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated by Log Analysis Tool • ${format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm:ss')}`, 
      margin, pageHeight - 12);
    pdf.text(`Analysis Report: ${filename}`, 
      pageWidth - margin - 80, pageHeight - 12);

    return pdf;

  } catch (error) {
    console.error('Error in PDF document creation:', error);
    throw new Error(`PDF document creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate actionable recommendations based on log analysis
 * 
 * Creates intelligent recommendations based on error rates, patterns,
 * and system health indicators found in the log analysis.
 * 
 * @param summary - Log analysis summary data
 * @returns Array of actionable recommendation strings
 */
function generateRecommendations(summary: LogSummary): string[] {
  const recommendations: string[] = [];
  
  try {
    const errorRate = summary.totalEntries > 0 ? summary.errorCount / summary.totalEntries : 0;
    const warningRate = summary.totalEntries > 0 ? summary.warningCount / summary.totalEntries : 0;

    // Error rate based recommendations
    if (errorRate > 0.1) {
      recommendations.push('CRITICAL: High error rate detected (>10%). Implement immediate error monitoring and alerting systems to prevent system instability.');
    } else if (errorRate > 0.05) {
      recommendations.push('IMPORTANT: Moderate error rate detected (5-10%). Establish regular error review processes and implement preventive measures.');
    } else if (errorRate > 0) {
      recommendations.push('MAINTENANCE: Low error rate detected. Maintain current monitoring practices and continue proactive error management.');
    } else {
      recommendations.push('EXCELLENT: Zero errors detected indicating optimal system stability. Continue current operational practices.');
    }

    // Warning rate based recommendations
    if (warningRate > 0.2) {
      recommendations.push('WARNING ANALYSIS: High warning rate (>20%) indicates potential system stress. Review warning patterns to prevent escalation to errors.');
    } else if (warningRate > 0.1) {
      recommendations.push('WARNING MANAGEMENT: Moderate warning levels detected. Implement automated warning analysis and establish response procedures.');
    }

    // Critical errors recommendations
    if (summary.criticalErrors && summary.criticalErrors.length > 0) {
      recommendations.push(`IMMEDIATE ACTION: ${summary.criticalErrors.length} critical errors require urgent investigation. Create incident response procedures and assign dedicated resources.`);
    }

    // Error patterns recommendations
    if (summary.topErrors && summary.topErrors.length > 0) {
      recommendations.push('ERROR PATTERN ANALYSIS: Recurring error patterns identified. Focus development efforts on resolving the most frequent error types for maximum impact.');
    }

    // Performance optimization recommendations
    if (summary.debugCount > summary.infoCount * 3) {
      recommendations.push('PERFORMANCE OPTIMIZATION: High debug message volume detected. Review debug logging levels for production environments to improve performance.');
    }

    // General monitoring recommendation
    recommendations.push('CONTINUOUS MONITORING: Implement real-time log monitoring with automated alerting for error thresholds and establish SLA monitoring.');

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return ['Unable to generate recommendations due to data processing error.'];
  }
}