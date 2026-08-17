import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, Clock, Search, ShieldAlert, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function FacilityFinderModal({ isOpen, onClose, initialFilter = 'all' }) {
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    let url = '/api/facilities';
    const params = new URLSearchParams();
    if (filter !== 'all') params.append('type', filter);
    if (searchTerm) params.append('search', searchTerm);

    if (params.toString()) url += `?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setFacilities(data.facilities || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch facilities:', err);
        setLoading(false);
      });
  }, [isOpen, filter, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-[#131d33] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-emerald-500 text-slate-950">
              <MapPin className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-amber-300">
                Utopia Maternal Health & Family Planning Finder
              </h3>
              <p className="text-xs text-slate-400">Mock healthcare network & certified referral centers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Clinics' },
              { id: 'antenatal', label: 'Antenatal Care' },
              { id: 'family_planning', label: 'Family Planning' },
              { id: 'general', label: 'General & Emergency' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search clinic or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Facility Cards List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Loading facilities...</div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No facilities match your search.</div>
          ) : (
            facilities.map((fac) => (
              <div
                key={fac.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition shadow-md flex flex-col md:flex-row items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-amber-200 text-sm">{fac.name}</h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                      {fac.type_label}
                    </span>
                    {fac.emergency_services && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> 24/7 ER
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{fac.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> {fac.address} ({fac.distance})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {fac.hours}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <a
                    href={`tel:${fac.phone}`}
                    className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Clinic
                  </a>
                  <span className="text-[10px] text-slate-400 font-mono">{fac.phone}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-[11px] text-slate-400">
          Demo Facility Network • Connects with accredited community healthcare providers.
        </div>

      </div>
    </div>
  );
}
