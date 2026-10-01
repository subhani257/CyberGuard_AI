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
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * boundedScore) / 100;

  // Determine stroke gradient & badge styling based on score
  const isHigh = boundedScore >= 75;
  const isMid = boundedScore >= 50 && boundedScore < 75;

  const gradId = isHigh ? "evalGradHigh" : isMid ? "evalGradMid" : "evalGradLow";
  const startColor = isHigh ? "rgba(79, 124, 255, 0.7)" : isMid ? "rgba(245, 158, 11, 0.8)" : "rgba(239, 68, 68, 0.8)";
  const endColor = isHigh ? "rgba(165, 184, 255, 0.95)" : isMid ? "rgba(251, 191, 36, 1)" : "rgba(248, 113, 113, 1)";

  const badgeStyle = isHigh
    ? { background: 'rgba(79, 124, 255, 0.1)', border: '1px solid rgba(79, 124, 255, 0.22)', color: 'rgba(165, 184, 255, 0.9)' }
    : isMid
    ? { background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#FBBF24' }
    : { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#F87171' };

  return (
    <div 
      className="flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)'
      }}
    >
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
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
          {/* Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.0, ease: "easeOut" }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-2xl font-bold tracking-tight text-primary leading-none">
            {boundedScore}
          </span>
          <span className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>
            / 100
          </span>
        </div>
      </div>

      {/* Skill Level & Comparison Meta */}
      <div className="flex flex-col gap-1.5 min-w-[110px]">
        <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'rgba(141, 152, 165, 0.7)' }}>
          READINESS TIER
        </span>

        <span 
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold tracking-wider uppercase"
          style={badgeStyle}
        >
          {skillLevel}
        </span>

        {/* Historical Score Comparison Delta */}
        {historicalDelta && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono pt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            <span style={{ color: historicalDelta.isPositive ? '#34D399' : '#F87171' }}>
              {historicalDelta.isPositive ? '▲' : '▼'} {historicalDelta.formatted}
            </span>
            <span className="text-[10px] truncate" style={{ color: 'rgba(141, 152, 165, 0.5)' }}>vs previous</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallScoreGauge;
