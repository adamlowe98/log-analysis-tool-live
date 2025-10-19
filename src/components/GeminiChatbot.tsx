import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Bot, User, FileText, Plus, Check, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  canAddToReport?: boolean;
  addedToReport?: boolean;
}

interface GeminiChatbotProps {
  logs?: any[];
  summary?: any;
  onAddToReport: (content: string) => void;
}

export function GeminiChatbot({ logs = [], summary, onAddToReport }: GeminiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! This assistant can help analyze log files, explain errors, and answer questions about system logs.\n\n🎯 **New Feature**: Additional content can be generated for PDF reports! Just ask to create specific analysis, charts, or insights, and they'll automatically be added to the report.\n\n⚠️ **Important Note**: For assistance with specific errors or problems, please provide the exact error message or issue details in the question. This assistant doesn't have access to actual log content - only summary statistics - so specific error text needs to be shared for help.\n\nWhat would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const generateContextualPrompt = (userMessage: string) => {
    // CRITICAL: Do NOT include actual log content - only metadata
    let context = `You are an assistant helping with log file analysis. `;
    
    if (logs.length > 0 && summary) {
      // Only provide summary statistics, never actual log content
      context += `The user has analyzed a log file with the following summary statistics: `;
      context += `${summary.totalEntries} total entries, ${summary.errorCount} errors, ${summary.warningCount} warnings, ${summary.infoCount} info messages, ${summary.debugCount} debug messages. `;
      
      if (summary.criticalErrors.length > 0) {
        context += `${summary.criticalErrors.length} critical errors were found. `;
      }
      
      if (summary.topErrors.length > 0) {
        context += `${summary.topErrors.length} different error types were identified. `;
      }

      // Provide time range information only
      context += `Analysis time range: ${summary.timeRange.start.toISOString()} to ${summary.timeRange.end.toISOString()}. `;
    } else {
      context += `No log file has been uploaded yet. You can help explain log analysis concepts, common error patterns, and how to use this tool. `;
    }

    // Check if user is asking for report content
    const reportKeywords = ['report', 'pdf', 'additional', 'section', 'chart', 'graph', 'analysis', 'add to report', 'include in report', 'generate', 'create'];
    const isReportRequest = reportKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
    
    if (isReportRequest) {
      context += `\n\nIMPORTANT: The user is requesting content for their PDF report. Please format the response as professional report content with clear headings, bullet points, and structured formatting. Focus on providing actionable insights, detailed analysis, or specific recommendations based on the log statistics provided. Do not reference specific log entries as you don't have access to the actual log content - only work with the summary statistics provided.`;
    }
    
    context += `\n\nUser question: ${userMessage}\n\nPlease provide a helpful, concise response focused on log analysis and troubleshooting.`;
    
    return context;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Please configure the Google Gemini API key in the .env file to use the assistant.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = generateContextualPrompt(inputValue);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Check if this looks like report content
      const reportKeywords = ['report', 'pdf', 'additional', 'section', 'chart', 'graph', 'analysis', 'add to report', 'include in report', 'generate', 'create'];
      const isReportContent = reportKeywords.some(keyword => inputValue.toLowerCase().includes(keyword)) ||
                             text.includes('##') || text.includes('###') || text.includes('**') ||
                             text.length > 200; // Longer responses are likely report content

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        isUser: false,
        timestamp: new Date(),
        canAddToReport: isReportContent,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, an error was encountered while processing the request. Please check the API key and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToReport = (content: string, messageId: string) => {
    // Call the parent function to add content to report
    onAddToReport(content);
    
    // Mark message as added to report
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, addedToReport: true }
        : msg
    ));
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: "Hi! This assistant can help analyze log files, explain errors, and answer questions about system logs.\n\n🎯 **New Feature**: Additional content can be generated for PDF reports! Just ask to create specific analysis, charts, or insights, and they'll automatically be added to the report.\n\n⚠️ **Important Note**: For assistance with specific errors or problems, please provide the exact error message or issue details in the question. This assistant doesn't have access to actual log content - only summary statistics - so specific error text needs to be shared for help.\n\nWhat would you like to know?",
        isUser: false,
        timestamp: new Date(),
      }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
        aria-label="Open Assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-200 ${
      isMinimized ? 'w-96 h-14' : 'w-[450px] h-[600px]'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg transition-colors duration-200">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 dark:bg-blue-500 p-1.5 rounded-full">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Google Gemini</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={clearChat}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors duration-200"
            aria-label="Clear chat"
            title="Clear chat history"
          >
            <Trash2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors duration-200"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors duration-200"
            aria-label="Close chat"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 p-4 space-y-4 h-[460px] overflow-y-auto scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${
                  message.isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    message.isUser ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {message.isUser ? (
                      <User className="h-3 w-3 text-white" />
                    ) : (
                      <Bot className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>
                  <div className={`rounded-lg px-3 py-2 relative group ${
                    message.isUser
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                      
                      {/* Add to Report Button */}
                      {message.canAddToReport && !message.isUser && (
                        <button
                          onClick={() => addToReport(message.content, message.id)}
                          disabled={message.addedToReport}
                          className={`ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded text-xs flex items-center space-x-1 ${
                            message.addedToReport 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default opacity-100' 
                              : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-pointer'
                          }`}
                          title={message.addedToReport ? "Added to report" : "Add to report"}
                        >
                          {message.addedToReport ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Add to Report</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Bot className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about logs or request report content..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            {/* Simplified help text */}
            <div className="mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Try: "Add a section analyzing error patterns" or "Create recommendations for system optimization"
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}