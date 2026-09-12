"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface EvaluationMetricCardProps {
  label: string;
  value: number | string;
  maxValue?: string;
  interpretation: string;
  consequence?: string;
  color: 'coral' | 'amber' | 'teal' | 'blue' | 'cyan';
  progressPercent: number;
  badge?: string;
}

export const EvaluationMetricCard: React.FC<EvaluationMetricCardProps> = ({
  label,
  value,
  maxValue = '/100',
  interpretation,
  consequence,
  color,
  progressPercent,
  badge
}) => {
  // Theme styling based on semantic color
  const colorMap = {
    coral: {
      bar: 'bg-coral',
      barTrack: 'bg-coral/15',
      text: 'text-coral',
      border: 'border-coral/25',
      bg: 'bg-coral/5'
    },
    amber: {
      bar: 'bg-amber',
      barTrack: 'bg-amber/15',
      text: 'text-amber',
      border: 'border-amber/25',
      bg: 'bg-amber/5'
    },
    teal: {
      bar: 'bg-teal',
      barTrack: 'bg-teal/15',
      text: 'text-teal',
      border: 'border-teal/25',
      bg: 'bg-teal/5'
    },
    blue: {
      bar: 'bg-blue',
      barTrack: 'bg-blue/15',
      text: 'text-blue',
      border: 'border-blue/25',
      bg: 'bg-blue/5'
    },
    cyan: {
      bar: 'bg-cyan',
      barTrack: 'bg-cyan/15',
      text: 'text-cyan',
      border: 'border-cyan/25',
      bg: 'bg-cyan/5'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;
  const boundedProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-[#111A24] border border-[#1E293B] flex flex-col justify-between transition-colors shadow-sm`}>
      {/* Top: Label and optional telemetry tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted">
          {label}
        </span>
        {badge && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface border border-[#1E293B] text-muted">
            {badge}
          </span>
        )}
      </div>

      {/* Middle: Big Value + Interpretation */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl sm:text-4xl font-mono font-bold tracking-tight text-primary leading-none`}>
            {value}
          </span>
          {maxValue && (
            <span className="text-xs font-mono text-muted">
              {maxValue}
            </span>
          )}
        </div>

        <span className={`text-xs font-mono font-semibold truncate ${scheme.text}`}>
          {interpretation}
        </span>
      </div>

      {/* Small Progress Bar */}
      <div 
        className={`w-full h-1.5 rounded-full overflow-hidden ${scheme.barTrack} mb-3`}
        role="progressbar"
        aria-valuenow={boundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
      >
        <motion.div
          className={`h-full rounded-full ${scheme.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${boundedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Bottom: Consequence or context */}
      {consequence ? (
        <p className="text-xs text-muted leading-relaxed truncate">
          {consequence}
        </p>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
};

export default EvaluationMetricCard;
