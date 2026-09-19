"use client";
import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import OverallScoreGauge from './OverallScoreGauge';
import type { VerdictResult, SkillLevel } from './types';

interface EvaluationHeaderProps {
  verdictResult: VerdictResult;
  score: number;
  skillLevel: SkillLevel;
  historicalDelta?: { delta: number; isPositive: boolean; formatted: string } | null;
}

export const EvaluationHeader: React.FC<EvaluationHeaderProps> = ({
  verdictResult,
  score,
  skillLevel,
  historicalDelta
}) => {
  const { verdict, badgeLabel, headline, summary } = verdictResult;

  // Icon and badge styling based on authoritative verdict
  let BadgeIcon = ShieldCheck;
  let badgeStyle = {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34D399'
  };

  if (verdict === 'COMPROMISED') {
    BadgeIcon = AlertTriangle;
    badgeStyle = {
      background: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      color: '#F87171'
    };
  } else if (verdict === 'PARTIALLY_SECURE') {
    BadgeIcon = ShieldAlert;
    badgeStyle = {
      background: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      color: '#FBBF24'
    };
  }

  return (
    <div 
      className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6"
      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
    >
      {/* Left: Eyebrow, Dynamic Title, Verdict Badge & Summary */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Eyebrow + Semantic Verdict Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span 
            className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase px-2.5 py-1 rounded-md flex items-center gap-1.5"
            style={{
              background: 'rgba(79, 124, 255, 0.08)',
              border: '1px solid rgba(79, 124, 255, 0.18)',
              color: 'rgba(165, 184, 255, 0.9)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(79, 124, 255, 0.9)' }}></span>
            DECISION DEBRIEF
          </span>

          <span className="h-3.5 w-px bg-white/10 hidden sm:inline-block"></span>

          <span 
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase"
            style={badgeStyle}
          >
            <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{badgeLabel}</span>
          </span>
        </div>

        {/* Dynamic Action Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-primary leading-tight">
          {headline}
        </h1>

        {/* Direct Summary Sentence Connecting Reasoning to Behavior */}
        <p className="text-sm sm:text-base max-w-2xl leading-relaxed" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
          {summary}
        </p>
      </div>

      {/* Right: Overall Score Gauge with Tier & Comparison */}
      <div className="shrink-0 self-stretch lg:self-center">
        <OverallScoreGauge
          score={score}
          skillLevel={skillLevel}
          historicalDelta={historicalDelta}
        />
      </div>
    </div>
  );
};

export default EvaluationHeader;
