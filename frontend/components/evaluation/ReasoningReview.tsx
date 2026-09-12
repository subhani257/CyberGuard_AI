"use client";
import React from 'react';
import { MessageSquareQuote, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ReasoningReviewData } from './types';

interface ReasoningReviewProps {
  data: ReasoningReviewData;
}

export const ReasoningReview: React.FC<ReasoningReviewProps> = ({ data }) => {
  const {
    userReasoning,
    classificationLabel,
    confidence,
    strengths,
    weaknesses,
    explanation
  } = data;

  const hasConfidence = typeof confidence === 'number' && !isNaN(confidence);

  return (
    <div className="bg-[#111A24] border border-[#1E293B] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full space-y-4">
      {/* Header with Classification Label */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1E293B]/70">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan"></span>
            REASONING REVIEW
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Evaluation of your decision rationale and threat awareness
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono font-semibold">
            {classificationLabel}
          </span>
          {hasConfidence && (
            <span className="text-[10px] font-mono text-muted hidden sm:inline">
              {confidence}% CERTAINTY
            </span>
          )}
        </div>
      </div>

      {/* Quoted User Reasoning Block */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-muted flex items-center gap-1.5">
          <MessageSquareQuote className="w-3.5 h-3.5 text-cyan" />
          YOUR SUBMITTED REASONING
        </span>
        <blockquote className="border-l-2 border-cyan/50 pl-3.5 py-2 text-xs sm:text-sm text-primary/90 italic bg-surface/50 rounded-r-xl leading-relaxed">
          &ldquo;{userReasoning || 'No reasoning provided.'}&rdquo;
        </blockquote>
      </div>

      {/* Strengths & Weaknesses Semantic Tags */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {strengths.map((str, idx) => (
            <span
              key={`str-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal/10 border border-teal/25 text-teal text-xs font-mono"
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{str}</span>
            </span>
          ))}

          {weaknesses.map((weak, idx) => (
            <span
              key={`weak-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-coral/10 border border-coral/25 text-coral text-xs font-mono"
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{weak}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Short AI Coach Connection */}
      {explanation && (
        <div className="pt-2 border-t border-[#1E293B]/60">
          <p className="text-xs text-muted leading-relaxed">
            <strong className="text-primary font-mono text-[11px] uppercase mr-1.5">EVALUATION INSIGHT:</strong>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReasoningReview;
