import React, { useState, useRef, useEffect } from 'react';
import { Package, Send, X, Minimize2, User, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const DOCUMENTATION_CONTEXT = `You are a ProjectWise Product Compatibility expert assistant with access to Bentley's official documentation.

CRITICAL DEPLOYMENT MODEL INFORMATION:
- ProjectWise 2024 and ProjectWise 2025 are CLOUD-BASED versions
- ProjectWise 2023 and earlier versions are ON-PREMISE versions
- Cloud versions (2024, 2025) do NOT use databases like SQL Server, Oracle, or PostgreSQL - they are hosted by Bentley
- On-premise versions (2023 and earlier) require database installations (SQL Server, Oracle, PostgreSQL)
- If a user asks about database compatibility for 2024 or 2025, inform them these are cloud-based and do not require database setup

CRITICAL INSTRUCTIONS:
- Provide ONLY specific version numbers and compatibility information
- Format responses as concise lists with exact version numbers
- Use proper line breaks (\n) to ensure readability - NEVER create overly long single lines
- If you don't have specific information, clearly state "I don't have specific version information for this. Please check the official Bentley documentation at [relevant URL]"
- Do NOT provide vague or generic answers
- Do NOT make up version numbers if you're unsure

Example good response format:
"ProjectWise Administrator 2025 is compatible with:
- PWDI 10.14.0.0 and later
- PWDI 10.13.0.5 and later
- PWDI 10.12.0.8 and later"

Example bad response format:
"ProjectWise Administrator 2025 works with various versions of PWDI. You'll want to make sure you have a recent version that supports the features you need..."

Common topics include:
- Windows Server and client OS requirements
- Browser requirements for ProjectWise Web
- Microsoft Office integration
- .NET Framework requirements
- PWDI (ProjectWise Design Integration) version compatibility
- Database compatibility (ONLY for 2023 and earlier - SQL Server, Oracle, PostgreSQL)`;

export function ProductCompatibilityChecker() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I can help you with ProjectWise version support and compatibility questions.\n\nAsk me about:\n• PWDI (ProjectWise Design Integration) version compatibility\n• Database compatibility (SQL Server, Oracle, PostgreSQL) - for 2023 and earlier\n• Operating system requirements\n• Browser support for ProjectWise Web\n• Microsoft Office integration\n\n📌 Note: ProjectWise 2024 and 2025 are cloud-based and don't require database setup\n\nI'll provide specific version numbers when available. For the most current information, always verify with official Bentley documentation.\n\nWhat would you like to know?",
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

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Please configure the Google Gemini API key in the .env file to use the Product Compatibility assistant.",
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
      const [docsResult, glossaryResult] = await Promise.all([
        supabase
          .from('product_documentation')
          .select('*')
          .order('year', { ascending: false }),
        supabase
          .from('projectwise_glossary')
          .select('*')
          .order('abbreviation', { ascending: true })
      ]);

      const docs = docsResult.data;
      const glossary = glossaryResult.data;

      let contextWithDocs = DOCUMENTATION_CONTEXT;

      if (glossary && glossary.length > 0) {
        contextWithDocs += "\n\n=== PROJECTWISE TERMINOLOGY & ABBREVIATIONS ===\n";
        contextWithDocs += "Use this glossary to understand abbreviations and alternative names in user questions:\n\n";

        for (const term of glossary) {
          contextWithDocs += `- ${term.abbreviation} = ${term.full_term}`;
          if (term.aliases && term.aliases.length > 0) {
            contextWithDocs += ` (Also known as: ${term.aliases.join(', ')})`;
          }
          if (term.description) {
            contextWithDocs += ` - ${term.description}`;
          }
          contextWithDocs += "\n";
        }
        contextWithDocs += "\n=== END GLOSSARY ===\n";
      }

      if (docs && docs.length > 0) {
        contextWithDocs += "\n\n=== OFFICIAL BENTLEY DOCUMENTATION ===\n";
        contextWithDocs += "You have access to the following official Bentley documentation. Use this information to answer questions:\n\n";

        for (const doc of docs) {
          contextWithDocs += `\n--- ${doc.title} (${doc.year}) ---\n`;
          contextWithDocs += `Source: ${doc.url}\n`;
          contextWithDocs += `Content:\n${doc.content}\n`;
          contextWithDocs += "\n---\n";
        }

        contextWithDocs += "\n=== END DOCUMENTATION ===\n";
        contextWithDocs += "\nIMPORTANT: Base your answer ONLY on the documentation provided above. If the answer is in the documentation, provide specific version numbers and compatibility details. If the information is not in the documentation above, clearly state that you don't have this specific information in the knowledge base.";
      } else {
        contextWithDocs += "\n\nNOTE: No documentation has been loaded into the knowledge base yet. You should inform the user that documentation needs to be added for specific version information.";
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `${contextWithDocs}\n\nUser question: ${inputValue}\n\nProvide a specific, structured answer with exact version numbers based on the documentation provided. If the information is not in the documentation, clearly state that.`;

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
        content: "Hi! I can help you with ProjectWise version support and compatibility questions.\n\nAsk me about:\n• PWDI (ProjectWise Design Integration) version compatibility\n• Database compatibility (SQL Server, Oracle, PostgreSQL) - for 2023 and earlier\n• Operating system requirements\n• Browser support for ProjectWise Web\n• Microsoft Office integration\n\n📌 Note: ProjectWise 2024 and 2025 are cloud-based and don't require database setup\n\nI'll provide specific version numbers when available. For the most current information, always verify with official Bentley documentation.\n\nWhat would you like to know?",
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
                  <div className={`rounded-lg px-3 py-2 break-words ${
                    message.isUser
                      ? 'bg-green-600 dark:bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">{message.content}</p>
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
                General ProjectWise compatibility guidance
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
