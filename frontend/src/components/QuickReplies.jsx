import React from 'react';
import { Heart, Shield, Sparkles, HelpCircle, Calendar, Apple, Activity, Stethoscope, Pill, Compass, RotateCcw, MapPin } from 'lucide-react';

export default function QuickReplies({ branch, trimester, gestationalStage, healthStatus, activeTopic, onSelect, onOpenFacilities, theme = 'dark' }) {
  const isLight = theme === 'light';

  // Contextual topic-specific follow-up mapping
  const topicFollowups = {
    prevention: {
      title: "Explore Related Topics: Prevention & Contraception",
      items: [
        { label: "⚡ Emergency Contraception", query: "How does emergency contraception work and when should it be taken?", topicTag: "prevention" },
        { label: "🩺 LARC (IUDs & Implants)", query: "What are the benefits, effectiveness, and side effects of IUDs and Implants?", topicTag: "prevention" },
        { label: "💊 Hormonal & Barrier Methods", query: "Tell me about oral pills, injectables, and condoms for STI protection.", topicTag: "prevention" },
        { label: "🏥 Find Family Planning Clinics", isFacilityButton: true, facilityFilter: "family_planning" }
      ]
    },
    termination: {
      title: "Explore Related Topics: Overview of Termination Care",
      items: [
        { label: "📋 Clinical Standards & Safety", query: "What should I expect during a licensed clinical consultation and procedure?", topicTag: "termination" },
        { label: "🩺 Post-Care & Recovery", query: "What post-procedure symptoms are normal and what signs require follow-up?", topicTag: "termination" },
        { label: "💜 Confidential Counseling", query: "How can I connect with confidential counseling and emotional support?", topicTag: "termination" },
        { label: "🏥 Find Certified Clinics", isFacilityButton: true, facilityFilter: "family_planning" }
      ]
    },
    continuing_pregnancy: {
      title: "Explore Related Topics: Continuing Pregnancy Guidance",
      items: [
        { label: "📅 Antenatal Care Schedule", query: "What routine checkups, blood tests, and ultrasounds happen in each trimester?", topicTag: "continuing_pregnancy" },
        { label: "🥗 Maternal Nutrition & Diet", query: "What key vitamins, supplements, and foods are recommended during pregnancy?", topicTag: "nutrition" },
        { label: "🤝 Social Welfare Resources", query: "What social support and community welfare programs exist for mothers?", topicTag: "continuing_pregnancy" },
        { label: "🏥 Find Antenatal Clinics", isFacilityButton: true, facilityFilter: "antenatal" }
      ]
    },
    adoption: {
      title: "Explore Related Topics: Adoption & Care Placement",
      items: [
        { label: "⚖️ Legal Placement Process", query: "How does legal adoption or temporary foster care placement work?", topicTag: "adoption" },
        { label: "💜 Counseling & Social Support", query: "What legal assistance and non-judgmental counseling is provided for birth parents?", topicTag: "adoption" },
        { label: "🏥 Find Support Clinics", isFacilityButton: true, facilityFilter: "general" }
      ]
    },
    nutrition: {
      title: "Explore Related Topics: Maternal Nutrition & Diet",
      items: [
        { label: "💊 Folic Acid, Iron & Calcium", query: "What daily dosage of Folic Acid, Iron, and Calcium is recommended during pregnancy?", topicTag: "nutrition" },
        { label: "🚫 Foods & Drinks to Avoid", query: "What foods and beverages should be avoided during pregnancy?", topicTag: "nutrition" },
        { label: "🤢 Managing Nausea & Morning Sickness", query: "How can I manage nausea and morning sickness through diet?", topicTag: "nutrition" },
        { label: "🏥 Find Antenatal Clinics", isFacilityButton: true, facilityFilter: "antenatal" }
      ]
    },
    symptoms: {
      title: "Explore Related Topics: Pregnancy Symptoms & Health",
      items: [
        { label: "✨ Normal Trimester Symptoms", query: "What physical changes and mild symptoms are expected in this stage?", topicTag: "symptoms" },
        { label: "⚡ Relieving Cramping & Fatigue", query: "How can I safely relieve back pain, fatigue, and mild leg swelling?", topicTag: "symptoms" },
        { label: "⚠️ Warning Signs to Watch", query: "What warning symptoms require immediate emergency medical attention?", topicTag: "symptoms" },
        { label: "🏥 Find Emergency Clinics", isFacilityButton: true, facilityFilter: "antenatal" }
      ]
    },
    appointments: {
      title: "Explore Related Topics: Antenatal Care Visits",
      items: [
        { label: "📅 WHO 8 ANC Contacts", query: "What is the schedule and purpose of the 8 WHO antenatal contacts?", topicTag: "appointments" },
        { label: "🔬 Screening Tests & Ultrasounds", query: "What routine blood tests, urine checks, and scans are done?", topicTag: "appointments" },
        { label: "🏥 Find Nearest ANC Clinic", isFacilityButton: true, facilityFilter: "antenatal" }
      ]
    },
    wellbeing: {
      title: "Explore Related Topics: Mental Wellbeing",
      items: [
        { label: "🧘 Stress & Anxiety Relief", query: "What safe techniques help reduce anxiety and emotional stress during pregnancy?", topicTag: "wellbeing" },
        { label: "😴 Sleep & Rest Advice", query: "How can I improve sleep quality and rest comfortably during pregnancy?", topicTag: "wellbeing" },
        { label: "💜 Partner & Family Support", query: "How can partners and family support emotional wellness?", topicTag: "wellbeing" },
        { label: "🏥 Find Wellness Clinics", isFacilityButton: true, facilityFilter: "general" }
      ]
    }
  };

  // If an active topic context is detected, display contextual follow-ups!
  if (activeTopic && topicFollowups[activeTopic]) {
    const topicData = topicFollowups[activeTopic];
    return (
      <div
        className={`my-3 space-y-2 p-3.5 rounded-2xl border shadow-lg ${
          isLight
            ? 'bg-purple-50/90 border-purple-200 text-purple-950'
            : 'bg-slate-850/90 border-slate-700/80 text-slate-100'
        }`}
      >
        <p className="text-xs font-semibold text-purple-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {topicData.title}
          </span>
          <button
            onClick={() => onSelect({ type: 'reset_topic' })}
            className={`text-[11px] font-medium hover:underline flex items-center gap-1 transition ${
              isLight ? 'text-purple-700 hover:text-purple-900' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <RotateCcw className="w-3 h-3" /> Main Options
          </button>
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {topicData.items.map((opt, idx) => {
            if (opt.isFacilityButton) {
              return (
                <button
                  key={idx}
                  onClick={() => onOpenFacilities && onOpenFacilities(opt.facilityFilter)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition group ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-200'
                  }`}
                >
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => onSelect({ type: 'ask_question', query: opt.query, label: opt.label, topicTag: opt.topicTag })}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition group ${
                  isLight
                    ? 'bg-white hover:bg-purple-100/60 border-purple-200 text-purple-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 1. Initial State (Choose Main Branch)
  if (!branch || branch === 'initial') {
    return (
      <div className="flex flex-col gap-2 my-3">
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isLight ? 'text-purple-900' : 'text-amber-300/80'}`}>
          Select a Care Path to Begin:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={() => onSelect({ type: 'choose_branch', value: 'pregnancy_care', label: '🤰 Pregnancy Care' })}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition hover:scale-[1.01] shadow-md group ${
              isLight
                ? 'bg-gradient-to-r from-purple-100 to-indigo-50 border-purple-300 text-purple-950'
                : 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-100'
            }`}
          >
            <div className={`p-2.5 rounded-xl font-bold shrink-0 ${isLight ? 'bg-purple-600 text-white' : 'bg-amber-500 text-slate-950'}`}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${isLight ? 'text-purple-950' : 'text-amber-200'}`}>Pregnancy Care</div>
              <div className={`text-[11px] ${isLight ? 'text-purple-800' : 'text-slate-300'}`}>Trimester advice, nutrition, symptoms & wellness</div>
            </div>
          </button>

          <button
            onClick={() => onSelect({ type: 'choose_branch', value: 'whats_right_for_me', label: "⚖️ What's Right For Me" })}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition hover:scale-[1.01] shadow-md group ${
              isLight
                ? 'bg-gradient-to-r from-indigo-100 to-purple-50 border-indigo-300 text-indigo-950'
                : 'bg-gradient-to-r from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-100'
            }`}
          >
            <div className={`p-2.5 rounded-xl font-bold shrink-0 ${isLight ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-slate-950'}`}>
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className={`font-bold text-sm ${isLight ? 'text-indigo-950' : 'text-emerald-200'}`}>What's Right For Me</div>
              <div className={`text-[11px] ${isLight ? 'text-indigo-800' : 'text-slate-300'}`}>Neutral options, support & family planning</div>
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
          <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-purple-900' : 'text-amber-300'}`}>
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  isLight
                    ? 'bg-purple-100 hover:bg-purple-600 hover:text-white border-purple-300 text-purple-950'
                    : 'bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border-amber-500/30 text-amber-200'
                }`}
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
        <p className={`text-xs font-semibold flex items-center justify-between ${isLight ? 'text-purple-900' : 'text-slate-400'}`}>
          <span>Pregnancy Sub-Menu Topics:</span>
          <span className={`text-[11px] font-mono ${isLight ? 'text-purple-700 font-bold' : 'text-amber-400'}`}>Active: {trimester} Trimester</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'Health & Symptoms', icon: Activity, text: 'What symptoms are normal in this stage?', topicTag: 'symptoms' },
            { id: 'Nutrition', icon: Apple, text: 'What key vitamins & diet should I follow?', topicTag: 'nutrition' },
            { id: 'Appointments', icon: Calendar, text: 'When is my next routine ANC appointment?', topicTag: 'appointments' },
            { id: 'Mental Wellbeing', icon: Heart, text: 'How can I manage stress and anxiety?', topicTag: 'wellbeing' },
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelect({ type: 'ask_question', query: item.text, label: item.id, topicTag: item.topicTag })}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  isLight
                    ? 'bg-white hover:bg-purple-100/80 border-purple-200 text-purple-950 shadow-sm'
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <IconComponent className={`w-4 h-4 mb-1 ${isLight ? 'text-purple-600' : 'text-amber-400'}`} />
                <span className="text-xs font-semibold">{item.id}</span>
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
          <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-purple-900' : 'text-emerald-300'}`}>
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  isLight
                    ? 'bg-purple-100 hover:bg-purple-600 hover:text-white border-purple-300 text-purple-950'
                    : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 border-emerald-500/30 text-emerald-200'
                }`}
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
          <p className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-purple-900' : 'text-emerald-300'}`}>
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  isLight
                    ? 'bg-purple-100 hover:bg-purple-600 hover:text-white border-purple-300 text-purple-950'
                    : 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 border-emerald-500/30 text-emerald-200'
                }`}
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
        <p className={`text-xs font-semibold ${isLight ? 'text-purple-900' : 'text-slate-400'}`}>Neutral WHO Options & Reproductive Guidance:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            {
              label: 'Continuing Pregnancy Guidance',
              query: 'What routine care and social support is available for continuing a pregnancy?',
              topicTag: 'continuing_pregnancy'
            },
            {
              label: 'Adoption & Care Placement Options',
              query: 'What legal frameworks and social welfare options exist for adoption or care placement?',
              topicTag: 'adoption'
            },
            {
              label: 'Overview of Termination Care',
              query: 'What options exist for safe clinical termination care and licensed provider requirements?',
              topicTag: 'termination'
            },
            {
              label: 'Prevention & Contraception',
              query: 'What are the recommended family planning methods, emergency contraception, and efficacy rates?',
              topicTag: 'prevention'
            },
          ].map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSelect({ type: 'ask_question', query: opt.query, label: opt.label, topicTag: opt.topicTag })}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition group ${
                isLight
                  ? 'bg-white hover:bg-purple-100/80 border-purple-200 text-purple-950 shadow-sm'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <span className="text-xs font-semibold">{opt.label}</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
