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
  // Theme color styling
  const colorMap = {
    coral: {
      bar: 'linear-gradient(90deg, rgba(239, 68, 68, 0.6), rgba(248, 113, 113, 0.95))',
      text: '#F87171',
      badgeBg: 'rgba(239, 68, 68, 0.1)',
      badgeBorder: 'rgba(239, 68, 68, 0.25)'
    },
    amber: {
      bar: 'linear-gradient(90deg, rgba(245, 158, 11, 0.6), rgba(251, 191, 36, 0.95))',
      text: '#FBBF24',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeBorder: 'rgba(245, 158, 11, 0.25)'
    },
    teal: {
      bar: 'linear-gradient(90deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.95))',
      text: '#34D399',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      badgeBorder: 'rgba(16, 185, 129, 0.25)'
    },
    blue: {
      bar: 'linear-gradient(90deg, rgba(79, 124, 255, 0.6), rgba(165, 184, 255, 0.95))',
      text: 'rgba(165, 184, 255, 0.95)',
      badgeBg: 'rgba(79, 124, 255, 0.1)',
      badgeBorder: 'rgba(79, 124, 255, 0.25)'
    },
    cyan: {
      bar: 'linear-gradient(90deg, rgba(79, 124, 255, 0.6), rgba(165, 184, 255, 0.95))',
      text: 'rgba(165, 184, 255, 0.95)',
      badgeBg: 'rgba(79, 124, 255, 0.1)',
      badgeBorder: 'rgba(79, 124, 255, 0.25)'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;
  const boundedProgress = Math.max(0, Math.min(100, progressPercent));

  return (
    <div 
      className="p-4 sm:p-5 rounded-2xl flex flex-col justify-between transition-all duration-200"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(16px)'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.25)';
        e.currentTarget.style.background = 'rgba(17, 24, 33, 0.85)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.background = 'rgba(17, 24, 33, 0.75)';
      }}
    >
      {/* Top: Label and optional telemetry tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
          {label}
        </span>
        {badge && (
          <span 
            className="text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              color: 'rgba(141, 152, 165, 0.7)'
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Middle: Big Value + Interpretation */}
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-primary leading-none font-mono">
            {value}
          </span>
          {maxValue && (
            <span className="text-xs font-mono" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>
              {maxValue}
            </span>
          )}
        </div>

        <span 
          className="text-xs font-mono font-semibold truncate px-2 py-0.5 rounded"
          style={{
            background: scheme.badgeBg,
            border: `1px solid ${scheme.badgeBorder}`,
            color: scheme.text
          }}
        >
          {interpretation}
        </span>
      </div>

      {/* Small Progress Bar */}
      <div 
        className="w-full h-1.5 rounded-full overflow-hidden mb-3"
        style={{ background: 'rgba(255, 255, 255, 0.06)' }}
        role="progressbar"
        aria-valuenow={boundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: scheme.bar }}
          initial={{ width: 0 }}
          animate={{ width: `${boundedProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Bottom: Consequence or context */}
      {consequence ? (
        <p className="text-xs leading-relaxed truncate" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
          {consequence}
        </p>
      ) : (
        <div className="h-4" />
      )}
    </div>
  );
};

export default EvaluationMetricCard;
