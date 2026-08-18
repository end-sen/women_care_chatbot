import React, { useEffect, useState } from 'react';
import { Menu, Bell, Sun, Moon, MapPin, Heart, Volume2, VolumeX, PhoneCall, Trash2, Home, User, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getAllAvailableVoices } from '../utils/voiceSynthesizer';

export default function DisclaimerHeader({
  theme = 'light',
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  speechLanguage = 'en-US',
  onChangeSpeechLanguage,
  speechVoiceURI = '',
  onChangeSpeechVoiceURI,
  onOpenFacilities,
  onResetSession,
  onOpenEscalation,
  onOpenAboutDemo,
  activeNavTab = 'home',
  setActiveNavTab
}) {
  const isLight = theme === 'light';
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    const updateVoices = () => {
      const v = getAllAvailableVoices();
      setAvailableVoices(v);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  return (
    <header
      className={`w-full px-4 sm:px-6 py-3 sticky top-0 z-30 transition-colors duration-300 border-b ${
        isLight
          ? 'bg-white/95 border-purple-100/80 text-purple-950 shadow-sm'
          : 'bg-[#0f141c]/95 border-purple-500/20 text-slate-100 shadow-black/40'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Branding */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <a
            href="index2.html"
            title="Go to AmaniCare Landing Page"
            className="flex items-center gap-3 no-underline hover:opacity-90 transition"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
              <img
                src="/logo.png"
                alt="AmaniCare Logo"
                className="w-8 h-8 object-contain rounded-full"
              />
            </div>
            <div>
              <h1
                className={`text-lg font-extrabold font-heading tracking-tight leading-tight ${
                  isLight
                    ? 'text-purple-950'
                    : 'bg-gradient-to-r from-purple-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent'
                }`}
              >
                AmaniCare
              </h1>
              <div className={`text-[9px] font-extrabold tracking-widest uppercase ${isLight ? 'text-purple-400' : 'text-purple-400/80'}`}>
                MATERNAL CARE ASSISTANT
              </div>
            </div>
          </a>

          {/* Mobile Theme Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition ${
                isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-800 text-amber-300 border-slate-700'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center: Navigation Pill (Matches Screenshot 1:1) */}
        <div className={`flex items-center gap-1 p-1 rounded-full border shadow-inner ${
          isLight ? 'bg-[#f3edfa] border-purple-100 text-purple-900' : 'bg-slate-900/90 border-purple-500/30 text-slate-200'
        }`}>
          <button
            onClick={() => setActiveNavTab && setActiveNavTab('home')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-xs ${
              activeNavTab === 'home'
                ? isLight
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-200/50'
                  : 'bg-purple-600 text-white'
                : 'hover:text-purple-950 opacity-80 hover:opacity-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveNavTab && setActiveNavTab('my_care')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeNavTab === 'my_care'
                ? isLight
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-200/50 font-bold'
                  : 'bg-purple-600 text-white font-bold'
                : 'hover:text-purple-950 opacity-80 hover:opacity-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>My Care</span>
          </button>

          <button
            onClick={() => {
              if (setActiveNavTab) setActiveNavTab('profile');
              if (onOpenAboutDemo) onOpenAboutDemo();
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              activeNavTab === 'profile'
                ? isLight
                  ? 'bg-white text-purple-950 shadow-sm border border-purple-200/50 font-bold'
                  : 'bg-purple-600 text-white font-bold'
                : 'hover:text-purple-950 opacity-80 hover:opacity-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>

        {/* Right: Actions & Language Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Speaking Language Selector */}
          <div className="relative flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-xs ${
              isLight
                ? 'bg-[#f3edfa] text-purple-950 border-purple-100 hover:border-purple-300'
                : 'bg-slate-900 text-purple-200 border-purple-500/30'
            }`}>
              <Globe className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <select
                value={speechVoiceURI ? `voiceuri:${speechVoiceURI}` : speechLanguage}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('voiceuri:')) {
                    const uri = val.replace('voiceuri:', '');
                    const matched = availableVoices.find(v => v.voiceURI === uri);
                    if (matched) {
                      if (onChangeSpeechLanguage) onChangeSpeechLanguage(matched.lang);
                      if (onChangeSpeechVoiceURI) onChangeSpeechVoiceURI(uri);
                    }
                  } else {
                    if (onChangeSpeechLanguage) onChangeSpeechLanguage(val);
                  }
                }}
                title="Select Language"
                className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer pr-1 max-w-[120px] truncate text-purple-950"
              >
                <optgroup label="🌍 Languages">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className={isLight ? 'bg-white text-purple-950' : 'bg-slate-900 text-slate-100'}
                    >
                      {lang.flag} {lang.code.split('-')[0].toUpperCase()}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
            className={`p-2 rounded-full text-xs font-semibold transition border shadow-xs ${
              isLight
                ? 'bg-[#f3edfa] hover:bg-purple-100 text-purple-900 border-purple-100'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-purple-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Notification Bell */}
          <button
            title="Notifications"
            className={`p-2 rounded-full border transition relative ${
              isLight
                ? 'bg-[#f3edfa] hover:bg-purple-100 text-purple-900 border-purple-100'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500"></span>
          </button>

          {/* Counselor Call Hotline */}
          <button
            onClick={onOpenEscalation}
            title="Counselor Hotline"
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3 py-1.5 rounded-full text-xs transition shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Hotline</span>
          </button>

          {/* Clear Session */}
          <button
            onClick={onResetSession}
            title="Reset Session"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition border ${
              isLight
                ? 'bg-purple-50 hover:bg-red-50 text-purple-900 hover:text-red-700 border-purple-200'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

      </div>
    </header>
  );
}
