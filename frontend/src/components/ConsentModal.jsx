import React from 'react';
import { ShieldCheck, HeartHandshake, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function ConsentModal({ isOpen, onAgree }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 relative">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <HeartHandshake className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-200">Terms & Conditions & Consent</h2>
            <p className="text-xs text-slate-400">Please review and accept the terms & privacy policy to continue</p>
          </div>
        </div>

        {/* Content Statements */}
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <FileText className="w-4 h-4 shrink-0" />
              <span>1. Educational Demo & Non-Medical Notice</span>
            </div>
            <p className="text-xs text-slate-300">
              This system is an AI demonstration tool set in a utopian community framework. Guidance provided is strictly grounded in public World Health Organization (WHO) medical guidelines, but does <strong>NOT replace professional medical diagnosis, treatment, or clinical care</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300">
              <Lock className="w-4 h-4 shrink-0" />
              <span>2. Privacy & Anonymous Session Data</span>
            </div>
            <p className="text-xs text-slate-300">
              Your privacy is fully protected. <strong>No names, emails, phone numbers, or personal identifying data are ever requested or stored</strong>. Every session uses a randomly generated anonymous identifier (UUID) saved only in your browser session.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-slate-200">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3. Emergency Triage Protocols</span>
            </div>
            <p className="text-xs text-slate-300">
              If you experience severe pregnancy symptoms (bleeding, severe pain, reduced fetal movement, high fever), the assistant will immediately direct you to emergency obstetric care resources.
            </p>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={onAgree}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 group"
          >
            <CheckCircle2 className="w-5 h-5 text-slate-950" />
            <span>I understand and agree to continue</span>
          </button>
        </div>

      </div>
    </div>
  );
}
