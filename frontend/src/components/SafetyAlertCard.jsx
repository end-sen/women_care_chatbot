import React from 'react';
import { AlertTriangle, Heart, Phone, ShieldCheck, MapPin } from 'lucide-react';

export default function SafetyAlertCard({ type, supportCard, action, onOpenFacilities }) {
  if (type === 'danger_sign') {
    return (
      <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-red-950/90 via-red-900/60 to-slate-900 border-2 border-red-500/80 shadow-2xl animate-bounce-subtle">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500 text-slate-950 font-bold shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="text-red-300 font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
              Immediate Urgent Care Recommended
            </h4>
            <p className="text-xs text-red-100 mt-1 leading-relaxed">
              The symptoms matched critical medical danger thresholds. Please seek hands-on clinical assessment immediately.
            </p>
            {action && (
              <button
                onClick={() => onOpenFacilities(action.filter || 'antenatal')}
                className="mt-3 flex items-center gap-2 bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg shadow-lg transition"
              >
                <MapPin className="w-4 h-4" />
                {action.label || "Find Emergency Maternal Clinics Now"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'distress_coercion' && supportCard) {
    return (
      <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950 border border-purple-500/50 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-purple-300 font-bold text-sm">{supportCard.title || "Confidential Support Resources"}</h4>
            <div className="mt-2 space-y-1.5 text-xs text-purple-100">
              <div className="flex items-center gap-2 font-semibold text-amber-300 bg-purple-900/40 px-2.5 py-1 rounded-md border border-purple-500/30">
                <Phone className="w-3.5 h-3.5" />
                {supportCard.helpline}
              </div>
              <p className="text-slate-300 italic">{supportCard.guidance}</p>
            </div>
            {action && (
              <button
                onClick={() => onOpenFacilities(action.filter || 'general')}
                className="mt-3 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                {action.label || "Find Safe Confidential Clinics"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'self_admin_refusal') {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-slate-850 border border-amber-500/40 text-xs text-amber-200">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Clinical Safety Standards Enforced</p>
            <p className="text-slate-300 mt-0.5">Please consult a verified clinical team for reproductive options and safe healthcare procedures.</p>
            {action && (
              <button
                onClick={() => onOpenFacilities(action.filter || 'family_planning')}
                className="mt-2 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-lg transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                {action.label || "Find Family Planning Clinics"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
