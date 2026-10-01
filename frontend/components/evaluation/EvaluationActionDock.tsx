"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react';

interface EvaluationActionDockProps {
  readinessScore: number;
  priorityChannel?: string;
  recommendedSituation?: string;
  onRetryScenario: () => void;
  onNextChallenge: () => void;
  isNavigating?: boolean;
}

export const EvaluationActionDock: React.FC<EvaluationActionDockProps> = ({
  readinessScore,
  priorityChannel = 'voice_phone',
  recommendedSituation,
  onRetryScenario,
  onNextChallenge,
  isNavigating = false
}) => {
  const formattedNextChannel = priorityChannel.replace(/[_-]+/g, ' ').toUpperCase();

  return (
    <div 
      className="shrink-0 px-3 sm:px-6 md:px-8 py-2 sm:py-3.5 z-20"
      style={{
        background: 'rgba(11, 15, 20, 0.92)',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(20px)'
      }}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
        {/* Left: Telemetry & Completion Status */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: '#34D399', boxShadow: '0 0 8px #34D399' }}></span>
          <span className="text-primary font-semibold">Evaluation complete</span>
          <span className="hidden sm:inline" style={{ color: 'rgba(141, 152, 165, 0.4)' }}>·</span>
          <span className="hidden sm:inline" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            Readiness updated to <strong className="font-bold" style={{ color: 'rgba(165, 184, 255, 0.95)' }}>{readinessScore}%</strong>
          </span>
          {recommendedSituation && (
            <>
              <span className="hidden lg:inline" style={{ color: 'rgba(141, 152, 165, 0.4)' }}>·</span>
              <span className="hidden lg:inline" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
                Next: <span className="text-primary font-medium">{recommendedSituation}</span> ({formattedNextChannel})
              </span>
            </>
          )}
        </div>

        {/* Right: Actions (Dashboard, Retry, Next Challenge) */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          {/* Secondary: Return to Dashboard */}
          <Link
            href="/dashboard"
            className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-mono transition-all duration-200 items-center gap-1.5 shrink-0"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(141, 152, 165, 0.75)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.25)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(141, 152, 165, 0.75)';
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>

          {/* Outlined: Retry Scenario */}
          <button
            onClick={onRetryScenario}
            disabled={isNavigating}
            aria-label="Retry current scenario challenge"
            className="px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200 flex flex-1 sm:flex-none items-center justify-center gap-1.5 disabled:opacity-50 min-w-0"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'rgba(141, 152, 165, 0.85)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.3)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(141, 152, 165, 0.85)';
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.85)' }} />
            <span className="sm:hidden">RETRY</span><span className="hidden sm:inline">RETRY SCENARIO</span>
          </button>

          {/* Primary Training Map Button: Start Next Challenge */}
          <button
            onClick={onNextChallenge}
            disabled={isNavigating}
            aria-label={`Start next recommended challenge in ${formattedNextChannel}`}
            className="px-3 sm:px-5 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all duration-200 flex flex-1 sm:flex-none items-center justify-center gap-2 disabled:opacity-50 min-w-0 group"
            style={{
              background: 'rgba(79, 124, 255, 0.14)',
              border: '1px solid rgba(79, 124, 255, 0.28)',
              color: 'rgba(165, 184, 255, 0.95)',
              boxShadow: '0 0 20px rgba(79, 124, 255, 0.12)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.24)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.45)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(79, 124, 255, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.14)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.28)';
              e.currentTarget.style.color = 'rgba(165, 184, 255, 0.95)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(79, 124, 255, 0.12)';
            }}
          >
            <span className="sm:hidden">NEXT CHALLENGE</span><span className="hidden sm:inline">START NEXT CHALLENGE</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'rgba(165, 184, 255, 0.95)' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationActionDock;
