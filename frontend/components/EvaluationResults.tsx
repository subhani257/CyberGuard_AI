"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Brain, CheckCircle2, ChevronRight, ShieldAlert, X } from 'lucide-react';
import { EvaluationMetricCard } from './evaluation/EvaluationMetricCard';
import { ThreatIndicatorList } from './evaluation/ThreatIndicatorList';
import { DecisionGapCard } from './evaluation/DecisionGapCard';
import { ReasoningReview } from './evaluation/ReasoningReview';
import { CoachTakeaway } from './evaluation/CoachTakeaway';
import { ThreatKnowledge } from './evaluation/ThreatKnowledge';
import { getDecisionVerdict, getSkillLevel, normalizeIndicators, getCoachTakeaway, formatReadableLabel } from '@/lib/evaluation_helpers';
import type { DecisionGapData, ReasoningReviewData, ThreatKnowledgeItem } from './evaluation/types';

export interface EvaluationResultsProps {
  evaluation: {
    action_score: number;
    reasoning_score: number;
    final_score: number;
    is_safe?: boolean;
    threat_indicators: Array<{ type: string; confidence?: number; description: string; channel?: string }>;
    reasoning_category: string;
    expected_behavior: string;
    llm_evaluation?: { confidence?: number; explanation?: string; strengths?: string[]; weaknesses?: string[]; improvement?: string };
    threat_knowledge?: ThreatKnowledgeItem[];
    scenario_clues?: string[];
    is_adversarial?: boolean;
    adversarial_analysis?: string;
  };
  userAction: string;
  userReasoning: string;
  channel?: string;
  responseTimeSeconds?: number | null;
  historicalDelta?: { delta: number; isPositive: boolean; formatted: string } | null;
  backendCoaching?: any;
  policyRuleText?: string | null;
  onOpenHub?: () => void;
}

type DetailSection = 'decision' | 'signals' | 'reasoning' | 'sources';

