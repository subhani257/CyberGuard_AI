"use client";
import React from 'react';
import { MessageSquareQuote, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
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
    explanation,
    isAdversarial,
    adversarialAnalysis
  } = data;

  const hasConfidence = typeof confidence === 'number' && !isNaN(confidence);

  return (
    <div 
      className="rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full space-y-4 transition-all duration-300"
      style={{
        background: 'rgba(17, 24, 33, 0.75)',
        border: isAdversarial ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Header with Classification Label */}
      <div 
        className="flex items-center justify-between gap-3 pb-3"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
      >
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-primary flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: isAdversarial ? '#F87171' : 'rgba(79, 124, 255, 0.9)' }}
            ></span>
            REASONING REVIEW
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
            Evaluation of your decision rationale and threat awareness
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span 
            className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider"
            style={isAdversarial
              ? {
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171'
                }
              : {
                  background: 'rgba(79, 124, 255, 0.1)',
                  border: '1px solid rgba(79, 124, 255, 0.22)',
                  color: 'rgba(165, 184, 255, 0.95)'
                }
            }
          >
            {isAdversarial ? 'ADVERSARIAL INJECTION' : classificationLabel}
          </span>
          {hasConfidence && (
            <span className="text-[10px] font-mono hidden sm:inline" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>
              {confidence}% CERTAINTY
            </span>
          )}
        </div>
      </div>

      {/* Adversarial Alert Banner (when detected) */}
      {isAdversarial && (
        <div 
          className="p-3.5 rounded-xl space-y-1.5"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wide" style={{ color: '#F87171' }}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Adversarial Prompt Injection Intercepted</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(240, 244, 248, 0.9)' }}>
            {adversarialAnalysis || 'System prompt override or jailbreak pattern detected in submitted reasoning. The evaluation engine neutralized this attempt, enforced naive classification, and logged the event for security review.'}
          </p>
        </div>
      )}

      {/* Quoted User Reasoning Block */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
          <MessageSquareQuote className="w-3.5 h-3.5" style={{ color: isAdversarial ? '#F87171' : 'rgba(165, 184, 255, 0.9)' }} />
          YOUR SUBMITTED REASONING
        </span>
        <blockquote 
          className="pl-3.5 pr-4 py-2.5 text-xs sm:text-sm italic rounded-r-xl leading-relaxed"
          style={{
            background: 'rgba(11, 15, 20, 0.75)',
            borderLeft: `3px solid ${isAdversarial ? '#F87171' : 'rgba(79, 124, 255, 0.6)'}`,
            color: 'rgba(240, 244, 248, 0.92)'
          }}
        >
          &ldquo;{userReasoning || 'No reasoning provided.'}&rdquo;
        </blockquote>
      </div>

      {/* Strengths & Weaknesses Semantic Tags */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {strengths.map((str, idx) => (
            <span
              key={`str-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#34D399'
              }}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{str}</span>
            </span>
          ))}

          {weaknesses.map((weak, idx) => (
            <span
              key={`weak-${idx}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171'
              }}
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{weak}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Short AI Coach Connection */}
      {explanation && (
        <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
            <strong className="text-primary font-mono text-[11px] uppercase mr-1.5">EVALUATION INSIGHT:</strong>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReasoningReview;
