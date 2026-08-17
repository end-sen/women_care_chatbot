import React, { useEffect, useState } from 'react';
import { Menu, Bell, Sun, Moon, MapPin, HeartHandshake, Volume2, VolumeX, PhoneCall, Trash2, Home, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getAllAvailableVoices } from '../utils/voiceSynthesizer';

export default function DisclaimerHeader({
  theme = 'dark',
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
  onOpenAboutDemo
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
      className={`w-full px-4 py-2.5 sticky top-0 z-30 shadow-md transition-colors duration-300 border-b ${
        isLight
          ? 'bg-white/90 border-purple-100 text-purple-950 shadow-purple-900/5'
          : 'bg-[#0b0e14]/95 border-purple-500/20 text-slate-100 shadow-black/40'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Menu Icon & Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <button
              title="Menu"
              className={`p-2 rounded-xl transition ${
                isLight ? 'hover:bg-purple-100 text-purple-900' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <a
              href="index2.html"
              title="Go to Amina Landing Page"
              className="flex items-center gap-2.5 no-underline hover:opacity-90 transition"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
                  isLight
                    ? 'bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 text-white'
                    : 'bg-gradient-to-tr from-purple-500 via-indigo-600 to-emerald-500 text-slate-950'
                }`}
              >
                <HeartHandshake className="w-5 h-5 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-lg font-bold font-heading ${
                      isLight
                        ? 'text-purple-950'
                        : 'bg-gradient-to-r from-purple-300 via-purple-200 to-indigo-300 bg-clip-text text-transparent'
                    }`}
                  >
                    MaternityCare
                  </h1>
                </div>
                <div className={`flex items-center gap-2 text-[11px] ${isLight ? 'text-purple-700' : 'text-slate-400'}`}>
                  <span>Reproductive & Women's Health</span>
                </div>
              </div>
            </a>
          </div>


          {/* Bell Icon & Theme Toggle for Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition ${
                isLight ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-slate-800 text-amber-300 border-slate-700'
              }`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              className={`p-2 rounded-xl transition relative ${
                isLight ? 'hover:bg-purple-100 text-purple-900' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500"></span>
            </button>
          </div>
        </div>

        {/* Right: Actions & Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-sm ${
              isLight
                ? 'bg-purple-100 hover:bg-purple-200 text-purple-950 border-purple-300'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-purple-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span className="font-bold">{isLight ? "Dark Mode" : "Light Mode"}</span>
          </button>

          {/* Notification Bell (Desktop) */}
          <button
            title="Notifications"
            className={`hidden md:flex items-center justify-center p-2 rounded-xl border transition relative ${
              isLight
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500"></span>
          </button>

          {/* Speaking Language Selector */}
          <div className="relative flex items-center">
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
              isLight
                ? 'bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-300'
                : 'bg-slate-800/90 text-purple-200 border-purple-500/30 hover:border-purple-500/50'
            }`}>
              <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
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
                title="Select Speaking Language & Voice"
                className="bg-transparent border-none outline-none text-xs font-bold cursor-pointer pr-1 max-w-[170px] sm:max-w-[210px] truncate"
              >
                <optgroup label="🌍 African & Global Languages">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className={isLight ? 'bg-white text-purple-950' : 'bg-slate-900 text-slate-100'}
                    >
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </optgroup>

                {availableVoices.length > 0 && (
                  <optgroup label="🗣️ Installed Device Voices">
                    {availableVoices.map(v => (
                      <option
                        key={v.voiceURI}
                        value={`voiceuri:${v.voiceURI}`}
                        className={isLight ? 'bg-white text-purple-950' : 'bg-slate-900 text-slate-100'}
                      >
                        🎙️ {v.name} ({v.lang})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Counselor Call Hotline */}
          <button
            onClick={onOpenEscalation}
            title="Connect with a Confidential Counselor"
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-md shadow-purple-600/20"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Counselor Hotline</span>
          </button>

          {/* Sound Voice Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Mute Voice Assistance" : "Enable Voice Assistance"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
              soundEnabled
                ? isLight
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : isLight
                ? 'bg-slate-100 text-slate-500 border-slate-200'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-500" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{soundEnabled ? "Voice On" : "Voice Off"}</span>
          </button>

          {/* Facility Finder */}
          <button
            onClick={onOpenFacilities}
            className={`flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-xl text-xs transition shadow-md ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Facility Finder</span>
          </button>

          {/* Clear Session */}
          <button
            onClick={onResetSession}
            title="Clear my conversation history and reset session"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs transition border ${
              isLight
                ? 'bg-purple-50 hover:bg-red-50 text-purple-900 hover:text-red-700 border-purple-200 hover:border-red-300'
                : 'bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border-slate-700 hover:border-red-500/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

      </div>
    </header>
  );
}

