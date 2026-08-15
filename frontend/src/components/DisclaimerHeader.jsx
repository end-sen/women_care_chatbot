import React from 'react';
import { ShieldAlert, MapPin, RefreshCw, HeartHandshake, Volume2, VolumeX } from 'lucide-react';

export default function DisclaimerHeader({ soundEnabled, onToggleSound, onOpenFacilities, onResetSession }) {
  return (
    <header className="w-full bg-[#0d131f] border-b border-amber-500/20 px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <HeartHandshake className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
                MaternityCare
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                Utopia Demo
              </span>
            </div>
            <p className="text-xs text-slate-400">African-Utopia Reproductive & Maternal Wellness Companion</p>
          </div>
        </div>

        {/* Center: Persistent Mandatory Medical Disclaimer */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs px-3.5 py-1.5 rounded-full shadow-inner text-center max-w-xl">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium">
            <strong className="text-amber-300">Notice:</strong> This is an AI demo and does not replace professional medical advice.
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Mute Voice Assistance" : "Enable Voice Assistance"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{soundEnabled ? "Voice On" : "Voice Off"}</span>
          </button>

          <button
            onClick={onOpenFacilities}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-semibold px-3.5 py-1.5 rounded-lg text-xs transition shadow-md hover:shadow-emerald-500/20"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Facility Finder</span>
          </button>
          
          <button
            onClick={onResetSession}
            title="Reset Chat Session"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
