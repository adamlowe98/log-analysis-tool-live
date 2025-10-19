import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Bot, User, Package, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getProductDocumentation, ProductDocumentation } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function ProductCompatibilityChecker() {
  const [documentation, setDocumentation] = useState<ProductDocumentation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm the Product Compatibility Checker assistant. I can help you find information about ProjectWise version support, compatibility matrices, and product versions.\n\nI have access to ProjectWise Version Support Matrix documentation for 2023, 2024, and 2025.\n\nAsk me questions like:\n• What versions of SQL Server are supported with ProjectWise 2025?\n• Is Oracle 19c compatible with ProjectWise 2024?\n• What operating systems support ProjectWise 2023?\n• What are the browser requirements for ProjectWise Web?\n\nWhat would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocumentation();
  }, []);

  const loadDocumentation = async () => {
    try {
      const docs = await getProductDocumentation();
      setDocumentation(docs);
    } catch (error) {
      console.error('Failed to load documentation:', error);
    }
  };

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

  const generatePrompt = (userMessage: string) => {
    let context = `You are a ProjectWise Product Compatibility expert assistant. Your role is to help users understand version compatibility, supported products, and system requirements for ProjectWise.

`;

    if (documentation.length > 0) {
      context += `You have access to the following ProjectWise Version Support Matrix documentation:\n\n`;

      documentation.forEach(doc => {
        context += `--- ${doc.title} ${doc.year ? `(${doc.year})` : ''} ---\n`;
        context += `${doc.content}\n\n`;
      });

      context += `\nBased on this documentation, answer the user's question with specific details.\n`;
    } else {
      context += `Note: Documentation is being loaded. Provide general guidance about ProjectWise version support based on common knowledge.\n\n`;
      context += `General topics include:\n`;
      context += `- Supported database versions (SQL Server, Oracle, PostgreSQL)\n`;
      context += `- Operating system compatibility (Windows Server, Windows client)\n`;
      context += `- Browser requirements for ProjectWise Web\n`;
      context += `- Microsoft Office integration support\n`;
      context += `- .NET Framework requirements\n`;
    }

    context += `\nWhen answering questions:\n`;
    context += `1. Provide specific version numbers and compatibility details when available\n`;
    context += `2. Reference which ProjectWise version year you're discussing\n`;
    context += `3. Highlight any important notes about support lifecycles or deprecations\n`;
    context += `4. If you're not certain about specific details, acknowledge that\n`;
    context += `5. Be clear and concise in your responses\n`;
    context += `6. Format responses with bullet points and clear sections\n\n`;

    context += `User Question: ${userMessage}\n\n`;
    context += `Please provide a helpful, accurate response based on the documentation provided.`;

    return context;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Please configure the Google Gemini API key in the .env file to use the Product Compatibility Checker.",
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
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = generatePrompt(inputValue);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        isUser: false,
        timestamp: new Date(),
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

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: "Hi! I'm the Product Compatibility Checker assistant. I can help you find information about ProjectWise version support, compatibility matrices, and product versions.\n\nI have access to ProjectWise Version Support Matrix documentation for 2023, 2024, and 2025.\n\nAsk me questions like:\n• What versions of SQL Server are supported with ProjectWise 2025?\n• Is Oracle 19c compatible with ProjectWise 2024?\n• What operating systems support ProjectWise 2023?\n• What are the browser requirements for ProjectWise Web?\n\nWhat would you like to know?",
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
        className="fixed bottom-6 left-6 bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
        aria-label="Open Product Compatibility Checker"
        title="Product Compatibility Checker"
      >
        <Package className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-200 ${
      isMinimized ? 'w-96 h-14' : 'w-[450px] h-[600px]'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 rounded-t-lg transition-colors duration-200">
        <div className="flex items-center space-x-2">
          <div className="bg-green-600 dark:bg-green-500 p-1.5 rounded-full">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Product Compatibility</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">ProjectWise Version Support</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={clearChat}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors duration-200"
            aria-label="Clear chat"
            title="Clear chat history"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors duration-200"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors duration-200"
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
            <style>{`
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
                    message.isUser ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-600'
                  }`}>
                    {message.isUser ? (
                      <User className="h-3 w-3 text-white" />
                    ) : (
                      <Package className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.isUser
                      ? 'bg-green-600 dark:bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.isUser ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Package className="h-3 w-3 text-gray-600 dark:text-gray-300" />
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
                placeholder="Ask about product compatibility..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ask about ProjectWise version support, database compatibility, OS requirements, and more
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
