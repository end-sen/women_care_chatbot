import React from 'react';
import { BookOpen } from 'lucide-react';

export default function SourceBadge({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-slate-400 font-medium flex items-center gap-1">
        <BookOpen className="w-3 h-3 text-amber-400" /> Grounded Source:
      </span>
      {sources.map((src, idx) => (
        <span
          key={idx}
          className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
        >
          {src.startsWith("Source:") ? src : `Source: ${src}`}
        </span>
      ))}
    </div>
  );
}
