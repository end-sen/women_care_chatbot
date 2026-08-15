import React from 'react';
import { Heart, Shield, Sparkles, HelpCircle, Calendar, Apple, Activity, Stethoscope, Pill, Compass } from 'lucide-react';

export default function QuickReplies({ branch, trimester, gestationalStage, healthStatus, onSelect }) {
  // 1. Initial State (Choose Main Branch)
  if (!branch || branch === 'initial') {
    return (
      <div className="flex flex-col gap-2 my-3">
        <p className="text-xs text-amber-300/80 font-semibold uppercase tracking-wider mb-1">
          Select a Care Path to Begin:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => onSelect({ type: 'choose_branch', value: 'pregnancy_care', label: '🤰 Pregnancy Care' })}
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/40 hover:border-amber-400 text-left transition hover:scale-[1.01] shadow-lg group"
          >
            <div className="p-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold group-hover:bg-amber-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-amber-200 text-sm">Pregnancy Care</div>
              <div className="text-[11px] text-slate-300">Trimester advice, nutrition, symptoms & wellness</div>
            </div>
          </button>

          <button
            onClick={() => onSelect({ type: 'choose_branch', value: 'whats_right_for_me', label: "⚖️ What's Right For Me" })}
            className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-600/10 border border-emerald-500/40 hover:border-emerald-400 text-left transition hover:scale-[1.01] shadow-lg group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold group-hover:bg-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-200 text-sm">What's Right For Me</div>
              <div className="text-[11px] text-slate-300">Neutral options, support & family planning</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 2. Branch 1: Pregnancy Care Workflow
  if (branch === 'pregnancy_care') {
    // If trimester not yet selected:
    if (!trimester || trimester === 'unspecified') {
      return (
        <div className="my-3 space-y-2">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            Please select your current Trimester:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: '1st', label: '1st Trimester (Wks 1-12)' },
              { id: '2nd', label: '2nd Trimester (Wks 13-27)' },
              { id: '3rd', label: '3rd Trimester (Wks 28-40+)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect({ type: 'set_trimester', value: t.id, label: `Trimester: ${t.label}` })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 text-amber-200 text-xs font-semibold transition"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Sub-menu options for Pregnancy Care:
    return (
      <div className="my-3 space-y-2">
        <p className="text-xs font-semibold text-slate-400 flex items-center justify-between">
          <span>Pregnancy Sub-Menu Topics:</span>
          <span className="text-amber-400 text-[11px] font-mono">Active: {trimester} Trimester</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'Health & Symptoms', icon: Activity, text: 'What symptoms are normal in this stage?' },
            { id: 'Nutrition', icon: Apple, text: 'What key vitamins & diet should I follow?' },
            { id: 'Appointments', icon: Calendar, text: 'When is my next routine ANC appointment?' },
            { id: 'Mental Wellbeing', icon: Heart, text: 'How can I manage stress and anxiety?' },
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelect({ type: 'ask_question', query: item.text, label: item.id })}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-center transition"
              >
                <IconComponent className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">{item.id}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Branch 2: What's Right For Me Workflow
  if (branch === 'whats_right_for_me') {
    // Step A: Collect Gestational Stage
    if (!gestationalStage) {
      return (
        <div className="my-3 space-y-2">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            Step 1 of 2: Select approximate gestational stage
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'early', label: 'Early (< 12 Weeks)' },
              { id: 'mid', label: 'Mid (12 - 24 Weeks)' },
              { id: 'unsure', label: 'Unsure / Not Confirmed' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => onSelect({ type: 'set_gestational', value: g.id, label: g.label })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-200 text-xs font-semibold transition"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Step B: Collect General Health Status
    if (!healthStatus) {
      return (
        <div className="my-3 space-y-2">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            Step 2 of 2: General health status
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'good', label: 'General Good Health' },
              { id: 'discomfort', label: 'Experiencing Discomfort' },
              { id: 'chronic', label: 'Existing Medical Condition' },
            ].map((h) => (
              <button
                key={h.id}
                onClick={() => onSelect({ type: 'set_health_status', value: h.id, label: h.label })}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-200 text-xs font-semibold transition"
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Step C: Neutral Option Buttons & Contraception
    return (
      <div className="my-3 space-y-2">
        <p className="text-xs font-semibold text-slate-400">Neutral WHO Options & Reproductive Guidance:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              label: 'Continuing Pregnancy Guidance',
              query: 'What routine WHO care and social support is available for continuing a pregnancy?'
            },
            {
              label: 'Adoption & Care Placement Options',
              query: 'What legal frameworks and social welfare options exist for adoption or care placement?'
            },
            {
              label: 'Overview of Termination Care',
              query: 'What does the WHO state regarding safe clinical termination procedures and licensed provider requirements?'
            },
            {
              label: 'Prevention & Contraception',
              query: 'What are the recommended WHO family planning methods, emergency contraception, and efficacy rates?'
            },
          ].map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSelect({ type: 'ask_question', query: opt.query, label: opt.label })}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-left transition"
            >
              <span className="text-xs font-semibold text-emerald-200">{opt.label}</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
