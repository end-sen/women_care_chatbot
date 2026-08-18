import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ChevronDown, Mic, MicOff, Heart, Volume2, VolumeX } from 'lucide-react';
import SourceBadge from './SourceBadge';
import SafetyAlertCard from './SafetyAlertCard';
import QuickReplies from './QuickReplies';
import { speakWithLanguage } from '../utils/voiceSynthesizer';

function FormattedMessageText({ text, isLight }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let tableBuffer = [];

  const flushTable = (key) => {
    if (tableBuffer.length === 0) return;
    const cleanLines = tableBuffer.filter(l => l.trim().startsWith('|') && !l.includes('|---') && !l.includes('|----'));
    if (cleanLines.length > 0) {
      const headers = cleanLines[0].split('|').map(c => c.trim()).filter(Boolean);
      const rows = cleanLines.slice(1).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

      elements.push(
        <div key={`tbl-${key}`} className={`my-2.5 overflow-x-auto rounded-xl border p-1 shadow-sm ${
          isLight ? 'border-purple-200 bg-white/70' : 'border-purple-500/30 bg-purple-950/30'
        }`}>
          <table className="w-full text-left text-xs border-collapse">
            {headers.length > 0 && (
              <thead>
                <tr className={`border-b font-bold ${
                  isLight ? 'border-purple-200 bg-purple-100/60 text-purple-950' : 'border-purple-500/30 bg-purple-900/40 text-purple-200'
                }`}>
                  {headers.map((h, i) => (
                    <th key={i} className="p-2">{h.replace(/\*\*/g, '')}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-purple-500/10">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 align-top">{cell.replace(/\*\*/g, '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|')) {
      tableBuffer.push(line);
      return;
    } else if (tableBuffer.length > 0) {
      flushTable(idx);
    }

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={idx} className={`my-2.5 border-t ${isLight ? 'border-purple-300/60' : 'border-purple-500/30'}`} />);
      return;
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
      elements.push(
        <div key={idx} className={`font-bold text-xs sm:text-sm mt-3 mb-1 ${isLight ? 'text-purple-950' : 'text-purple-200'}`}>
          {title}
        </div>
      );
      return;
    }

    if (!trimmed) return;

    // Render line with bold inline formatting
    const parts = trimmed.split(/(\*\*.*?\*\*)/g);
    elements.push(
      <p key={idx} className="my-1 leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    );
  });

  if (tableBuffer.length > 0) {
    flushTable(lines.length);
  }

  return <div className="space-y-0.5">{elements}</div>;
}

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
  theme = 'light',
  speechLanguage = 'en-US',
  speechVoiceURI = ''
}) {
  const chatScrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [playingMsgIdx, setPlayingMsgIdx] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const isLight = theme === 'light';
  const hasUserMessaged = messages.some((m) => m.sender === 'user');

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
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      setIsListening(false);
    }
    setIsUserScrolledUp(false);
    onSendMessage(inputValue);
    setInputValue('');
  };

  // Audio Playback Speaker Button Handler
  const handleTogglePlayMessage = (idx, text) => {
    if (playingMsgIdx === idx) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingMsgIdx(null);
    } else {
      setPlayingMsgIdx(idx);
      speakWithLanguage({
        text,
        soundEnabled: true,
        langCode: speechLanguage || 'en-US',
        voiceURI: speechVoiceURI || '',
        onEnd: () => setPlayingMsgIdx(null),
        onError: () => setPlayingMsgIdx(null)
      });
    }
  };

  // Speech-to-Text Voice Input Handler
  const handleToggleListening = () => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Voice-to-text input is not supported in this browser. Please try Google Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = speechLanguage || 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript) {
          setInputValue(transcript);
        }
      };

      rec.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between relative">
      {/* Scrollable Messages Stream */}
      <div
        ref={chatScrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pr-1 relative scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
      >
        {/* Welcome Guide Bubble (Exact match to screenshot!) */}
        <div className="flex items-start gap-3">
          <img
            src="/maternal_avatar.jpg"
            alt="Elder Guide"
            className="w-9 h-9 rounded-full object-cover border border-purple-200 shadow-sm shrink-0"
          />
          <div className="bg-[#f3e8ff] border border-purple-200/80 rounded-2xl rounded-tl-none px-4 py-3 text-purple-950 text-sm font-medium shadow-xs max-w-[85%] flex items-center justify-between gap-3">
            <span>Welcome, dear! ♥</span>
            <span className="flex gap-1 animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            </span>
          </div>
        </div>

        {/* Conversation Stream */}
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={idx} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isUser ? (
                <img
                  src="/maternal_avatar.jpg"
                  alt="Naina Guide"
                  className="w-9 h-9 rounded-full object-cover border border-purple-200 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs transition-all ${
                    isUser
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-[#f3e8ff] text-[#4c1d95] rounded-tl-none border border-purple-200/80 font-medium'
                  }`}
                >
                  <FormattedMessageText text={msg.text} isLight={isLight} />
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

                {/* Audio Speaker Button */}
                <div className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <button
                    type="button"
                    onClick={() => handleTogglePlayMessage(idx, msg.text)}
                    title={playingMsgIdx === idx ? "Stop Audio" : "Listen to message"}
                    className={`flex items-center gap-1 text-[11px] font-semibold transition px-2.5 py-0.5 rounded-full border ${
                      playingMsgIdx === idx
                        ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    {playingMsgIdx === idx ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-white" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-purple-500" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-purple-400">
                    {msg.time || 'Just now'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-3">
            <img
              src="/maternal_avatar.jpg"
              alt="Naina Guide"
              className="w-8 h-8 rounded-full object-cover border border-purple-200 shadow-sm shrink-0"
            />
            <div className="p-3.5 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 border bg-purple-50 border-purple-200 text-purple-900">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
              <span>AmaniCare AI is retrieving WHO guidelines...</span>
            </div>
          </div>
        )}

        {/* Middle 2 Side-by-Side Care Path Cards (Matches Screenshot 1:1) */}
        {branch === 'initial' && !activeTopic && !hasUserMessaged && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {/* Card 1: Maternal Care */}
            <button
              onClick={() => onQuickReplySelect({ type: 'choose_branch', value: 'pregnancy_care', label: 'Pregnancy Care' })}
              className="bg-white border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-5 shadow-xs text-left transition hover:scale-[1.02] cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-xs">
                  <Heart className="w-5 h-5 fill-purple-600/20" />
                </div>
                <div className="font-bold text-sm text-purple-950">Maternal Care</div>
                <div className="text-xs text-purple-500 font-semibold mt-1 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Explore guidance →
                </div>
              </div>
            </button>

            {/* Card 2: Explore What's Right for You */}
            <button
              onClick={() => onQuickReplySelect({ type: 'choose_branch', value: 'whats_right_for_me', label: "What's Right For Me" })}
              className="bg-white border border-purple-100 hover:border-purple-300 rounded-2xl p-5 shadow-xs text-left transition hover:scale-[1.02] cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm text-purple-950">Explore What's Right for You</div>
                <div className="text-xs text-purple-500 font-semibold mt-1 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Discover recommendations →
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Guided Topics (Rendered dynamically when exploring branches) */}
        {branch !== 'initial' && (
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
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll Bottom */}
      {showScrollBottomBtn && (
        <button
          onClick={() => {
            setIsUserScrolledUp(false);
            scrollToBottom('smooth');
          }}
          className="absolute bottom-16 right-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-xl transition animate-bounce border bg-purple-600 text-white border-purple-400"
        >
          <ChevronDown className="w-4 h-4" />
          <span>Latest Messages</span>
        </button>
      )}

      {/* Voice Listening Active Banner */}
      {isListening && (
        <div className="px-4 py-1.5 bg-red-600/90 text-white text-xs font-bold flex items-center justify-between border-t border-red-400 animate-pulse z-10 rounded-xl my-1">
          <span className="flex items-center gap-2">
            <Mic className="w-4 h-4 animate-bounce" />
            <span>Voice-to-Text Active: Speak your question now...</span>
          </span>
          <button
            type="button"
            onClick={handleToggleListening}
            className="text-[10px] underline bg-black/20 px-2 py-0.5 rounded"
          >
            Click to Stop
          </button>
        </div>
      )}

      {/* Pill Input Bar (Exact match to screenshot!) */}
      <form onSubmit={handleSubmit} className="pt-3 bg-transparent">
        <div
          className={`flex items-center gap-3 rounded-full px-4 py-2.5 transition-all shadow-md ${
            isListening
              ? 'bg-red-950/20 border-2 border-red-500 ring-2 ring-red-500/30'
              : 'bg-white border border-purple-200 hover:border-purple-400 focus-within:border-purple-600'
          }`}
        >
          <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Listening... speak now" : "Ask me anything..."}
            className="flex-1 bg-transparent border-none outline-none text-sm text-purple-950 placeholder-purple-300 font-medium"
          />

          <button
            type="button"
            onClick={handleToggleListening}
            title={isListening ? "Stop voice listening" : "Speak message (Voice-to-Text)"}
            className={`p-2 rounded-full transition flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'text-purple-400 hover:text-purple-600'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 disabled:opacity-40 transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
