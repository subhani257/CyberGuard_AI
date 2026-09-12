"use client";
import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import type { CoachTakeawayData } from './types';

interface CoachTakeawayProps {
  data: CoachTakeawayData;
}

export const CoachTakeaway: React.FC<CoachTakeawayProps> = ({ data }) => {
  const { lesson, practiceFocus, source, fullAnalysis } = data;
  const [isExpanded, setIsExpanded] = useState(false);

  const sourceLabels = {
    COACH_AGENT: 'ADAPTIVE COACH AGENT',
    EVALUATION_AGENT: 'EVALUATION ENGINE',
    GENERAL_GUIDANCE: 'GENERAL DEFENSE GUIDANCE'
  };

  return (
    <div className="bg-[#111A24] border border-amber/30 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full space-y-4 relative overflow-hidden">
      {/* Subtle top amber highlight accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber/80 via-amber/40 to-transparent"></div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1E293B]/70">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-amber flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber shrink-0" />
            COACH TAKEAWAY
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Key defensive principle to apply in future situations
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber/10 border border-amber/25 text-amber text-[10px] font-mono font-bold uppercase shrink-0">
          <Compass className="w-3 h-3" />
          <span>{practiceFocus}</span>
        </div>
      </div>

      {/* Actionable Lesson */}
      <div className="space-y-2 flex-1">
        <p className="text-sm font-medium text-primary leading-relaxed">
          {lesson}
        </p>
      </div>

      {/* Footer Meta & Expandable Full Analysis */}
      <div className="pt-3 border-t border-[#1E293B]/60 space-y-3">
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-muted">
          <span className="uppercase tracking-wider">
            SOURCE: {sourceLabels[source] || 'SECURITY COACH'}
          </span>

          {fullAnalysis && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-cyan hover:text-cyan/80 transition-colors uppercase font-bold focus:outline-none"
              aria-expanded={isExpanded}
              aria-controls="coach-full-analysis"
            >
              <span>{isExpanded ? 'Hide Analysis' : 'View full analysis'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Expandable Analysis Content */}
        {isExpanded && fullAnalysis && (
          <div 
            id="coach-full-analysis"
            className="p-3.5 rounded-xl bg-surface/70 border border-[#1E293B] text-xs text-muted leading-relaxed font-sans"
          >
            {fullAnalysis}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachTakeaway;
