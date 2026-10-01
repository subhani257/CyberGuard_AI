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
    <div 
      className="rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full space-y-4 relative overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(79, 124, 255, 0.08) 0%, rgba(17, 24, 33, 0.85) 100%)',
        border: '1px solid rgba(79, 124, 255, 0.22)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Subtle top glow line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(79, 124, 255, 0.45), transparent)' }} 
      />

      {/* Header */}
      <div 
        className="flex items-center justify-between gap-3 pb-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2" style={{ color: 'rgba(165, 184, 255, 0.95)' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.95)' }} />
            COACH TAKEAWAY
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            Key defensive principle to apply in future situations
          </p>
        </div>

        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase shrink-0"
          style={{
            background: 'rgba(79, 124, 255, 0.1)',
            border: '1px solid rgba(79, 124, 255, 0.22)',
            color: 'rgba(165, 184, 255, 0.9)'
          }}
        >
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
      <div className="pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center justify-between gap-2 text-[10px] font-mono" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
          <span className="uppercase tracking-wider">
            SOURCE: {sourceLabels[source] || 'SECURITY COACH'}
          </span>

          {fullAnalysis && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 transition-colors uppercase font-bold focus:outline-none"
              style={{ color: 'rgba(165, 184, 255, 0.9)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(165, 184, 255, 0.9)'}
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
            className="p-3.5 rounded-xl text-xs leading-relaxed font-sans"
            style={{
              background: 'rgba(11, 15, 20, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'rgba(141, 152, 165, 0.9)'
            }}
          >
            {fullAnalysis}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachTakeaway;
