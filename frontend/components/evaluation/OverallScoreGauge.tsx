"use client";
import React from 'react';
import { motion } from 'framer-motion';
import type { SkillLevel } from './types';

interface OverallScoreGaugeProps {
  score: number;
  skillLevel: SkillLevel;
  historicalDelta?: { delta: number; isPositive: boolean; formatted: string } | null;
}

export const OverallScoreGauge: React.FC<OverallScoreGaugeProps> = ({
  score,
  skillLevel,
  historicalDelta
}) => {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const radius = 42;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * boundedScore) / 100;

  // Determine stroke & badge colors based on skill tier
  let strokeColor = '#45D9E8'; // Cyan
  let badgeStyle = 'bg-cyan/10 border-cyan/30 text-cyan';
  if (boundedScore >= 85) {
    strokeColor = '#2DD4BF'; // Teal
    badgeStyle = 'bg-teal/10 border-teal/30 text-teal';
  } else if (boundedScore >= 70) {
    strokeColor = '#45D9E8'; // Cyan
    badgeStyle = 'bg-cyan/10 border-cyan/30 text-cyan';
  } else if (boundedScore >= 50) {
    strokeColor = '#D6A84B'; // Amber
    badgeStyle = 'bg-amber/10 border-amber/30 text-amber';
  } else {
    strokeColor = '#FF5A60'; // Coral
    badgeStyle = 'bg-coral/10 border-coral/30 text-coral';
  }

  return (
    <div className="flex items-center gap-4 bg-[#111A24]/90 border border-[#1E293B] rounded-2xl p-4 shadow-sm">
      {/* Circular Gauge */}
      <div 
        className="relative w-24 h-24 shrink-0 flex items-center justify-center"
        role="meter"
        aria-valuenow={boundedScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Overall Security Score: ${boundedScore} out of 100, evaluated as ${skillLevel}`}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1E293B"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-2xl font-bold font-mono tracking-tight text-primary leading-none">
            {boundedScore}
          </span>
          <span className="text-[10px] font-mono text-muted uppercase mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Skill Level & Comparison Meta */}
      <div className="flex flex-col gap-1.5 min-w-[110px]">
        <span className="text-[10px] font-mono tracking-wider uppercase text-muted">
          READINESS TIER
        </span>

        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border tracking-wider uppercase ${badgeStyle}`}>
          {skillLevel}
        </span>

        {/* Historical Score Comparison Delta — cleanly omitted when null */}
        {historicalDelta && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted pt-0.5">
            <span className={historicalDelta.isPositive ? 'text-teal' : 'text-coral'}>
              {historicalDelta.isPositive ? '▲' : '▼'} {historicalDelta.formatted}
            </span>
            <span className="text-[10px] text-muted/70 truncate">vs previous</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallScoreGauge;
