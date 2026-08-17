import React, { useState } from 'react';
import { PhoneCall, MessageCircle, X, ShieldCheck, Heart, UserCheck, Loader2 } from 'lucide-react';

export default function EscalationModal({ isOpen, onClose }) {
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleSimulateConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      alert("Demo Call Connect: Simulated connection to National Maternal Wellness Line (0800-112-233).");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-5 relative text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Heart className="w-6 h-6 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-200">Talk to Someone Now</h3>
            <p className="text-xs text-slate-400">24/7 Confidential & Respectful Care Support</p>
          </div>
        </div>

        {/* Informational Box */}
        <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% Confidential & Toll-Free</span>
          </div>
          <p>
            You can speak directly with a licensed maternal health counselor. Your privacy is fully protected, and all support is free of judgment.
          </p>
        </div>

        {/* Action Options */}
        <div className="space-y-3 pt-1">
          {/* Phone Hotline Option */}
          <button
            onClick={handleSimulateConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20 group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <PhoneCall className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider font-semibold opacity-80">24/7 Toll-Free Hotline</div>
                <div className="text-sm font-extrabold">Call 0800-112-233</div>
              </div>
            </div>
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-950/20 text-slate-950 font-semibold group-hover:bg-slate-950/30">
                Call Now
              </span>
            )}
          </button>

          {/* WhatsApp / Chat Option */}
          <a
            href="https://wa.me/?text=Hello%2C%20I%20would%20like%20confidential%20maternal%20health%20support."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-emerald-500/40 hover:border-emerald-400 text-slate-100 font-semibold transition shadow-md group"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <div className="text-xs text-slate-400">Direct Confidential Chat</div>
                <div className="text-sm font-bold text-emerald-200">Chat via WhatsApp</div>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Open Chat
            </span>
          </a>
        </div>

        {/* Simulation / Status Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Counselors Online Now
          </span>
          <span>Average wait: &lt; 1 min</span>
        </div>

      </div>
    </div>
  );
}
