# Log Analysis Tool

A comprehensive, privacy-focused log analysis application built with React, TypeScript, and modern web technologies. This tool provides powerful log file analysis capabilities with beautiful visualizations, detailed reporting, and optional AI-powered insights.

## 🔒 Privacy & Security

**Your data stays private.** All log processing happens locally in your browser. No log content is ever transmitted to external servers or stored remotely. Only anonymized analysis metadata (like entry counts and timestamps) is optionally saved for session tracking.

## ✨ Features

### Core Analysis
- **Multi-format Support**: Handles .log, .txt, .out, and .json files up to 50MB
- **Intelligent Parsing**: Automatically detects timestamps, log levels, and error codes
- **Real-time Processing**: Client-side analysis with no server dependencies
- **Comprehensive Statistics**: Error rates, warning patterns, and system health metrics

### Visualizations
- **Interactive Charts**: Log level distribution, timeline analysis, and trend visualization
- **Professional Reports**: Generate comprehensive PDF reports with charts and insights
- **Dark/Light Themes**: Seamless theme switching with system preference detection
- **Responsive Design**: Optimized for desktop and mobile viewing

### Advanced Features
- **AI Assistant**: Optional Google Gemini integration for enhanced insights (metadata only)
- **Custom Report Sections**: Add AI-generated analysis to PDF reports
- **Error Pattern Detection**: Identify recurring issues and critical errors
- **Export Capabilities**: CSV export for further analysis in external tools

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern web browser (Chrome 120+, Firefox 121+, Safari 17+, Edge 120+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd log-analysis-tool

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup (Optional)

Create a `.env` file for optional features:

```env
# Optional: Supabase for session tracking (metadata only)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Google Gemini AI for enhanced insights
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── FileUpload.tsx      # File upload with drag-and-drop
│   ├── LogSummary.tsx      # Analysis overview and statistics
│   ├── LogCharts.tsx       # Data visualizations
│   ├── LogTable.tsx        # Detailed log entry browser
│   ├── ReportGenerator.tsx # PDF report creation
│   ├── GeminiChatbot.tsx   # AI assistant integration
│   ├── ThemeToggle.tsx     # Dark/light mode switcher
│   ├── PasswordProtection.tsx # Access control
│   └── KnowledgeBase.tsx   # Developer documentation
├── contexts/            # React contexts
│   └── ThemeContext.tsx    # Theme management
├── lib/                 # External service integrations
│   └── supabase.ts         # Database client (metadata only)
├── types/               # TypeScript type definitions
│   └── log.ts              # Core data structures
├── utils/               # Utility functions
│   ├── logParser.ts        # Log file parsing logic
│   └── pdfGenerator.ts     # PDF report generation
└── main.tsx            # Application entry point
```

## 🛠 Technology Stack

### Frontend Framework
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and enhanced developer experience
- **Vite**: Fast development server and optimized production builds

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework with dark mode support
- **Lucide React**: Comprehensive icon library
- **Responsive Design**: Mobile-first approach with breakpoint optimization

### Data Processing
- **Chart.js**: Interactive charts and data visualizations
- **date-fns**: Robust date manipulation and formatting
- **Client-side Processing**: All analysis happens in the browser

### Optional Integrations
- **Supabase**: Session metadata tracking (no log content stored)
- **Google Gemini AI**: Enhanced insights and report generation
- **jsPDF**: Professional PDF report generation

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Code linting
npm run lint

# Preview production build
npm run preview
```

### Code Quality
- **ESLint**: Comprehensive linting with React and TypeScript rules
- **TypeScript**: Strict type checking with modern compiler options
- **Prettier**: Consistent code formatting (configure as needed)

### Browser Support
- **Chrome 120+** (Recommended)
- **Firefox 121+**
- **Safari 17+** (macOS Sonoma 14.0+)
- **Edge 120+** (Chromium-based)

## 📊 Log File Formats

### Supported Formats
- **Standard Logs**: .log, .txt, .out files with various timestamp formats
- **JSON Logs**: Structured JSON with automatic field detection
- **Mixed Formats**: Handles inconsistent formatting within files

### Timestamp Support
- `YYYY-MM-DD HH:mm:ss` (Primary format)
- `ISO 8601`: `2025-01-15T10:30:00Z`
- `Bracketed`: `[2025-01-15 10:30:00]`
- Custom formats with intelligent detection

### Log Level Detection
- **Standard Levels**: ERROR, WARN, INFO, DEBUG, TRACE
- **Alternative Formats**: ERR, WARNING, FATAL, CRITICAL
- **Content-based Detection**: Keyword analysis for unlabeled entries

## 🔐 Security Features

### Data Privacy
- **Local Processing**: All analysis happens in your browser
- **No Data Transmission**: Log content never leaves your device
- **Metadata Only**: Optional database storage contains only statistics
- **Session-based Auth**: Simple password protection for access control

### AI Integration
- **Opt-in Only**: AI features are completely optional
- **Summary Data Only**: AI receives statistics, never log content
- **Transparent Usage**: Clear indicators when AI features are active

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Components load on demand
- **Memory Management**: Efficient handling of large log files
- **Progressive Enhancement**: Core features work without optional services
- **Responsive Charts**: Optimized rendering for large datasets

### File Size Limits
- **Maximum Size**: 50MB per file
- **Recommended**: Files under 10MB for optimal performance
- **Large File Handling**: Automatic chunking and progress indicators

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- Follow existing TypeScript and React patterns
- Add comprehensive comments for complex logic
- Maintain responsive design principles
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Troubleshooting
- Check the Knowledge Base in the application for detailed guides
- Verify browser compatibility and version requirements
- Ensure file formats are supported and within size limits

### Common Issues
- **File Upload Fails**: Check file size (50MB limit) and format
- **Charts Not Loading**: Verify browser supports modern JavaScript
- **PDF Generation Issues**: Ensure sufficient browser memory

### Getting Help
- Review the in-app Knowledge Base for comprehensive documentation
- Check browser console for detailed error messages
- Verify environment configuration for optional features

---

**Built with ❤️ for secure, privacy-focused log analysis**