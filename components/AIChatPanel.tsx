import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string) => Promise<void>;
  isThinking: boolean;
}

// Typewriter Component for Streaming Effect
const TypewriterEffect = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => {
        if (index >= text.length) {
          clearInterval(intervalId);
          return text;
        }
        return text.slice(0, index + 1);
      });
      index++;
    }, 20); // Typing speed

    return () => clearInterval(intervalId);
  }, [text]);

  return <span>{displayedText}</span>;
};

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose, onSend, isThinking }) => {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: t('aiDesc') }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      await onSend(currentInput);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: "I've updated the invoice based on your request. Is there anything else you'd like to adjust?" 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: "Sorry, I encountered an error processing that request." 
      }]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[40]"
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 md:bottom-24 right-0 md:right-8 z-[50] w-full md:w-[420px] h-[80vh] md:h-[650px] flex flex-col pointer-events-auto"
          >
            <div className="flex-1 flex flex-col bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl md:rounded-[24px] rounded-t-[24px] shadow-float border border-white/40 dark:border-white/10 overflow-hidden ring-1 ring-black/5">
              
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200/50 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                     <Sparkles className="w-5 h-5 text-white" fill="white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1D1D1F] dark:text-white leading-tight">Copilot</h3>
                    <p className="text-[11px] text-gray-500 font-medium">Powered by Gemini 2.0</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
                {messages.map((msg, idx) => {
                  // Only use typewriter effect for the LAST assistant message that was just added
                  const isLastAssistantMessage = msg.role === 'assistant' && idx === messages.length - 1 && idx > 0;
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                         <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center mb-1">
                            <Bot className="w-3.5 h-3.5 text-brand-500" />
                         </div>
                      )}
                      <div className={`
                        py-2.5 px-4 rounded-[20px] text-[15px] leading-relaxed max-w-[85%] shadow-sm backdrop-blur-md
                        ${msg.role === 'user' 
                          ? 'bg-brand-500 text-white rounded-br-none' 
                          : 'bg-white/60 dark:bg-[#2C2C2E]/60 text-[#1D1D1F] dark:text-gray-100 rounded-bl-none border border-white/20'}
                      `}>
                        {isLastAssistantMessage ? <TypewriterEffect text={msg.text} /> : msg.text}
                      </div>
                    </motion.div>
                  );
                })}
                {isThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center mb-1">
                       <Bot className="w-3.5 h-3.5 text-brand-500" />
                    </div>
                    <div className="bg-white/60 dark:bg-[#2C2C2E] py-3 px-4 rounded-[20px] rounded-bl-none shadow-sm flex gap-1.5 items-center h-10">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white/40 dark:bg-black/10 border-t border-gray-200/50 dark:border-white/5 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('aiPlaceholder')}
                    className="w-full bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white rounded-full pl-5 pr-12 py-3.5 outline-none border border-gray-200 dark:border-white/10 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm placeholder:text-gray-400"
                    disabled={isThinking}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="absolute right-2 p-1.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 transition-all shadow-md"
                  >
                    {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 pl-0.5" />}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};