import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RefreshCw,
  Zap,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { ApiClient } from '../../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiChatbotDrawerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AiChatbotDrawer: React.FC<AiChatbotDrawerProps> = ({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) => {
  const { business } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = controlledOnToggle || (() => setInternalIsOpen((prev) => !prev));

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! 👋 I'm your MarketMind AI Copilot (powered by Google Gemini). How can I help you grow ${business?.name || 'your business'} today? Ask me for viral social hooks, Google Ads headlines, SEO strategies, or budget optimization!`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    '3 viral social hooks',
    'How do I rank #1 on Google?',
    'Optimize my daily ad spend',
    'Give me 5 Google Ads headlines',
  ];

  const handleSend = async (textToSend?: string) => {
    const msgText = (textToSend || input).trim();
    if (!msgText || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: m.text,
        }));

      const data = await ApiClient.sendChatMessage(msgText, history, business?.id);
      const botReply = data.reply || 'Strategy processed. How else can I help?';

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Chat copilot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Could not reach Gemini AI: ${err.message || 'Network error'}. Please check your connection or try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          aria-label="Open AI Copilot"
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 group ring-4 ring-brand-100/60"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <span className="text-xs font-extrabold pr-1 tracking-wide">AI Copilot</span>
        </button>
      )}

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          {/* Top Bar */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-brand-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-extrabold tracking-tight">MarketMind AI Copilot</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  {business?.name || 'Autonomous'} Marketing Advisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'assistant',
                      text: `Conversation cleared! How can I assist you next?`,
                      timestamp: 'Just now',
                    },
                  ])
                }
                title="Clear conversation"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleOpen}
                aria-label="Close"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3 shadow-xs space-y-1 ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <div
                    className={`text-[9px] text-right font-medium ${
                      m.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-slate-500">Copilot is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Strip */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 text-[10px] font-semibold whitespace-nowrap transition-colors border border-slate-200/60"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI Copilot anything..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white disabled:opacity-40 transition-all shadow-sm shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
