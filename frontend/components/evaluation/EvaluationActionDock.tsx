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
    <div className="shrink-0 border-t border-[#1E293B] bg-[#080D12]/95 backdrop-blur-md px-6 md:px-8 py-3.5 z-20">
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Telemetry & Completion Status */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse shrink-0"></span>
          <span className="text-primary font-semibold">Evaluation complete</span>
          <span className="text-muted hidden sm:inline">·</span>
          <span className="text-muted hidden sm:inline">
            Readiness updated to <strong className="text-cyan font-bold">{readinessScore}%</strong>
          </span>
          {recommendedSituation && (
            <>
              <span className="text-muted hidden lg:inline">·</span>
              <span className="text-muted hidden lg:inline">
                Next: <span className="text-primary">{recommendedSituation}</span> ({formattedNextChannel})
              </span>
            </>
          )}
        </div>

        {/* Right: Actions (Secondary Dashboard, Outlined Retry, Primary Blue Next Challenge) */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Secondary: Return to Dashboard */}
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl bg-surface border border-[#1E293B] hover:border-primary/20 text-muted hover:text-primary text-xs font-mono transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>

          {/* Outlined: Retry Scenario */}
          <button
            onClick={onRetryScenario}
            disabled={isNavigating}
            aria-label="Retry current scenario challenge"
            className="px-4 py-2 rounded-xl bg-surface border border-[#1E293B] hover:border-cyan/40 text-primary hover:text-cyan text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan" />
            <span>RETRY SCENARIO</span>
          </button>

          {/* Primary Blue: Start Next Challenge */}
          <button
            onClick={onNextChallenge}
            disabled={isNavigating}
            aria-label={`Start next recommended challenge in ${formattedNextChannel}`}
            className="px-5 py-2 rounded-xl bg-blue hover:bg-blue/90 text-white text-xs font-mono font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(79,124,255,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            <span>START NEXT CHALLENGE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationActionDock;
