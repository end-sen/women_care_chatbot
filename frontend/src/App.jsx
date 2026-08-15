import React, { useState, useEffect } from 'react';
import DisclaimerHeader from './components/DisclaimerHeader';
import AvatarCanvas from './components/AvatarCanvas';
import ChatContainer from './components/ChatContainer';
import FacilityFinderModal from './components/FacilityFinderModal';

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Jambo & Welcome to MaternityCare! I am your AI maternal health companion set in our utopian community network. All guidance provided is strictly grounded in WHO medical guidelines.\n\nPlease select one of the two options below to begin:",
      sources: ["WHO - Reproductive & Maternal Health"],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [branch, setBranch] = useState('initial'); // 'initial', 'pregnancy_care', 'whats_right_for_me'
  const [trimester, setTrimester] = useState('unspecified'); // 'unspecified', '1st', '2nd', '3rd'
  const [gestationalStage, setGestationalStage] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityModalFilter, setFacilityModalFilter] = useState('all');

  // Load browser voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speakText = (text) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();

    // Clean text of markdown and emoji symbols for smooth speech
    const cleanText = text
      .replace(/[\*\_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/⚠️|🛡️|💜|🚨|🏥|📍/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('zira')) && v.lang.startsWith('en'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onstart = () => setIsAvatarSpeaking(true);
    utterance.onend = () => setIsAvatarSpeaking(false);
    utterance.onerror = () => setIsAvatarSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleOpenFacilities = (filterType = 'all') => {
    setFacilityModalFilter(filterType);
    setIsFacilityModalOpen(true);
  };

  const handleResetSession = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAvatarSpeaking(false);
    setBranch('initial');
    setTrimester('unspecified');
    setGestationalStage(null);
    setHealthStatus(null);
    const welcomeMsg = "Session reset. Jambo & Welcome back to MaternityCare! Please choose a care path below to begin:";
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

  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Append user message
    const updatedMessages = [
      ...messages,
      { sender: 'user', text: userText, time: timeStr }
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
          history: historyPayload
        })
      });

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

      // Speak bot response out loud using Web Speech API TTS
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
      if (item.value === 'pregnancy_care') {
        handleSendMessage("I want to explore Pregnancy Care.");
      } else {
        handleSendMessage("I want to explore What's Right For Me.");
      }
    } else if (item.type === 'set_trimester') {
      setTrimester(item.value);
      handleSendMessage(`I am in my ${item.value} trimester.`);
    } else if (item.type === 'set_gestational') {
      setGestationalStage(item.value);
      handleSendMessage(`Gestational Stage: ${item.label}`);
    } else if (item.type === 'set_health_status') {
      setHealthStatus(item.value);
      handleSendMessage(`General Health Status: ${item.label}`);
    } else if (item.type === 'ask_question') {
      handleSendMessage(item.query);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f14] text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. Header with Persistent Medical Disclaimer & Voice Toggle */}
      <DisclaimerHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const nextState = !soundEnabled;
          setSoundEnabled(nextState);
          if (!nextState && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsAvatarSpeaking(false);
          }
        }}
        onOpenFacilities={() => handleOpenFacilities('all')}
        onResetSession={handleResetSession}
      />

      {/* 2. Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-65px)]">
        
        {/* Left Column: 3D Interactive Talking Avatar (4 Cols) */}
        <div className="lg:col-span-4 h-[280px] lg:h-full flex flex-col">
          <AvatarCanvas isSpeaking={isAvatarSpeaking || isTyping} />
        </div>

        {/* Right Column: Main Chat & Guided Flow (8 Cols) */}
        <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
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
            onQuickReplySelect={handleQuickReplySelect}
            onOpenFacilities={handleOpenFacilities}
          />
        </div>

      </main>

      {/* 3. Mock Facility Finder Modal */}
      <FacilityFinderModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        initialFilter={facilityModalFilter}
      />

    </div>
  );
}
