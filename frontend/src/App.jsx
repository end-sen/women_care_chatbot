import React, { useState, useEffect, useRef } from 'react';
import DisclaimerHeader from './components/DisclaimerHeader';
import AvatarCanvas from './components/AvatarCanvas';
import ChatContainer from './components/ChatContainer';
import FacilityFinderModal from './components/FacilityFinderModal';
import EscalationModal from './components/EscalationModal';
import ConsentModal from './components/ConsentModal';
import AboutDemoModal from './components/AboutDemoModal';
import { Heart, Home, User } from 'lucide-react';
import { speakWithLanguage, cleanTextForSpeech, PROPLUS_NOVA_PROFILE } from './utils/voiceSynthesizer';

// Generate or retrieve anonymous session UUID (Phase 2b)
const getOrCreateSessionId = () => {
  let sid = sessionStorage.getItem('maternity_session_id');
  if (!sid) {
    sid = 'session_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
    sessionStorage.setItem('maternity_session_id', sid);
  }
  return sid;
};

export default function App() {
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);
  const [isConsentOpen, setIsConsentOpen] = useState(() => !sessionStorage.getItem('maternity_consent_agreed'));
  const [isAboutDemoOpen, setIsAboutDemoOpen] = useState(false);

  // Theme state: 'light' or 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('maternity_app_theme');
    return saved || 'light';
  });

  // Speech language & voice state
  const [speechLanguage, setSpeechLanguage] = useState(() => {
    return localStorage.getItem('maternity_speech_lang') || 'en-US';
  });
  const [speechVoiceURI, setSpeechVoiceURI] = useState(() => {
    return localStorage.getItem('maternity_speech_voice_uri') || '';
  });

  const isLight = theme === 'light';

  useEffect(() => {
    localStorage.setItem('maternity_app_theme', theme);
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('maternity_speech_lang', speechLanguage);
  }, [speechLanguage]);

  useEffect(() => {
    localStorage.setItem('maternity_speech_voice_uri', speechVoiceURI);
  }, [speechVoiceURI]);

  useEffect(() => {
    // Ensure initial entry goes through Landing Page (index2.html) first if unauthenticated
    if (!sessionStorage.getItem('maternity_user') && !sessionStorage.getItem('maternity_consent_agreed')) {
      const isLandingPage = window.location.pathname.endsWith('index2.html');
      if (!isLandingPage) {
        window.location.href = 'index2.html';
      }
    }
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const getUserGreeting = () => {
    try {
      const raw = sessionStorage.getItem('maternity_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u && u.name) {
          return u.isGuest ? 'Mama Guest' : u.name;
        }
      }
    } catch (_) {}
    return null;
  };

  const userName = getUserGreeting();
  const defaultWelcomeMsg = userName
    ? `Jambo ${userName} & Welcome to MaternityCare! I am your AI maternal health companion. All guidance provided is strictly grounded in WHO medical guidelines.\n\nPlease select one of the care options below to begin:`
    : "Jambo & Welcome to MaternityCare! I am your AI maternal health companion. All guidance provided is strictly grounded in WHO medical guidelines.\n\nPlease select one of the care options below to begin:";

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('maternity_chat_messages');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return [
      {
        sender: 'bot',
        text: defaultWelcomeMsg,
        sources: ["WHO - Reproductive & Maternal Health"],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [branch, setBranch] = useState('initial');
  const [trimester, setTrimester] = useState('unspecified');
  const [gestationalStage, setGestationalStage] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityModalFilter, setFacilityModalFilter] = useState('all');
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);

  // Active Bottom Nav Tab state
  const [activeNavTab, setActiveNavTab] = useState('home');

  useEffect(() => {
    sessionStorage.setItem('maternity_chat_messages', JSON.stringify(messages));
  }, [messages]);

  const speakingTimerRef = useRef(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speakText = (text) => {
    if (!text) return;
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    if (speakingTimerRef.current) {
      clearTimeout(speakingTimerRef.current);
      clearInterval(speakingTimerRef.current);
    }

    if (soundEnabled && typeof window !== 'undefined' && ('speechSynthesis' in window)) {
      setIsAvatarSpeaking(true);

      speakWithLanguage({
        text: cleanText,
        soundEnabled: true,
        langCode: speechLanguage,
        voiceURI: speechVoiceURI,
        onStart: () => {
          setIsAvatarSpeaking(true);
        },
        onEnd: () => {
          if (speakingTimerRef.current) {
            clearTimeout(speakingTimerRef.current);
            clearInterval(speakingTimerRef.current);
          }
          setIsAvatarSpeaking(false);
        },
        onError: () => {
          if (speakingTimerRef.current) {
            clearTimeout(speakingTimerRef.current);
            clearInterval(speakingTimerRef.current);
          }
          setIsAvatarSpeaking(false);
        }
      });

      // Synchronize lip animation state continuously with SpeechSynthesis active status
      speakingTimerRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsAvatarSpeaking(false);
          clearInterval(speakingTimerRef.current);
        } else {
          setIsAvatarSpeaking(true);
        }
      }, 250);

    } else {
      // Fallback calculation for muted state (realistic reading speed ~70ms/char, no artificial cap)
      setIsAvatarSpeaking(true);
      const estDuration = Math.max(3000, cleanText.length * 70);
      speakingTimerRef.current = setTimeout(() => {
        setIsAvatarSpeaking(false);
      }, estDuration);
    }
  };

  const handleOpenFacilities = (filterType = 'all') => {
    setFacilityModalFilter(filterType);
    setIsFacilityModalOpen(true);
  };

  const handleConsentAgree = () => {
    sessionStorage.setItem('maternity_consent_agreed', 'true');
    setIsConsentOpen(false);
  };

  const handleClearConversation = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAvatarSpeaking(false);
    
    const newSid = 'session_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
    sessionStorage.setItem('maternity_session_id', newSid);
    setSessionId(newSid);
    sessionStorage.removeItem('maternity_chat_messages');

    setBranch('initial');
    setTrimester('unspecified');
    setGestationalStage(null);
    setHealthStatus(null);
    setActiveTopic(null);
    
    const welcomeMsg = "Conversation history cleared. Jambo & Welcome back to MaternityCare! Please choose a care path below to begin:";
    setMessages([
      {
        sender: 'bot',
        text: welcomeMsg,
        sources: ["WHO - Reproductive & Maternal Health"],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    speakText(welcomeMsg);
  };

  const handleSendMessage = async (userText, displayLabel = null, topicTag = null) => {
    if (!userText.trim()) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const displayText = displayLabel || userText;
    
    let detectedTopic = topicTag;
    if (!detectedTopic) {
      const lower = userText.toLowerCase();
      if (lower.includes('prevention') || lower.includes('contracept') || lower.includes('condom') || lower.includes('iud') || lower.includes('pill') || lower.includes('larc')) {
        detectedTopic = 'prevention';
      } else if (lower.includes('termination') || lower.includes('abortion')) {
        detectedTopic = 'termination';
      } else if (lower.includes('continuing') || lower.includes('prenatal')) {
        detectedTopic = 'continuing_pregnancy';
      } else if (lower.includes('adoption') || lower.includes('foster')) {
        detectedTopic = 'adoption';
      } else if (lower.includes('nutrition') || lower.includes('diet') || lower.includes('vitamin') || lower.includes('folic') || lower.includes('iron') || lower.includes('eat')) {
        detectedTopic = 'nutrition';
      } else if (lower.includes('symptom') || lower.includes('cramp') || lower.includes('nausea') || lower.includes('vomit') || lower.includes('pain')) {
        detectedTopic = 'symptoms';
      } else if (lower.includes('appointment') || lower.includes('anc') || lower.includes('schedule') || lower.includes('visit')) {
        detectedTopic = 'appointments';
      } else if (lower.includes('mental') || lower.includes('stress') || lower.includes('anxiety') || lower.includes('sleep') || lower.includes('wellbeing')) {
        detectedTopic = 'wellbeing';
      }
    }
    if (detectedTopic) {
      setActiveTopic(detectedTopic);
    }

    const updatedMessages = [
      ...messages,
      { sender: 'user', text: displayText, time: timeStr }
    ];
    setMessages(updatedMessages);
    setIsTyping(true);
    setIsAvatarSpeaking(true);

    const historyPayload = updatedMessages.slice(-8).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          branch: branch,
          trimester: trimester,
          gestational_stage: gestationalStage,
          health_status: healthStatus,
          history: historyPayload,
          session_id: sessionId,
          language: speechLanguage
        })
      });

      if (!response.ok) {
        let errDetail = `Server error ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson && errJson.detail) errDetail = errJson.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.response,
          sources: data.sources || [],
          triggered_guardrail: data.triggered_guardrail,
          action: data.action,
          support_card: data.support_card,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      speakText(data.response);

    } catch (err) {
      console.error('API Error:', err);
      const errorMsg = "I encountered a temporary connection issue. Please ensure the MaternityCare backend server is running.";
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: errorMsg,
          sources: [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      speakText(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReplySelect = (item) => {
    if (item.type === 'choose_branch') {
      setBranch(item.value);
      setActiveTopic(null);
      if (item.value === 'pregnancy_care') {
        handleSendMessage("I want to explore Pregnancy Care.", "Pregnancy Care");
      } else {
        handleSendMessage("I want to explore What's Right For Me.", "What's Right For Me");
      }
    } else if (item.type === 'set_trimester') {
      setTrimester(item.value);
      handleSendMessage(`I am in my ${item.value} trimester.`, `${item.value} Trimester`);
    } else if (item.type === 'set_gestational') {
      setGestationalStage(item.value);
      handleSendMessage(`Gestational Stage: ${item.label}`, item.label);
    } else if (item.type === 'set_health_status') {
      setHealthStatus(item.value);
      handleSendMessage(`General Health Status: ${item.label}`, item.label);
    } else if (item.type === 'ask_question') {
      handleSendMessage(item.query, item.label || item.query, item.topicTag);
    } else if (item.type === 'reset_topic') {
      setActiveTopic(null);
    }
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col transition-colors duration-300 overflow-hidden ${
        isLight ? 'bg-[#fcf9f5] text-purple-950' : 'bg-[#0b0e14] text-slate-100'
      }`}
    >
      {/* 1. Top Navigation & Disclaimer Header */}
      <DisclaimerHeader
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const nextState = !soundEnabled;
          setSoundEnabled(nextState);
          if (!nextState && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsAvatarSpeaking(false);
          }
        }}
        speechLanguage={speechLanguage}
        onChangeSpeechLanguage={setSpeechLanguage}
        speechVoiceURI={speechVoiceURI}
        onChangeSpeechVoiceURI={setSpeechVoiceURI}
        onOpenFacilities={() => handleOpenFacilities('all')}
        onResetSession={handleClearConversation}
        onOpenEscalation={() => setIsEscalationModalOpen(true)}
        onOpenAboutDemo={() => setIsAboutDemoOpen(true)}
      />

      {/* 2. Main Viewport Grid */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-2.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-y-auto lg:overflow-hidden pb-16 lg:pb-4">
        
        {/* Left Column: 3D Interactive Talking Avatar Viewport */}
        <div className="lg:col-span-4 h-[320px] lg:h-full flex flex-col min-h-0">
          <AvatarCanvas isSpeaking={isAvatarSpeaking || isTyping} theme={theme} />
        </div>

        {/* Right Column: Main Chat & Guided Flow */}
        <div className="lg:col-span-8 h-[580px] lg:h-full flex flex-col min-h-0 overflow-hidden">
          <ChatContainer
            messages={messages}
            isTyping={isTyping}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            branch={branch}
            trimester={trimester}
            gestationalStage={gestationalStage}
            healthStatus={healthStatus}
            activeTopic={activeTopic}
            onQuickReplySelect={handleQuickReplySelect}
            onOpenFacilities={handleOpenFacilities}
            onOpenEscalation={() => setIsEscalationModalOpen(true)}
            theme={theme}
          />
        </div>

      </main>

      {/* 3. Bottom Mobile/Tablet App Navigation Bar (As shown in mockups) */}
      <nav
        className={`w-full py-2 px-6 flex items-center justify-around border-t transition-colors duration-300 z-20 shrink-0 ${
          isLight ? 'bg-white/95 border-purple-100 text-purple-900 shadow-lg' : 'bg-[#0f141c]/95 border-purple-500/20 text-slate-300'
        }`}
      >
        <button
          onClick={() => {
            setActiveNavTab('my_care');
            handleQuickReplySelect({ type: 'choose_branch', value: 'pregnancy_care', label: 'Pregnancy Care' });
          }}
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold transition ${
            activeNavTab === 'my_care'
              ? isLight ? 'text-purple-600 font-bold' : 'text-purple-400 font-bold'
              : isLight ? 'text-slate-500 hover:text-purple-600' : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>My Care</span>
        </button>

        <button
          onClick={() => setActiveNavTab('home')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
            activeNavTab === 'home'
              ? isLight
                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                : 'bg-purple-900/60 text-purple-200 border border-purple-500/40'
              : isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => {
            setActiveNavTab('profile');
            setIsAboutDemoOpen(true);
          }}
          className={`flex flex-col items-center gap-0.5 text-xs font-semibold transition ${
            activeNavTab === 'profile'
              ? isLight ? 'text-purple-600 font-bold' : 'text-purple-400 font-bold'
              : isLight ? 'text-slate-500 hover:text-purple-600' : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>

      {/* 4. Modals */}
      <FacilityFinderModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        initialFilter={facilityModalFilter}
      />

      <EscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
      />

      <ConsentModal
        isOpen={isConsentOpen}
        onAgree={handleConsentAgree}
      />

      <AboutDemoModal
        isOpen={isAboutDemoOpen}
        onClose={() => setIsAboutDemoOpen(false)}
      />

    </div>
  );
}