export const EvaluationResults: React.FC<EvaluationResultsProps> = ({
  evaluation, userAction, userReasoning, channel = 'cloud_oauth', responseTimeSeconds = null,
  historicalDelta = null, backendCoaching = null, policyRuleText = null
}) => {
  const [showScorePopup, setShowScorePopup] = useState(true);
  const [detail, setDetail] = useState<DetailSection | null>(null);
  const [signalFilter, setSignalFilter] = useState('all');
  const scoreOkayRef = useRef<HTMLButtonElement>(null);
  const summaryTitleRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = detail !== null;

  useEffect(() => {
    if (!showScorePopup) return;
    scoreOkayRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowScorePopup(false);
      } else if (event.key === 'Tab') {
        event.preventDefault();
        scoreOkayRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      summaryTitleRef.current?.focus();
    };
  }, [showScorePopup]);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDetail(null);
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'));
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1]?.focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0]?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      openerRef.current?.focus();
    };
  }, [isOpen]);

  const openDetail = (section: DetailSection, event: React.MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    setDetail(section);
  };

  const {
    action_score, reasoning_score, final_score, is_safe, threat_indicators,
    reasoning_category, expected_behavior, llm_evaluation, threat_knowledge,
    scenario_clues, is_adversarial, adversarial_analysis
  } = evaluation;
  const verdictResult = getDecisionVerdict({ isSafe: is_safe, userAction, expectedAction: expected_behavior, actionScore: action_score, reasoningScore: reasoning_score, channel });
  const skillLevel = getSkillLevel(final_score);
  const indicators = normalizeIndicators(threat_indicators, channel);
  const signalTypes = Array.from(new Set(indicators.map(indicator => indicator.type)));
  const effectiveSignalFilter = signalTypes.includes(signalFilter) ? signalFilter : 'all';
  const visibleIndicators = effectiveSignalFilter === 'all' ? indicators : indicators.filter(indicator => indicator.type === effectiveSignalFilter);
  const readableCategory = formatReadableLabel(reasoning_category);
  const decisionData: DecisionGapData = { userAction, expectedAction: expected_behavior, isUserActionSafe: verdictResult.verdict === 'SECURE', policyRuleText };
  const reasoningData: ReasoningReviewData = {
    userReasoning, classificationCategory: reasoning_category, classificationLabel: readableCategory,
    confidence: llm_evaluation?.confidence,
    strengths: llm_evaluation?.strengths?.length ? llm_evaluation.strengths : [readableCategory, 'Decision submitted for evaluation'],
    weaknesses: llm_evaluation?.weaknesses?.length ? llm_evaluation.weaknesses : verdictResult.verdict === 'COMPROMISED' ? ['Action exposed corporate assets'] : [],
    explanation: llm_evaluation?.explanation,
    isAdversarial: Boolean(is_adversarial || reasoning_category === 'adversarial'), adversarialAnalysis: adversarial_analysis
  };
  const coaching = getCoachTakeaway(backendCoaching, llm_evaluation, channel);
  const sourceCount = (threat_knowledge?.length || 0) + (scenario_clues?.length || 0);
  const verdictColor = verdictResult.verdict === 'SECURE' ? '#34D399' : verdictResult.verdict === 'COMPROMISED' ? '#F87171' : '#FBBF24';
  const boundedScore = Math.max(0, Math.min(100, Math.round(final_score)));
  const sections = [
    { id: 'decision' as const, title: 'Your decision', subtitle: 'Choice, safer action and scores', count: 'CHOICE', Icon: CheckCircle2 },
    { id: 'signals' as const, title: 'Threat signals', subtitle: 'Evidence found in the scenario', count: `${indicators.length} SIGNALS`, Icon: ShieldAlert },
    { id: 'reasoning' as const, title: 'Reasoning & coaching', subtitle: 'Your explanation and next lesson', count: 'REVIEW', Icon: Brain },
    { id: 'sources' as const, title: 'Clues & sources', subtitle: 'Scenario clues and references', count: `${sourceCount} ITEMS`, Icon: BookOpen }
  ];

  return <div className="h-full min-h-0 w-full max-w-[1200px] mx-auto flex flex-col gap-2 sm:gap-3 text-primary">
    <section className="shrink-0 rounded-2xl border border-white/10 bg-[#111821]/90 px-4 py-3 sm:px-6 sm:py-4" aria-labelledby="debrief-title">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 mb-1 text-[10px] font-mono uppercase tracking-wide">
            <span className="text-[#A5B8FF]">Decision debrief</span>
            <span style={{ color: verdictColor }}>{verdictResult.badgeLabel}</span>
          </div>
          <h1 ref={summaryTitleRef} tabIndex={-1} id="debrief-title" className="text-lg sm:text-2xl font-bold leading-tight line-clamp-2">{verdictResult.headline}</h1>
          <p className="evaluation-summary-explanation mt-1 text-xs sm:text-sm text-[#AAB5C2] leading-relaxed line-clamp-2">{verdictResult.summary}</p>
        </div>
        <div className="shrink-0 text-center border-l border-white/10 pl-3 sm:pl-6" aria-label={`Overall score ${Math.round(final_score)} out of 100, ${skillLevel}`}>
          <div className="text-2xl sm:text-4xl font-bold leading-none" style={{ color: verdictColor }}>{Math.round(final_score)}</div>
          <div className="text-[10px] font-mono text-[#AAB5C2]">/ 100</div>
          <div className="text-[10px] font-mono text-[#A5B8FF] mt-1">{skillLevel}</div>
          {historicalDelta && <div className="text-[10px] text-[#AAB5C2]">{historicalDelta.formatted} vs previous</div>}
        </div>
      </div>
    </section>

    <div className="shrink-0 grid grid-cols-3 gap-2" aria-label="Score summary">
      {[
        { label: 'Action', value: `${Math.round(action_score)} / 100` },
        { label: 'Reasoning', value: `${Math.round(reasoning_score)} / 100` },
        { label: responseTimeSeconds !== null && responseTimeSeconds > 0 ? 'Response time' : 'AI confidence', value: responseTimeSeconds !== null && responseTimeSeconds > 0 ? `${responseTimeSeconds}s` : typeof llm_evaluation?.confidence === 'number' ? `${llm_evaluation.confidence}%` : '—' }
      ].map(metric => <div key={metric.label} className="rounded-xl border border-white/10 bg-[#111821]/80 px-3 py-2">
        <div className="text-[10px] text-[#AAB5C2] uppercase tracking-wide">{metric.label}</div>
        <div className="text-sm sm:text-xl font-bold">{metric.value}</div>
      </div>)}
    </div>

    <section className="shrink-0 rounded-xl border border-[#4F7CFF]/25 bg-[#4F7CFF]/[0.08] px-4 py-2.5" aria-label="Key takeaway">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[#A5B8FF]">Key takeaway</div>
      <p className="text-xs sm:text-sm leading-relaxed line-clamp-2">{coaching.lesson}</p>
    </section>

    <div className="min-h-0 flex-1 flex flex-col">
      <div className="shrink-0 flex items-center justify-between mb-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#AAB5C2]">Explore the details</h2>
        <span className="text-[10px] text-[#8190A3] hidden sm:inline">Open only what you need</span>
      </div>
      <div className="min-h-0 flex-1 grid grid-cols-2 grid-rows-2 gap-2">
        {sections.map(({ id, title, subtitle, count, Icon }) => <button key={id} type="button" onClick={event => openDetail(id, event)} aria-label={`Explore ${title}`}
          className="min-h-0 text-left rounded-xl border border-white/10 bg-[#111821]/80 hover:border-[#4F7CFF]/50 hover:bg-[#182334] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A5B8FF] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-colors">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#A5B8FF]" />
          <span className="min-w-0 flex-1"><span className="block text-xs sm:text-sm font-semibold">{title}</span><span className="hidden sm:block text-xs text-[#AAB5C2] mt-0.5 line-clamp-1">{subtitle}</span></span>
          <span className="text-[10px] font-mono text-[#8190A3] hidden sm:inline">{count}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8190A3]" />
        </button>)}
      </div>
    </div>

    {showScorePopup && <div data-evaluation-score-popup className="fixed inset-0 z-50 flex items-center justify-center bg-[#05080D]/90 p-3 sm:p-6 backdrop-blur-md">
      <div role="dialog" aria-modal="true" aria-labelledby="score-popup-title" aria-describedby="score-popup-description"
        className="w-full max-w-md max-h-full overflow-y-auto rounded-3xl border border-white/15 bg-[#111821] p-5 sm:p-8 text-center shadow-[0_32px_90px_rgba(0,0,0,0.65)]">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#A5B8FF]">Evaluation complete</div>
        <h2 id="score-popup-title" className="mt-2 text-xl sm:text-2xl font-bold">Your score is ready</h2>
        <p id="score-popup-description" className="mt-1 text-xs sm:text-sm text-[#AAB5C2]">Review your result, then explore the debrief dashboard.</p>

        <div className="mx-auto mt-5 h-40 w-40 rounded-full p-2" style={{ background: `conic-gradient(${verdictColor} ${boundedScore}%, rgba(255,255,255,0.08) 0)` }}
          role="meter" aria-label="Overall evaluation score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={boundedScore}>
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#111821]">
            <span className="text-5xl font-bold leading-none" style={{ color: verdictColor }}>{boundedScore}</span>
            <span className="mt-1 text-xs font-mono text-[#AAB5C2]">OUT OF 100</span>
          </div>
        </div>

        <div className="mt-4 text-xs font-mono font-bold uppercase tracking-wider" style={{ color: verdictColor }}>{verdictResult.badgeLabel}</div>
        <div className="mt-1 text-xs text-[#AAB5C2]">{skillLevel}</div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-white/10 bg-[#0B1119] px-4 py-3"><div className="text-[10px] font-mono uppercase tracking-wide text-[#AAB5C2]">Action</div><div className="mt-1 text-xl font-bold">{Math.round(action_score)}<span className="text-xs font-normal text-[#AAB5C2]"> / 100</span></div></div>
          <div className="rounded-xl border border-white/10 bg-[#0B1119] px-4 py-3"><div className="text-[10px] font-mono uppercase tracking-wide text-[#AAB5C2]">Reasoning</div><div className="mt-1 text-xl font-bold">{Math.round(reasoning_score)}<span className="text-xs font-normal text-[#AAB5C2]"> / 100</span></div></div>
        </div>
        <button ref={scoreOkayRef} type="button" onClick={() => setShowScorePopup(false)}
          className="mt-5 w-full rounded-xl border border-[#7494FF]/40 bg-[#4F7CFF]/20 px-4 py-3 text-sm font-bold text-[#D7E0FF] hover:bg-[#4F7CFF]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A5B8FF]">
          Okay, view dashboard
        </button>
      </div>
    </div>}

    {detail && <div data-evaluation-detail-dialog className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-2 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) setDetail(null); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="detail-title" className="w-full max-w-4xl h-full max-h-[820px] min-h-0 flex flex-col rounded-2xl border border-white/15 bg-[#0B1119] shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/10">
          <div><div className="text-[10px] uppercase tracking-widest text-[#A5B8FF]">Decision debrief / Deep dive</div><h2 id="detail-title" className="text-lg font-bold">{sections.find(section => section.id === detail)?.title}</h2></div>
          <button ref={closeRef} type="button" onClick={() => setDetail(null)} className="rounded-lg p-2 text-[#AAB5C2] hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A5B8FF]" aria-label="Close details"><X className="w-5 h-5" /></button>
        </div>
        <nav className="shrink-0 flex gap-1 overflow-x-auto px-3 sm:px-5 py-2 border-b border-white/10" aria-label="Debrief detail categories">
          {sections.map(section => <button key={section.id} type="button" onClick={() => setDetail(section.id)} aria-current={detail === section.id ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A5B8FF] ${detail === section.id ? 'bg-[#4F7CFF]/20 text-[#C5D2FF]' : 'text-[#AAB5C2] hover:bg-white/5'}`}>{section.title}</button>)}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4" tabIndex={0}>
          {detail === 'decision' && <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-[#111821] p-4">
              <div className="text-[10px] font-mono uppercase tracking-wide" style={{ color: verdictColor }}>{verdictResult.badgeLabel} · {skillLevel}</div>
              <h3 className="mt-1 text-base font-semibold">{verdictResult.headline}</h3>
              <p className="mt-1 text-sm text-[#AAB5C2]">{verdictResult.summary}</p>
            </div>
            <DecisionGapCard data={decisionData} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EvaluationMetricCard label="ACTION SCORE" value={action_score} maxValue="/100" interpretation={action_score >= 75 ? 'Defensive Verification' : action_score >= 50 ? 'Partial Mitigation' : 'Risky Response'} consequence={action_score >= 75 ? 'Prevented unauthorized access tokens' : action_score >= 50 ? 'Avoided direct execution but left residual risk' : 'Led to organizational credential exposure'} color={action_score >= 75 ? 'teal' : action_score >= 50 ? 'amber' : 'coral'} progressPercent={action_score} />
              <EvaluationMetricCard label="REASONING SCORE" value={reasoning_score} maxValue="/100" interpretation={reasoning_score >= 75 ? 'Strong Awareness' : reasoning_score >= 50 ? 'Moderate Inspection' : 'Superficial Check'} consequence={`Classified as ${readableCategory}`} color={reasoning_score >= 75 ? 'teal' : reasoning_score >= 50 ? 'blue' : 'amber'} progressPercent={reasoning_score} />
              {responseTimeSeconds !== null && responseTimeSeconds > 0
                ? <EvaluationMetricCard label="RESPONSE TIME" value={`${responseTimeSeconds}s`} maxValue="Target <60s" interpretation={responseTimeSeconds < 45 ? 'Prompt Analysis' : responseTimeSeconds < 90 ? 'Careful Inspection' : 'Extended Review'} consequence="Measured from scenario presentation to submission" color="cyan" progressPercent={Math.min(100, Math.round((responseTimeSeconds / 60) * 100))} badge="Telemetry" />
                : typeof llm_evaluation?.confidence === 'number' && <EvaluationMetricCard label="EVALUATION CONFIDENCE" value={`${llm_evaluation.confidence}%`} maxValue="Certainty" interpretation={llm_evaluation.confidence >= 80 ? 'High Certainty' : 'Moderate Certainty'} consequence="AI model analytical confidence in assessment" color="blue" progressPercent={llm_evaluation.confidence} badge="Model Metric" />}
            </div>
          </div>}
          {detail === 'signals' && <div className="space-y-3">
            {signalTypes.length > 1 && <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111821] px-4 py-3">
              <label htmlFor="signal-filter" className="text-xs font-medium text-[#AAB5C2]">Show signals</label>
              <select id="signal-filter" value={effectiveSignalFilter} onChange={event => setSignalFilter(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#0B1119] px-3 py-1.5 text-xs text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A5B8FF]">
                <option value="all">All types ({indicators.length})</option>
                {signalTypes.map(type => <option key={type} value={type}>{type} ({indicators.filter(indicator => indicator.type === type).length})</option>)}
              </select>
            </div>}
            <ThreatIndicatorList indicators={visibleIndicators} channel={channel} hasMissedFlag={false} />
          </div>}
          {detail === 'reasoning' && <div className="space-y-4"><ReasoningReview data={reasoningData} /><CoachTakeaway data={coaching} /></div>}
          {detail === 'sources' && (sourceCount > 0 ? <ThreatKnowledge knowledge={threat_knowledge} scenarioClues={scenario_clues} channel={channel} /> : <div className="rounded-xl border border-white/10 p-6 text-sm text-[#AAB5C2]">No scenario clues or source references were returned for this evaluation.</div>)}
        </div>
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2 border-t border-white/10 text-xs text-[#AAB5C2]"><span>Choose another category above</span><button type="button" onClick={() => setDetail(null)} className="inline-flex items-center gap-1 text-[#A5B8FF] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#A5B8FF]"><ArrowLeft className="w-3 h-3" /> Back to summary</button></div>
      </div>
    </div>}
  </div>;
};

export default EvaluationResults;
