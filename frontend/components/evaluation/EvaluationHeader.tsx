"use client";
import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
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
  const { verdict, badgeLabel, headline, summary, badgeColor } = verdictResult;

  // Icon and badge styling based on authoritative verdict
  let BadgeIcon = ShieldCheck;
  let badgeClasses = 'bg-teal/10 border-teal/30 text-teal';

  if (verdict === 'COMPROMISED') {
    BadgeIcon = AlertTriangle;
    badgeClasses = 'bg-coral/15 border-coral/35 text-coral shadow-[0_0_15px_rgba(255,90,96,0.15)]';
  } else if (verdict === 'PARTIALLY_SECURE') {
    BadgeIcon = ShieldAlert;
    badgeClasses = 'bg-amber/15 border-amber/35 text-amber';
  }

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2 border-b border-[#1E293B]/60">
      {/* Left: Eyebrow, Dynamic Title, Verdict Badge & Summary */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Eyebrow + Semantic Verdict Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></span>
            DECISION DEBRIEF
          </span>

          <span className="h-3.5 w-px bg-[#1E293B] hidden sm:inline-block"></span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border tracking-wider uppercase ${badgeClasses}`}>
            <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{badgeLabel}</span>
          </span>
        </div>

        {/* Dynamic Action Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-primary leading-tight">
          {headline}
        </h1>

        {/* Direct Summary Sentence Connecting Reasoning to Behavior */}
        <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
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
