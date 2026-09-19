"use client";
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { 
  Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, 
  HardDrive, Shield, ArrowLeft 
} from 'lucide-react';
import { EvaluationResults } from '@/components/EvaluationResults';
import { EvaluationActionDock } from '@/components/evaluation/EvaluationActionDock';
import ScenarioControlHub, { DecisionRecord } from '@/components/simulation/ScenarioControlHub';
import { getSectorConfig, SectorChannel } from '@/lib/sectors';
import { shouldIgnoreKeyboardEvent, formatReadiness } from '@/lib/scenario_helpers';
import { calculateHistoricalDelta } from '@/lib/evaluation_helpers';

const ICON_MAP = {
  Phone,
  Mail,
  MessageSquare,
  QrCode,
  Cloud,
  Smartphone,
  HardDrive,
};

interface EvaluationData {
  action_score: number;
  reasoning_score: number;
  final_score: number;
  is_safe?: boolean;
  threat_indicators: Array<{
    type: string;
    confidence?: number;
    description: string;
    channel?: string;
  }>;
  reasoning_category: string;
  expected_behavior: string;
  llm_evaluation?: {
    confidence?: number;
    explanation?: string;
    strengths?: string[];
    weaknesses?: string[];
    improvement?: string;
  };
  threat_knowledge?: Array<{
    category?: string;
    source?: string;
    content?: string;
    similarity?: number | null;
    metadata?: Record<string, any>;
  }>;
  scenario_clues?: string[];
  is_adversarial?: boolean;
  adversarial_analysis?: string;
}

function EvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [userAction, setUserAction] = useState<string>("Verify sender identity through alternate channel");
  const [userReasoning, setUserReasoning] = useState<string>("This authorization request looks suspicious because the domain is unverified.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluatedChannel, setEvaluatedChannel] = useState<string>('cloud_oauth');
  const [scenarioId, setScenarioId] = useState<string>('SC004');
  const [responseTimeSeconds, setResponseTimeSeconds] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Hub Drawer State
  const [isHubOpen, setIsHubOpen] = useState(false);
  const hubLauncherRef = useRef<HTMLButtonElement>(null);
  const evaluationStartedRef = useRef(false);

  // Dynamic Telemetry State (from coach / dashboard summary)
  const [readinessScore, setReadinessScore] = useState<number>(74);
  const [priorityChannel, setPriorityChannel] = useState<string>('voice_phone');
  const [recommendedSituation, setRecommendedSituation] = useState<string>('Voice Intercept');
  const [recommendationRationale, setRecommendationRationale] = useState<string>('Prioritize urgency bias detection in dual-control bypass lures.');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [secureCount, setSecureCount] = useState<number>(0);
  const [decisionJourney, setDecisionJourney] = useState<DecisionRecord[]>([]);
  const [sectorScores, setSectorScores] = useState<Record<string, number>>({});
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [backendCoaching, setBackendCoaching] = useState<any>(null);

  // Sector config resolution
  const sectorConfig = getSectorConfig(evaluatedChannel);
  const activeChannel = sectorConfig.channel;
  const SectorIcon = ICON_MAP[sectorConfig.iconName] || Shield;

  // 1. Fetch Telemetry from Coach Agent
  const fetchTelemetry = useCallback(() => {
    setIsLoadingTelemetry(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('http://localhost:8000/api/coach/dashboard-summary', { headers })
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => {
        if (d?.success) {
          if (typeof d.readiness_score === 'number') {
            setReadinessScore(formatReadiness(d.readiness_score));
          }
          if (d.learning_profile?.target_channel) {
            setPriorityChannel(d.learning_profile.target_channel);
          }
          if (d.next_situation?.title) {
            setRecommendedSituation(d.next_situation.title);
          }
          if (d.next_situation?.tactic_target) {
            setRecommendationRationale(`Focus on target defense vector: ${d.next_situation.tactic_target.replace(/[_-]+/g, ' ')}.`);
          }
          if (Array.isArray(d.decision_journey)) {
            setDecisionJourney(d.decision_journey);
            setCompletedCount(d.decision_journey.length);
            const secure = d.decision_journey.filter((dj: any) => dj.is_safe !== false).length;
            setSecureCount(secure);
          }
          if (d.weakness_breakdown && typeof d.weakness_breakdown === 'object') {
            setSectorScores({
              voice_phone: d.weakness_breakdown['Phishing & Spoofing'] || 0,
              email: d.weakness_breakdown['Urgency & BEC Defense'] || 0,
              slack_teams: d.weakness_breakdown['Data Protection & Privacy'] || 0,
              qr_code: d.weakness_breakdown['Phishing & Spoofing'] || 0,
              cloud_oauth: d.weakness_breakdown['Policy Compliance & Verification'] || 0,
              sms_push: d.weakness_breakdown['Policy Compliance & Verification'] || 0,
              physical_media: d.weakness_breakdown['Data Protection & Privacy'] || 0,
            });
          }
        }
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('cyberguard_user');
          if (raw) {
            try {
              const u = JSON.parse(raw);
              if (u.learning_profile?.target_channel) setPriorityChannel(u.learning_profile.target_channel);
            } catch (_) {}
          }
        }
      })
      .finally(() => {
        setIsLoadingTelemetry(false);
      });
  }, []);

  // Initial load: Fetch telemetry
  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Keyboard navigation: H toggles Training Hub, Escape closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(e)) return;
      if (document.querySelector('[data-evaluation-detail-dialog], [data-evaluation-score-popup]')) return;

      if (e.key === 'Escape') {
        if (isHubOpen) {
          e.preventDefault();
          setIsHubOpen(false);
          return;
        }
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsHubOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHubOpen]);

  // Handle sector selection from the Hub drawer
  const handleSelectSector = (targetSector: SectorChannel) => {
    setIsHubOpen(false);
    setIsNavigating(true);
    router.push(`/scenario?channel=${targetSector}`);
  };

  const handleNavigateOverview = () => {
    setIsHubOpen(false);
    router.push('/dashboard?tab=overview');
  };

  const handleNavigatePolicies = () => {
    setIsHubOpen(false);
    router.push('/policies');
  };

  // Action Dock Handlers: In-place Retry & Next Challenge
  const handleRetryScenario = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cyberguard_current_decision');
    }
    router.push(`/scenario?channel=${evaluatedChannel}`);
  };

  const handleNextChallenge = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cyberguard_current_decision');
    }
    const nextTopic = backendCoaching?.recommended_topic || recommendedSituation;
    const nextDifficulty = backendCoaching?.next_difficulty;
    const query = new URLSearchParams({ channel: priorityChannel, topic: nextTopic });
    if (nextDifficulty) query.set('difficulty', nextDifficulty);
    router.push(`/scenario?${query.toString()}`);
  };

  // 2. Evaluation Data Fetching & Feedback Loop
  useEffect(() => {
    // React Strict Mode replays effects in development. Evaluation is a
    // state-changing request, so allow only one submission per page mount.
    if (evaluationStartedRef.current) return;
    evaluationStartedRef.current = true;

    let storedDecision: any = null;
    try {
      const raw = localStorage.getItem('cyberguard_current_decision');
      if (raw) storedDecision = JSON.parse(raw);
    } catch (e) {}

    const targetScenarioId = storedDecision?.scenario_id || searchParams.get('scenario_id') || '';
    const action = storedDecision?.user_action || searchParams.get('choice') || "Verify through another channel";
    const reasoning = storedDecision?.user_reasoning || "The authorization request appeared anomalous and lacked verified publisher status.";
    const resolvedChannel = storedDecision?.channel || searchParams.get('channel') || 'cloud_oauth';
    const recordedTiming = typeof storedDecision?.response_time_seconds === 'number' ? storedDecision.response_time_seconds : null;

    setScenarioId(targetScenarioId);
    setEvaluatedChannel(resolvedChannel);
    setUserAction(action);
    setUserReasoning(reasoning);
    setResponseTimeSeconds(recordedTiming);

    let userId = "";
    const token = localStorage.getItem('cyberguard_token');
    if (!token || !targetScenarioId) {
      setError(!token ? 'Please sign in to evaluate this decision.' : 'No generated scenario was selected for evaluation.');
      setLoading(false);
      if (!token) router.replace('/login');
      return;
    }
    try {
      const u = localStorage.getItem('cyberguard_user');
      if (u) userId = JSON.parse(u).id || userId;
    } catch (e) {}

    // Call Member 2's Unified Evaluation Agent Endpoint
    fetch('http://localhost:8000/api/agents/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        scenario_id: targetScenarioId,
        user_action: action,
        user_reasoning: reasoning,
        user_id: userId
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.evaluation) {
          const evalResult = resData.evaluation.evaluation || {};
          const threatAnalysis = resData.evaluation.threat_analysis || {};
          const reasoningAnalysis = resData.evaluation.reasoning_analysis || {};

          // Extract indicators without cross-channel fabrication
          const rawIndicators: Array<{ type: string; confidence?: number; description: string }> = [];
          if (threatAnalysis.indicators) {
            const ind = threatAnalysis.indicators;

            // 1. Spoofed Domains & Identifiers
            const spoofedList = ind.spoofed_domains || ind.spoofed_identifiers;
            if (Array.isArray(spoofedList)) {
              spoofedList.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 95;
                rawIndicators.push({
                  type: "Spoofed Domain",
                  confidence: conf,
                  description: item.domain ? `Detected spoofed domain: ${item.domain}${item.reason ? ` (${item.reason})` : ''}` : (item.description || item.reason || String(item))
                });
              });
            }

            // 2. Financial & Wire Requests
            if (Array.isArray(ind.financial_requests)) {
              ind.financial_requests.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 90;
                rawIndicators.push({
                  type: "Financial Request",
                  confidence: conf,
                  description: item.context ? `Payment/Wire lure: '${item.context}'` : (item.keyword ? `Payment request: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 3. Urgency Bias Pressure
            if (Array.isArray(ind.urgency_indicators)) {
              ind.urgency_indicators.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 92;
                rawIndicators.push({
                  type: "Urgency Pressure",
                  confidence: conf,
                  description: item.context ? `Urgency trigger: '${item.context}'` : (item.keyword ? `Urgency keyword: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 4. Executive / Authority Impersonation
            if (Array.isArray(ind.authority_abuse)) {
              ind.authority_abuse.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 88;
                rawIndicators.push({
                  type: "Executive Impersonation",
                  confidence: conf,
                  description: item.context ? `Authority leverage: '${item.context}'` : (item.keyword ? `Authority title: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 5. Suspicious URLs / Phishing Links
            if (Array.isArray(ind.suspicious_urls)) {
              ind.suspicious_urls.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 85;
                rawIndicators.push({
                  type: "Suspicious URL",
                  confidence: conf,
                  description: item.url ? `Suspicious URL detected: ${item.url}${item.reason ? ` (${item.reason})` : ''}` : (item.description || String(item))
                });
              });
            }

            // 6. Malicious Attachment Requests
            if (Array.isArray(ind.attachment_requests)) {
              ind.attachment_requests.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 80;
                rawIndicators.push({
                  type: "Malicious Attachment",
                  confidence: conf,
                  description: item.context ? `Attachment lure: '${item.context}'` : (item.keyword ? `Attachment keyword: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 7. Quishing / Malicious QR Code
            if (Array.isArray(ind.qr_code_attacks)) {
              ind.qr_code_attacks.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 90;
                rawIndicators.push({
                  type: "QR Code Attack",
                  confidence: conf,
                  description: item.context ? `QR Code trigger: '${item.context}'` : (item.keyword ? `QR Code lure: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 8. Supply Chain / Vendor Fraud Pretext
            if (Array.isArray(ind.supply_chain_pretext)) {
              ind.supply_chain_pretext.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 85;
                rawIndicators.push({
                  type: "Supply Chain Pretext",
                  confidence: conf,
                  description: item.context ? `Vendor payment update: '${item.context}'` : (item.keyword ? `Supply chain trigger: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 9. OAuth / Cloud App Consent Abuse
            if (Array.isArray(ind.cloud_app_consent)) {
              ind.cloud_app_consent.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 90;
                rawIndicators.push({
                  type: "Cloud App Consent",
                  confidence: conf,
                  description: item.context ? `App permissions request: '${item.context}'` : (item.keyword ? `Consent trigger: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 10. MFA Push Bombing / Fatigue
            if (Array.isArray(ind.mfa_fatigue)) {
              ind.mfa_fatigue.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 95;
                rawIndicators.push({
                  type: "MFA Push Bombing",
                  confidence: conf,
                  description: item.context ? `MFA bombardment trigger: '${item.context}'` : (item.keyword ? `MFA fatigue trigger: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }

            // 11. Voice Vishing / DM Remote Access Pretext
            if (Array.isArray(ind.vishing_dm_pretext)) {
              ind.vishing_dm_pretext.forEach((item: any) => {
                const conf = typeof item.confidence === 'number' ? (item.confidence > 1 ? item.confidence : Math.round(item.confidence * 100)) : 88;
                rawIndicators.push({
                  type: "Voice Vishing Pretext",
                  confidence: conf,
                  description: item.context ? `Vishing/Remote access lure: '${item.context}'` : (item.keyword ? `Vishing trigger: '${item.keyword}'` : (item.description || String(item)))
                });
              });
            }
          }

          const parsedEvaluation: EvaluationData = {
            action_score: evalResult.action_score ?? 85,
            reasoning_score: evalResult.reasoning_score ?? 75,
            final_score: evalResult.final_score ?? 81,
            is_safe: evalResult.is_safe,
            threat_indicators: rawIndicators,
            reasoning_category: reasoningAnalysis.category || "security-aware",
            expected_behavior: threatAnalysis.safe_behavior?.expected_safe_action || threatAnalysis.safe_behavior?.expected_action || "Verify sender identity through alternate channel before taking any action",
            llm_evaluation: evalResult.llm_evaluation,
            threat_knowledge: Array.isArray(threatAnalysis.threat_knowledge) ? threatAnalysis.threat_knowledge : [],
            scenario_clues: Array.isArray(threatAnalysis.scenario_clues) ? threatAnalysis.scenario_clues : [],
            is_adversarial: Boolean(reasoningAnalysis.adversarial || reasoningAnalysis.category === 'adversarial'),
            adversarial_analysis: reasoningAnalysis.analysis
          };

          setEvaluation(parsedEvaluation);

          // Trigger Coach Agent to close feedback loop
          fetch('http://localhost:8000/api/coach/process-decision', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              scenario_id: targetScenarioId
            })
          })
            .then(cRes => (cRes.ok ? cRes.json() : null))
            .then(cData => {
              if (cData?.coaching) {
                setBackendCoaching(cData.coaching);
              }
              // Refresh telemetry after Coach has updated the profile and readiness
              fetchTelemetry();
            })
            .catch(coachErr => {
              console.log('Notice: Coach update skipped:', coachErr);
            });
        } else {
          throw new Error(resData.detail || resData.error || 'Evaluation processing error');
        }
      })
      .catch(err => {
        setError(err.message || 'Evaluation could not be completed for this scenario.');
      })
      .finally(() => setLoading(false));
  }, [searchParams, fetchTelemetry]);

  // Compute safe historical delta
  const historicalDelta = evaluation
    ? calculateHistoricalDelta(evaluation.final_score, scenarioId, decisionJourney)
    : null;

  if (!loading && error && !evaluation) {
    return (
      <main className="min-h-screen bg-[#080D12] text-primary flex items-center justify-center p-8 font-sans">
        <div 
          className="max-w-lg rounded-2xl p-8 text-center space-y-4 shadow-2xl"
          style={{
            background: 'rgba(17, 24, 33, 0.9)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <h1 className="text-xl font-bold text-primary">Evaluation Unavailable</h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>{error}</p>
          <button 
            onClick={() => router.push('/scenario')} 
            className="mt-4 px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-[0.12em] transition-all duration-200 inline-flex items-center gap-2"
            style={{
              background: 'rgba(79, 124, 255, 0.12)',
              border: '1px solid rgba(79, 124, 255, 0.25)',
              color: 'rgba(165, 184, 255, 0.95)',
              boxShadow: '0 0 20px rgba(79, 124, 255, 0.1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.22)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.4)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(79, 124, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.25)';
              e.currentTarget.style.color = 'rgba(165, 184, 255, 0.95)';
            }}
          >
            <span>Return to Training</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#080D12] text-primary font-sans selection:bg-blue/20 relative">
      
      {/* ── REGION 1: STICKY TOP NAVIGATION BAR (Fixed height flex item) ───── */}
      <header 
        className="shrink-0 z-30 px-6 md:px-8 py-3.5 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(11, 15, 20, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Left: Back to Dashboard + Evaluated Sector Badge */}
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] px-3 py-1.5 rounded-xl transition-all duration-200 group shrink-0"
            style={{
              background: 'rgba(79,124,255,0.08)',
              border: '1px solid rgba(79,124,255,0.18)',
              color: 'rgba(165,184,255,0.85)',
              boxShadow: '0 0 16px rgba(79,124,255,0.05)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(79,124,255,0.14)';
              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.32)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(79,124,255,0.14)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(79,124,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.18)';
              e.currentTarget.style.color = 'rgba(165,184,255,0.85)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(79,124,255,0.05)'
            }}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" style={{ color: 'rgba(165,184,255,0.9)' }} />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <span className="h-4 w-px bg-white/10 hidden sm:inline-block"></span>

          {/* Evaluated Threat Sector Indicator */}
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(141,152,165,0.85)'
            }}
          >
            <SectorIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(165,184,255,0.85)' }} />
            <span className="font-semibold text-primary truncate">{sectorConfig.label}</span>
            <span className="text-[10px] uppercase hidden md:inline" style={{ color: 'rgba(141,152,165,0.5)' }}>· DEBRIEF</span>
          </div>
        </div>

        {/* Center: Training Control Hub Pill Launcher */}
        <div className="flex items-center justify-center">
          <button
            ref={hubLauncherRef}
            onClick={() => setIsHubOpen(prev => !prev)}
            aria-label="Toggle Training Control Hub"
            aria-expanded={isHubOpen}
            aria-controls="hub-drawer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-200 shadow-sm"
            style={isHubOpen
              ? { background: 'rgba(79,124,255,0.16)', border: '1px solid rgba(79,124,255,0.35)', color: '#FFFFFF', boxShadow: '0 0 20px rgba(79,124,255,0.2)' }
              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.7)' }
            }
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(79,124,255,0.9)' }}></span>
            <span className="font-semibold tracking-wider uppercase" style={{ color: 'rgba(165,184,255,0.9)' }}>TRAINING HUB</span>
            <span className="text-muted/40 hidden md:inline">|</span>
            <span className="hidden md:inline" style={{ color: 'rgba(141,152,165,0.6)' }}>READINESS: {readinessScore}%</span>
            <span className="hidden lg:inline text-muted/40">|</span>
            <span className="hidden lg:inline" style={{ color: 'rgba(141,152,165,0.6)' }}>NEXT: {priorityChannel.toUpperCase().replace(/[_-]+/g, ' ')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded hidden sm:inline"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(141,152,165,0.5)' }}>
              H
            </span>
          </button>
        </div>

        {/* Right: Verified Evaluation Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <span 
            className="text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg hidden sm:inline-block"
            style={{ background: 'rgba(79,124,255,0.07)', border: '1px solid rgba(79,124,255,0.15)', color: 'rgba(165,184,255,0.7)' }}
          >
            Verified Debrief
          </span>
        </div>
      </header>

      {/* ── REGION 2: COMPACT DEBRIEF SUMMARY ────── */}
      <main 
        className="flex-1 min-h-0 overflow-hidden px-3 sm:px-6 md:px-8 py-2 sm:py-4"
        tabIndex={0}
        aria-label="Decision Debrief Content"
      >
        <div className="max-w-[1440px] h-full min-h-0 mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div 
                  className="w-10 h-10 rounded-full animate-spin mx-auto"
                  style={{
                    border: '2.5px solid rgba(79,124,255,0.15)',
                    borderTopColor: 'rgba(79,124,255,0.95)',
                    filter: 'drop-shadow(0 0 10px rgba(79,124,255,0.4))'
                  }}
                />
                <p className="text-xs font-mono font-semibold tracking-widest uppercase" style={{ color: 'rgba(165,184,255,0.85)' }}>
                  Generating Decision Debrief...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div 
                className="text-center space-y-4 p-8 rounded-2xl max-w-md w-full"
                style={{
                  background: 'rgba(17,24,33,0.75)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' }}>
                  <span className="text-red-400 text-lg font-bold">!</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Debrief Generation Failed</h4>
                  <p className="text-xs" style={{ color: 'rgba(248,113,113,0.85)' }}>{error}</p>
                </div>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider transition-all duration-200"
                  style={{
                    background: 'rgba(79,124,255,0.12)',
                    border: '1px solid rgba(79,124,255,0.25)',
                    color: 'rgba(165,184,255,0.95)',
                    boxShadow: '0 0 15px rgba(79,124,255,0.15)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(79,124,255,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(79,124,255,0.45)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(79,124,255,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(79,124,255,0.25)';
                    e.currentTarget.style.color = 'rgba(165,184,255,0.95)';
                  }}
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          ) : evaluation ? (
            <EvaluationResults 
              key={scenarioId}
              evaluation={evaluation}
              userAction={userAction}
              userReasoning={userReasoning}
              channel={evaluatedChannel}
              responseTimeSeconds={responseTimeSeconds}
              historicalDelta={historicalDelta}
              backendCoaching={backendCoaching}
              onOpenHub={() => setIsHubOpen(true)}
            />
          ) : null}
        </div>
      </main>

      {/* ── REGION 3: NON-OVERLAPPING BOTTOM ACTION DOCK (shrink-0 layout space) */}
      <EvaluationActionDock
        readinessScore={readinessScore}
        priorityChannel={priorityChannel}
        recommendedSituation={recommendedSituation}
        onRetryScenario={handleRetryScenario}
        onNextChallenge={handleNextChallenge}
        isNavigating={isNavigating}
      />

      {/* ── SLIDE-OVER TRAINING CONTROL HUB DRAWER ────────────────────────── */}
      <ScenarioControlHub
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        activeChannel={activeChannel}
        onSelectSector={handleSelectSector}
        readinessScore={readinessScore}
        completedCount={completedCount}
        secureCount={secureCount}
        priorityChannel={priorityChannel}
        recommendedSituation={recommendedSituation}
        recommendationRationale={recommendationRationale}
        decisionJourney={decisionJourney}
        sectorScores={sectorScores}
        isLoadingTelemetry={isLoadingTelemetry}
        onNavigateOverview={handleNavigateOverview}
        onNavigatePolicies={handleNavigatePolicies}
        launcherRef={hubLauncherRef}
      />

    </div>
  );
}

export default function EvaluationPage() {
  return (
    <Suspense fallback={
      <div className="h-dvh bg-[#080D12] flex flex-col items-center justify-center gap-3 font-mono text-xs" style={{ color: 'rgba(165,184,255,0.7)' }}>
        <div 
          className="w-8 h-8 rounded-full animate-spin"
          style={{
            border: '2px solid rgba(79,124,255,0.15)',
            borderTopColor: 'rgba(79,124,255,0.9)',
            filter: 'drop-shadow(0 0 8px rgba(79,124,255,0.4))'
          }}
        />
        <span className="tracking-wider uppercase">Initializing Decision Debrief Viewport...</span>
      </div>
    }>
      <EvaluationContent />
    </Suspense>
  );
}
