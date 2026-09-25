"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

type RecordValue = string | number | boolean | null | Record<string, unknown> | unknown[];

interface ScenarioDetail {
  id: string;
  scenario_id: string | null;
  scenario: Record<string, RecordValue>;
  scenario_meta: { difficulty?: string | null; target_role?: string | null; threat_type?: string | null };
  decision: {
    chosen_action?: string | null;
    reasoning?: string | null;
    is_safe?: boolean | null;
    completed_at?: string | null;
    human_review_required?: boolean | null;
    admin_verdict?: string | null;
    admin_reason?: string | null;
  };
  evaluation: {
    final_score?: number;
    action_score?: number;
    reasoning_score?: number;
    weaknesses?: string[];
    reasoning_category?: string;
    reasoning_classification?: { category?: string };
    safe_behavior?: { expected_safe_action?: string; expected_action?: string };
    threat_indicators?: Record<string, unknown>;
    threat_knowledge?: Record<string, unknown>;
    llm_evaluation?: {
      confidence?: number;
      explanation?: string;
      strengths?: string[];
      weaknesses?: string[];
      improvement?: string;
    };
  };
}

const label = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
const valueText = (value: unknown): string => {
  if (value == null) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(valueText).join(' · ');
  return Object.entries(value as Record<string, unknown>).map(([key, entry]) => `${label(key)}: ${valueText(entry)}`).join(' · ');
};

const card = 'rounded-2xl border border-white/[0.08] bg-[#111821]/80 p-5 sm:p-6';

