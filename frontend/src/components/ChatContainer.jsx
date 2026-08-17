import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ChevronDown, Plus, Mic, Heart, Sprout, Apple, ShieldAlert, MessageSquare } from 'lucide-react';
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
  activeTopic,
  onQuickReplySelect,
  onOpenFacilities,
  onOpenEscalation,
  theme = 'dark'
}) {
  const chatScrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const isLight = theme === 'light';

  const scrollToBottom = (behavior = 'smooth') => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottomBtn(!isNearBottom);
    setIsUserScrolledUp(!isNearBottom);
  };

  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom('smooth');
    }
  }, [messages, isTyping, activeTopic, branch, trimester, gestationalStage, healthStatus]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (!isUserScrolledUp) {
        scrollToBottom('auto');
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isUserScrolledUp]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    setIsUserScrolledUp(false);
    onSendMessage(inputValue);
    setInputValue('');
  };

  // Quick Action Grid cards from the mockups
  const quickGridActions = [
    {
      id: 'pregnancy_care',
      title: 'Pregnancy Care',
      icon: Heart,
      color: isLight ? 'text-purple-600 bg-purple-100' : 'text-purple-400 bg-purple-950/80 border border-purple-500/30',
      action: () => onQuickReplySelect({ type: 'choose_branch', value: 'pregnancy_care', label: 'Pregnancy Care' })
    },
    {
      id: 'health_tips',
      title: 'Health Tips',
      icon: Sprout,
      color: isLight ? 'text-emerald-600 bg-emerald-100' : 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/30',
      action: () => onSendMessage('What general maternal health tips and guidelines should I follow?', 'Health Tips')
    },
    {
      id: 'nutrition_guide',
      title: 'Nutrition Guide',
      icon: Apple,
      color: isLight ? 'text-purple-600 bg-purple-100' : 'text-orange-400 bg-orange-950/80 border border-orange-500/30',
      action: () => onSendMessage('What vitamins, foods, and nutrition are recommended during pregnancy?', 'Nutrition Guide')
    },
    {
      id: 'symptoms_check',
      title: 'Symptoms Check',
      icon: ShieldAlert,
      color: isLight ? 'text-purple-600 bg-purple-100' : 'text-indigo-400 bg-indigo-950/80 border border-indigo-500/30',
      action: () => onSendMessage('What common symptoms require medical attention during pregnancy?', 'Symptoms Check')
    },
    ...(!isLight
      ? [
          {
            id: 'ask_anything',
            title: 'Ask Anything',
            icon: MessageSquare,
            color: 'text-purple-300 bg-purple-900/60 border border-purple-500/30',
            action: () => onQuickReplySelect({ type: 'choose_branch', value: 'whats_right_for_me', label: "What's Right For Me" })
          }
        ]
      : [])
  ];

  return (
    <div
      className={`w-full h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl relative transition-colors duration-300 border ${
        isLight
          ? 'bg-white/80 border-purple-100 text-purple-950 shadow-purple-900/10'
          : 'bg-[#0f141c]/90 border-purple-500/20 text-slate-100 backdrop-blur-md shadow-black/60'
      }`}
    >
      {/* Messages & Hero Scroll Area */}
      <div
        ref={chatScrollRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-4 relative scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {/* HERO BANNER SECTION (Matching light & dark theme uploaded mockups) */}
        <div
          className={`relative p-5 rounded-3xl overflow-hidden mb-2 transition-all ${
            isLight
              ? 'bg-gradient-to-r from-[#f7f2eb] via-[#f2e9df] to-[#ede2d6] border border-purple-200/60 text-purple-950 shadow-sm'
              : 'bg-gradient-to-r from-[#171226] via-[#1b1730] to-[#121926] border border-purple-500/30 text-purple-100 shadow-xl'
          }`}
        >
          {/* Elder Maternal Figure Graphic Overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 overflow-hidden pointer-events-none opacity-90">
            <img
              src="/maternal_avatar.jpg"
              alt="Maternal Health Guide"
              className="w-full h-full object-cover object-top mask-radial"
              style={{
                maskImage: isLight
                  ? 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: isLight
                  ? 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)'
                  : 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>

          <div className="relative z-10 max-w-[65%] sm:max-w-[60%] space-y-1.5">
            <div className={`text-xs font-semibold tracking-wide ${isLight ? 'text-purple-700' : 'text-purple-300/80'}`}>
              Good Morning {isLight ? <span className="font-bold text-purple-600">Anwash! ♥</span> : <span className="font-bold text-purple-400">Anwash!</span>}
            </div>

            <h2 className={`text-xl sm:text-2xl font-extrabold leading-tight ${isLight ? 'text-purple-950 font-heading' : 'text-white font-heading'}`}>
              How can I help you today?
            </h2>

            {/* Subtle Pill Accent */}
            <div className={`w-8 h-1 rounded-full ${isLight ? 'bg-purple-400' : 'bg-purple-500'}`}></div>

            <p className={`text-xs leading-relaxed pt-1 ${isLight ? 'text-purple-800' : 'text-slate-300'}`}>
              I'm here to support your pregnancy journey and women's health.
            </p>

            {/* Dark Theme Sub-Card (Image 2) */}
            {!isLight && (
              <div className="mt-3 p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 backdrop-blur-md flex items-center gap-2.5 shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">Utopian Women Maternal Health</div>
                  <div className="text-[10px] text-purple-400">Care. Support. Utopia.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHAT MESSAGES STREAM */}
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={idx} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar Icon */}
              {!isUser ? (
                <div className="relative shrink-0">
                  <img
                    src="/maternal_avatar.jpg"
                    alt="Guide"
                    className={`w-9 h-9 rounded-full object-cover border-2 shadow-md ${
                      isLight ? 'border-purple-300' : 'border-purple-500/60'
                    }`}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md transition-all ${
                    isUser
                      ? isLight
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-purple-900/60 border border-purple-500/40 text-purple-100 rounded-tr-none'
                      : isLight
                      ? 'bg-[#f3e8ff] text-[#581c87] rounded-tl-none border border-purple-200/80 font-medium'
                      : 'bg-slate-900/80 border border-purple-500/20 text-slate-100 rounded-tl-none backdrop-blur-md'
                  }`}
                >
                  {msg.text}

                  {!isUser && msg.sources && msg.sources.length > 0 && <SourceBadge sources={msg.sources} />}
                </div>

                {!isUser && msg.triggered_guardrail && (
                  <SafetyAlertCard
                    type={msg.triggered_guardrail}
                    supportCard={msg.support_card}
                    action={msg.action}
                    onOpenFacilities={onOpenFacilities}
                    onOpenEscalation={onOpenEscalation}
                  />
                )}

                <div className={`text-[10px] ${isLight ? 'text-purple-400' : 'text-slate-500'} mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.time || 'Just now'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div
              className={`p-3.5 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 border ${
                isLight ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-slate-800/90 border-slate-700 text-slate-300'
              }`}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
              <span>MaternityCare AI is retrieving WHO guidelines...</span>
            </div>
          </div>
        )}

        {/* QUICK ACTION GRID CARDS (From Mockups) */}
        <div className="my-3 space-y-2">
          <div className={`grid ${isLight ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-5'} gap-2.5`}>
            {quickGridActions.map((card) => {
              const IconComp = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={card.action}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition hover:scale-[1.03] active:scale-[0.98] shadow-sm text-center ${
                    isLight
                      ? 'bg-white border border-purple-100 hover:border-purple-300 text-purple-950'
                      : 'bg-slate-900/60 border border-purple-500/20 hover:border-purple-500/50 text-slate-100 backdrop-blur-md'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl mb-1.5 font-bold ${card.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{card.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VOICE AI ASSISTANT GLOWING ORB (Dark Theme / Voice Active) */}
        {(!isLight || isTyping) && (
          <div className="my-4 flex flex-col items-center justify-center py-2">
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 animate-orb-glow cursor-pointer transition hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-[#0d111a] flex items-center justify-center border border-purple-400/50">
                <Sparkles className="w-6 h-6 text-purple-300 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Inline Guided Options */}
        <QuickReplies
          branch={branch}
          trimester={trimester}
          gestationalStage={gestationalStage}
          healthStatus={healthStatus}
          activeTopic={activeTopic}
          onSelect={onQuickReplySelect}
          onOpenFacilities={onOpenFacilities}
          theme={theme}
        />

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={() => {
            setIsUserScrolledUp(false);
            scrollToBottom('smooth');
          }}
          className={`absolute bottom-16 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-xl transition animate-bounce border ${
            isLight
              ? 'bg-purple-600 text-white border-purple-400'
              : 'bg-purple-600 text-white border-purple-400'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
          <span>Latest Messages</span>
        </button>
      )}

      {/* PILL INPUT BAR (Exact match to uploaded Light & Dark mockups!) */}
      <form onSubmit={handleSubmit} className={`p-3 transition-colors duration-300 border-t ${isLight ? 'bg-white border-purple-100' : 'bg-[#0b0e14] border-purple-500/20'}`}>
        <div
          className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-all shadow-md ${
            isLight
              ? 'bg-white border border-purple-200 hover:border-purple-400 focus-within:border-purple-600'
              : 'bg-slate-900/80 border border-purple-500/30 hover:border-purple-500/60 focus-within:border-purple-400 backdrop-blur-md'
          }`}
        >
          {/* Left Icon: Sparkles in Light, Plus in Dark */}
          <div className="shrink-0">
            {isLight ? (
              <Sparkles className="w-5 h-5 text-purple-500" />
            ) : (
              <button type="button" className="p-1 text-slate-400 hover:text-purple-300 transition">
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            className={`flex-1 bg-transparent border-none py-2 text-xs sm:text-sm focus:outline-none ${
              isLight ? 'text-purple-950 placeholder-purple-400' : 'text-slate-100 placeholder-slate-400'
            }`}
          />

          {/* Microphone Icon in Dark Theme Input */}
          {!isLight && (
            <button type="button" className="p-1 text-slate-400 hover:text-purple-300 transition shrink-0">
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 shadow-md ${
              isLight
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-purple-600/40'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

