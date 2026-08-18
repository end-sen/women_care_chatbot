import React, { useEffect, useState } from 'react';
import { X, BookOpen, ExternalLink, Calendar, ShieldCheck, Database, Info } from 'lucide-react';

export default function AboutDemoModal({ isOpen, onClose }) {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/metadata')
        .then((res) => res.json())
        .then((data) => setMetadata(data))
        .catch((err) => console.error('Failed to fetch metadata:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative text-slate-100 max-h-[85vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 font-bold shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-200">About AmaniCare AI Demo</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guidance Last Updated: <strong className="text-emerald-300">{metadata?.last_updated || 'August 2026'}</strong></span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          {/* Transparency Description */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-amber-400" />
              Knowledge Base Transparency
            </h4>
            <p>
              This AI assistant synthesizes answers exclusively from curated World Health Organization (WHO) maternal & reproductive health guidelines stored in an indexed vector database (ChromaDB + SentenceTransformers).
            </p>
          </div>

          {/* Source Documents List */}
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              WHO Source Documents Indexed ({metadata?.sources?.length || 5})
            </h4>

            <div className="space-y-2">
              {(metadata?.sources || [
                { title: "WHO Antenatal Care Guidelines", tag: "antenatal_care", url: "https://www.who.int/publications/i/item/9789241549912" },
                { title: "WHO Daily Nutrition & Supplementation in Pregnancy", tag: "nutrition", url: "https://www.who.int/publications/i/item/9789241549912" },
                { title: "WHO Pregnancy Danger Signs & Emergency Triage", tag: "danger_signs", url: "https://www.who.int/news-room/fact-sheets/detail/maternal-mortality" },
                { title: "WHO Family Planning & Contraceptive Methods", tag: "contraception", url: "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception" },
                { title: "WHO Reproductive Options & Clinical Guidance", tag: "options", url: "https://www.who.int/publications/i/item/9789240039483" }
              ]).map((src, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition">
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">{src.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">Tag: {src.tag}</div>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-slate-950 transition shrink-0"
                    title="View Official WHO Source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Privacy Notice */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs space-y-1">
            <div className="font-semibold text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Privacy & Safety Architecture
            </div>
            <p className="text-slate-300 text-[11px]">
              All queries run through a two-layer safety guardrail (Keyword + Groq LLM Classifier). Chat history is stored in-memory using an anonymous session UUID with zero identity tracking.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