export default function CompletedScenarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const decisionId = typeof params.id === 'string' ? params.id : '';
  const [detail, setDetail] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!decisionId) return;
    const token = localStorage.getItem('cyberguard_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    fetch(`http://localhost:8000/api/coach/completed-scenarios/${encodeURIComponent(decisionId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async response => {
      if (response.status === 401) { router.replace('/login'); return null; }
      if (response.status === 404) throw new Error('This completed scenario was not found.');
      if (!response.ok) throw new Error('Could not load scenario details.');
      return response.json();
    }).then(result => {
      if (!cancelled && result) setDetail(result);
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not load scenario details.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [decisionId, router]);

  const scenario = detail?.scenario || {};
  const evaluation = detail?.evaluation || {};
  const llm = evaluation.llm_evaluation || {};
  const title = String(scenario.situation_title || scenario.subject || detail?.scenario_meta.threat_type || 'Completed scenario');
  const choices = Array.isArray(scenario.choices) ? scenario.choices : [];
  const clues = Array.isArray(scenario.clues_embedded) ? scenario.clues_embedded : [];
  const extraFields = Object.entries(scenario).filter(([key]) => ![
    'situation_title', 'situation_tagline', 'sender_name', 'sender_email', 'subject', 'body',
    'choices', 'clues_embedded', 'threat_type', 'difficulty', 'channel', 'channel_data',
  ].includes(key));

  return (
    <main className="min-h-screen bg-background text-primary">
      <header className="border-b border-white/[0.07] bg-[#0B0F14]/90">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/history" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"><ArrowLeft className="w-4 h-4" /> Completed Scenarios</Link>
          <Link href="/dashboard" className="text-xs font-mono uppercase tracking-wider text-muted hover:text-primary">Dashboard</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-9 space-y-5">
        {loading && <p className="text-muted py-12 text-center">Loading scenario details…</p>}
        {error && <div role="alert" className={card}><p className="text-red-200">{error}</p><Link href="/history" className="inline-block mt-4 text-sm text-[#A5B8FF] underline">Back to history</Link></div>}
        {detail && <>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-3">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#A5B8FF]">Completed scenario</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-2">{title}</h1>
              <p className="text-sm text-muted mt-2 capitalize">
                {String(scenario.channel || 'unknown').replace(/_/g, ' ')}
                {detail.scenario_meta.difficulty && ` · ${detail.scenario_meta.difficulty}`}
                {detail.decision.completed_at && ` · ${new Date(detail.decision.completed_at).toLocaleDateString()}`}
              </p>
            </div>
            <div className="rounded-xl border border-blue/25 bg-blue/10 px-5 py-3 text-center shrink-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted">Your score</p>
              <p className="text-2xl font-semibold text-[#A5B8FF]">{typeof evaluation.final_score === 'number' ? `${Math.round(evaluation.final_score)}/100` : 'Not scored'}</p>
            </div>
          </div>

          <section className={card}>
            <h2 className="font-semibold text-base mb-4">Original scenario</h2>
            {scenario.situation_tagline && <p className="text-sm text-muted mb-4">{valueText(scenario.situation_tagline)}</p>}
            {Object.keys(scenario).length === 0 && <p className="text-sm text-muted">The original scenario content is unavailable for this older record.</p>}
            {(scenario.sender_name || scenario.sender_email || scenario.subject) && <div className="rounded-xl bg-[#0B1119] border border-white/[0.07] p-4 text-sm space-y-1 mb-4">
              {scenario.sender_name && <p><span className="text-muted">From:</span> {valueText(scenario.sender_name)}</p>}
              {scenario.sender_email && <p><span className="text-muted">Address:</span> {valueText(scenario.sender_email)}</p>}
              {scenario.subject && <p><span className="text-muted">Subject:</span> {valueText(scenario.subject)}</p>}
            </div>}
            {scenario.body && <p className="text-sm leading-7 whitespace-pre-wrap">{valueText(scenario.body)}</p>}
            {scenario.channel_data && <div className="mt-4 rounded-xl bg-[#0B1119] border border-white/[0.07] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-2">Channel details</h3>
              {Object.entries(scenario.channel_data as Record<string, unknown>).map(([key, value]) => <p key={key} className="text-sm mt-1"><span className="text-muted">{label(key)}:</span> {valueText(value)}</p>)}
            </div>}
            {extraFields.length > 0 && <div className="mt-4 text-sm space-y-1">
              {extraFields.map(([key, value]) => <p key={key}><span className="text-muted">{label(key)}:</span> {valueText(value)}</p>)}
            </div>}
            {choices.length > 0 && <div className="mt-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-2">Available choices</h3>
              <div className="space-y-2">{choices.map((choice, index) => {
                const chosen = String(choice).trim().toLowerCase() === String(detail.decision.chosen_action || '').trim().toLowerCase();
                return <div key={index} className={`rounded-lg border px-3 py-2 text-sm ${chosen ? 'border-blue/40 bg-blue/10' : 'border-white/[0.07] bg-white/[0.02]'}`}>
                  <span className="text-muted mr-2">{index + 1}.</span>{valueText(choice)} {chosen && <span className="ml-2 text-xs text-[#A5B8FF]">Your choice</span>}
                </div>;
              })}</div>
            </div>}
          </section>

          <section className={card}>
            <div className="flex items-center gap-2 mb-4">
              {detail.decision.is_safe ? <CheckCircle2 className="w-5 h-5 text-[#A5B8FF]" /> : <AlertCircle className="w-5 h-5 text-muted" />}
              <h2 className="font-semibold text-base">Your decision</h2>
            </div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted">Chosen action</p>
            <p className="text-sm mt-1">{detail.decision.chosen_action || 'Not recorded'}</p>
            <p className="text-xs font-mono uppercase tracking-wider text-muted mt-4">Your reasoning</p>
            <p className="text-sm mt-1 leading-6 whitespace-pre-wrap">{detail.decision.reasoning || 'Not recorded'}</p>
          </section>

          <section className={card}>
            <h2 className="font-semibold text-base mb-4">Evaluation details</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl border border-white/[0.07] bg-[#0B1119] p-4"><p className="text-xs text-muted">Action score</p><p className="text-lg font-semibold mt-1">{typeof evaluation.action_score === 'number' ? `${Math.round(evaluation.action_score)}/100` : '—'}</p></div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0B1119] p-4"><p className="text-xs text-muted">Reasoning score</p><p className="text-lg font-semibold mt-1">{typeof evaluation.reasoning_score === 'number' ? `${Math.round(evaluation.reasoning_score)}/100` : '—'}</p></div>
            </div>
            {(llm.explanation || llm.improvement) && <div className="space-y-4 text-sm leading-6">
              {llm.explanation && <div><h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Why this score</h3><p>{llm.explanation}</p></div>}
              {llm.improvement && <div><h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-1">How to improve</h3><p>{llm.improvement}</p></div>}
            </div>}
            {llm.strengths && llm.strengths.length > 0 && <div className="mt-4"><h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Strengths</h3><ul className="list-disc pl-5 text-sm space-y-1">{llm.strengths.map((strength, index) => <li key={index}>{strength}</li>)}</ul></div>}
            {llm.weaknesses && llm.weaknesses.length > 0 && <div className="mt-4"><h3 className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Missed indicators</h3><ul className="list-disc pl-5 text-sm space-y-1">{llm.weaknesses.map((weakness, index) => <li key={index}>{weakness}</li>)}</ul></div>}
            {(evaluation.safe_behavior?.expected_safe_action || evaluation.safe_behavior?.expected_action) && <div className="mt-4 rounded-xl border border-blue/20 bg-blue/5 p-4 text-sm"><p className="text-xs font-mono uppercase tracking-wider text-muted mb-1">Recommended safe action</p>{evaluation.safe_behavior.expected_safe_action || evaluation.safe_behavior.expected_action}</div>}
            {(evaluation.reasoning_classification?.category || evaluation.reasoning_category) && <p className="mt-4 text-xs text-muted">Reasoning classification: {label(evaluation.reasoning_classification?.category || evaluation.reasoning_category || '')}</p>}
            {detail.decision.admin_verdict && <div className="mt-4 text-xs text-muted">Review verdict: {label(detail.decision.admin_verdict)}{detail.decision.admin_reason && ` · ${detail.decision.admin_reason}`}</div>}
          </section>

          {clues.length > 0 && <section className={card}>
            <h2 className="font-semibold text-base mb-3">Indicators in the scenario</h2>
            <ul className="list-disc pl-5 text-sm text-muted space-y-1">{clues.map((clue, index) => <li key={index}>{valueText(clue)}</li>)}</ul>
          </section>}
        </>}
      </div>
    </main>
  );
}
