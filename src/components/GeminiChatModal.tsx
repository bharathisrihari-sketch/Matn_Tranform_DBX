import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  AlertCircle,
  Cpu,
  Zap,
  Code2,
  HelpCircle,
  ChevronDown,
  EyeOff
} from 'lucide-react';
import { MatillionJob, ConversionOptions } from '../types/matillion';
import { ComplexityBreakdown } from '../services/complexityScorer';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: MatillionJob;
  options: ConversionOptions;
  complexity: {
    score: number;
    rating: string;
    summary?: string;
  };
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  job,
  options,
  complexity
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I am **Gemini Tranformx**, your specialized Matillion-to-Databricks AI Migration Copilot. I can assist with converting and optimizing your pipelines for Databricks PySpark and Delta Live Tables (DLT).

Current active job: **${job.name}** (${job.jobType})
Conversion Complexity Score: **${complexity.score}/100 (${complexity.rating})**

How can I help you transform, validate, or optimize this pipeline today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, messages]);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <aside aria-label="Gemini Tranformx Assistant" className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2 p-2 px-3.5 bg-slate-900 border border-slate-700 rounded-full shadow-2xl backdrop-blur-md">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">Gemini Tranformx</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold hover:bg-cyan-500/30 transition-colors ml-1"
          >
            Show Chat
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Hide Gemini Tranformx"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newHistory.map(m => ({
            role: m.role,
            text: m.text
          })),
          jobContext: {
            name: job.name,
            jobType: job.jobType,
            description: job.description,
            componentsCount: job.components.length,
            componentsList: job.components.map(c => `${c.name} (${c.type})`).join(', '),
            outputFormat: options.outputFormat,
            useUnityCatalog: options.useUnityCatalog,
            complexityScore: complexity.score,
            complexityRating: complexity.rating
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini.');
      }

      const assistantMsg: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model || selectedModel
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Could not connect to the Gemini API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    `Explain the complexity score of ${job.name}`,
    `How is the Delta MERGE output implemented?`,
    `Generate PySpark pytest unit tests for this job`,
    `How does DLT handle data quality expectations here?`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[640px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Gemini Tranformx</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  AI Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Context-aware &bull; {job.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector Pill */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 ml-1" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as any)}
                className="bg-transparent text-[11px] text-slate-200 font-medium px-1 py-0.5 rounded focus:outline-none cursor-pointer"
                title="Select Gemini Model"
              >
                <option value="gemini-3.8-flash" className="bg-slate-900 text-slate-200">
                  gemini-3.8-flash (Recommended)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-slate-200">
                  gemini-3.1-flash-lite (Fast)
                </option>
                <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-slate-200">
                  gemini-3.1-pro-preview (Complex)
                </option>
              </select>
            </div>

            {/* Clear conversation */}
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'reset',
                    role: 'model',
                    text: `Conversation cleared. I am ready to assist with **${job.name}**!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Minimize to bottom floating pill */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Minimize to floating pill"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Explicit Hide Chatbot Toggle Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors shadow-sm"
              title="Hide Gemini Tranformx Chatbot (Click toggle button to reopen anytime)"
            >
              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hide Chatbot</span>
            </button>

            {/* Close X Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close window"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 relative group ${
                    isUser
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-br-xs shadow-md shadow-orange-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                    <span className="font-semibold">{isUser ? 'You' : 'Gemini Copilot'}</span>
                    <span>{m.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed select-text font-sans">
                    {m.text}
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => handleCopyMessage(m.text, m.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                      title="Copy message"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-orange-400" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs p-3.5 flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="text-[11px]">Gemini is reasoning and drafting PySpark migration response...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Error:</span> {errorMsg}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Suggestions:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] text-slate-300 hover:text-cyan-300 bg-slate-950 hover:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-800 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask anything about migrating this job (e.g. explain SCD2, optimize join, create test)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-sans"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-40 text-white shadow-md shadow-cyan-500/20 transition-all shrink-0"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
