import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, HeartHandshake } from 'lucide-react';
import SourceBadge from './SourceBadge';
import SafetyAlertCard from './SafetyAlertCard';
import QuickReplies from './QuickReplies';

export default function ChatContainer({
  messages,
  isTyping,
  inputValue,
  setInputValue,
  onSendMessage,
  branch,
  trimester,
  gestationalStage,
  healthStatus,
  onQuickReplySelect,
  onOpenFacilities
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden shadow-2xl">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble & Cards */}
              <div className={`max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                
                {/* Text Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                    isUser
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.text}

                  {/* Sources tag if bot message */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <SourceBadge sources={msg.sources} />
                  )}
                </div>

                {/* Safety Alert / Support Card if triggered */}
                {!isUser && msg.triggered_guardrail && (
                  <SafetyAlertCard
                    type={msg.triggered_guardrail}
                    supportCard={msg.support_card}
                    action={msg.action}
                    onOpenFacilities={onOpenFacilities}
                  />
                )}
                
                {/* Time */}
                <div className={`text-[10px] text-slate-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.time || 'Just now'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700 text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>MaternityCare AI is retrieving WHO guidelines...</span>
            </div>
          </div>
        )}

        {/* Inline Guided Quick Replies */}
        <QuickReplies
          branch={branch}
          trimester={trimester}
          gestationalStage={gestationalStage}
          healthStatus={healthStatus}
          onSelect={onQuickReplySelect}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-[#0d131f] flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            branch === 'initial'
              ? 'Select a path above or ask a general health question...'
              : 'Ask a question grounded in WHO medical guidelines...'
          }
          className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
        />
        
        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-amber-500/20 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
