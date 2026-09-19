"use client";
import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import { 
  Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, 
  HardDrive, Shield, AlertTriangle, X, ArrowRight, ArrowLeft, CornerDownLeft, 
  RotateCcw, Sparkles 
} from 'lucide-react';
import ChannelRenderer from '@/components/simulation/ChannelRenderer';
import ScenarioControlHub, { DecisionRecord } from '@/components/simulation/ScenarioControlHub';
import { SECTORS, getSectorConfig, SectorChannel } from '@/lib/sectors';
import { shouldIgnoreKeyboardEvent, hasUnsavedProgress, formatReadiness } from '@/lib/scenario_helpers';

type ScenarioState = 'INTRO' | 'OBSERVE' | 'DECIDE' | 'REASONING';

interface ScenarioContent {
  situation_title?: string;
  situation_tagline?: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  body?: string;
  choices?: string[];
  threat_type?: string;
  difficulty?: string;
  channel?: string;
  channel_data?: any;
}

const ICON_MAP = {
  Phone,
  Mail,
  MessageSquare,
  QrCode,
  Cloud,
  Smartphone,
  HardDrive,
};

function ScenarioFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Channel & Sector Resolution
  const rawChannel = searchParams.get('channel') || 'cloud_oauth';
  const sectorConfig = getSectorConfig(rawChannel);
  const activeChannel = sectorConfig.channel;

  // Scenario & Flow State
  const [currentState, setCurrentState] = useState<ScenarioState>('INTRO');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string>('');
  const scenarioStartTimeRef = useRef<number | null>(null);

  const [scenario, setScenario] = useState<ScenarioContent>({
    situation_title: "Cloud & OAuth Consent Verification",
    situation_tagline: "Third-party authorization requests often exploit brand trust to gain persistent cloud scopes.",
    sender_name: "CloudSync Office Suite 2026",
    sender_email: "oauth-verifier@novasync-directory.internal",
    subject: "Third-Party Application Permission Request",
    body: "An external cloud integration is requesting read, update, and offline access tokens for your corporate mailbox and OneDrive storage.",
    choices: [
      "Grant consent to keep corporate synchronization active",
      "Deny access and report the untrusted application to IT Security",
      "Approve only offline tokens and test file sync",
      "Ignore the consent request"
    ],
    threat_type: "Illicit Consent Grant / OAuth Abuse",
    difficulty: "beginner",
    channel: activeChannel,
    channel_data: {
      app_name: "CloudSync Office Suite 2026",
      publisher: "Unverified Third-Party Developer (cloudsync-portal.io)",
      requested_scopes: [
        "Read, update, and delete all corporate email messages",
        "Access corporate OneDrive / Google Drive files offline",
        "Maintain access to data you have given it permission to view"
      ]
    }
  });

  // Hub Drawer & Confirmation State
  const [isHubOpen, setIsHubOpen] = useState(false);
  const hubLauncherRef = useRef<HTMLButtonElement>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  // AbortController ref to prevent race conditions during rapid sector switching
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch Dynamic Telemetry from /api/coach/dashboard-summary
  useEffect(() => {
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
            setRecommendationRationale(`Focus on target defense vector: ${d.next_situation.tactic_target.replace('_', ' ')}.`);
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
        // Fallback to local profile cache
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

  // 2. Load Scenario Data for active channel with AbortController race protection
  const fetchScenario = useCallback((targetChannel: string) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingScenario(true);
    setScenarioError(null);

    let userRole = "Finance Manager";
    let difficulty = searchParams.get('difficulty') || "beginner";
    let topic = searchParams.get('topic') || undefined;
    let userId = "11111111-1111-1111-1111-111111111111";
    let company = "NovaTech";

    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('cyberguard_user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role) userRole = u.role;
          if (u.id) userId = u.id;
          if (u.company) company = u.company;
          if (u.learning_profile?.next_difficulty && !searchParams.get('difficulty')) {
            difficulty = u.learning_profile.next_difficulty;
          }
          if (u.learning_profile?.next_focus && !topic) {
            topic = u.learning_profile.next_focus;
          }
        } catch (_) {}
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;
    if (!token) {
      router.replace('/login');
      setIsLoadingScenario(false);
      return;
    }

    fetch('http://localhost:8000/api/generate-scenario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        user_id: userId,
        role: userRole,
        difficulty: difficulty,
        company: company,
        channel: targetChannel,
        topic
      })
    })
      .then(async res => {
        if (res.status === 401) {
          router.replace('/login');
          throw new Error('Your session expired. Please sign in again.');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Unable to generate scenario');
        return data;
      })
      .then(data => {
        if (data.status === 'success' && data.scenario) {
          setScenarioId(data.scenario_id);
          setScenario(data.scenario);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setScenarioError(err.message || 'Unable to load a verified scenario.');
      })
      .finally(() => {
        setIsLoadingScenario(false);
      });
  }, [searchParams]);

  // Trigger scenario load on channel change
  useEffect(() => {
    fetchScenario(activeChannel);
    scenarioStartTimeRef.current = null;
  }, [activeChannel, fetchScenario]);

  // Start monotonic timer when scenario becomes visible in OBSERVE
  useEffect(() => {
    if (currentState === 'OBSERVE' && scenarioStartTimeRef.current === null) {
      scenarioStartTimeRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
  }, [currentState]);

  // 3. Unsaved Progress Guard Helper
  const safeNavigate = (action: () => void) => {
    if (hasUnsavedProgress(currentState, selectedChoice, reasoning)) {
      setPendingAction(() => action);
      setShowConfirmDialog(true);
    } else {
      action();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmDialog(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  // 4. In-Place Sector Switching
  const handleSelectSector = (targetSector: SectorChannel) => {
    if (targetSector === activeChannel) {
      setIsHubOpen(false);
      return;
    }

    safeNavigate(() => {
      setIsHubOpen(false);
      setSelectedChoice(null);
      setReasoning('');
      setCurrentState('OBSERVE'); // Transition directly to OBSERVE for fast sector switching
      router.push(`/scenario?channel=${targetSector}`, { scroll: false });
    });
  };

  // 5. Navigation Handlers
  const handleExit = () => {
    safeNavigate(() => {
      router.push('/dashboard');
    });
  };

  const handleNavigateBrand = () => {
    safeNavigate(() => {
      router.push('/dashboard');
    });
  };

  const handleNavigateOverview = () => {
    safeNavigate(() => {
      setIsHubOpen(false);
      router.push('/dashboard?tab=overview');
    });
  };

  const handleNavigatePolicies = () => {
    safeNavigate(() => {
      setIsHubOpen(false);
      router.push('/policies');
    });
  };

  // 6. Decision & Reasoning Handlers
  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
    setTimeout(() => setCurrentState('REASONING'), 500);
  };

  const submitReasoning = () => {
    if (!reasoning.trim() || !selectedChoice) return;
    if (!scenarioId) {
      setScenarioError('A verified scenario must load before you can submit a decision.');
      return;
    }
    setIsSubmitting(true);

    const elapsedSeconds = scenarioStartTimeRef.current
      ? Math.max(1, Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - scenarioStartTimeRef.current) / 1000))
      : null;

    const decisionPayload = {
      scenario_id: scenarioId,
      scenario_text: `${scenario.subject || ''}: ${scenario.body || ''}`,
      sender_email: scenario.sender_email,
      threat_type: scenario.threat_type || 'Business Email Compromise',
      user_action: selectedChoice,
      user_reasoning: reasoning,
      channel: scenario.channel || activeChannel,
      response_time_seconds: elapsedSeconds
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('cyberguard_current_decision', JSON.stringify(decisionPayload));
    }

    setTimeout(() => {
      router.push(`/evaluation?scenario_id=${encodeURIComponent(scenarioId)}&choice=${encodeURIComponent(selectedChoice)}`);
    }, 500);
  };

  // 7. Keyboard Navigation with Strict Guards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(e)) return;

      // Escape: Layered dismissal
      if (e.key === 'Escape') {
        if (showConfirmDialog) {
          e.preventDefault();
          handleCancelDiscard();
          return;
        }
        if (isHubOpen) {
          e.preventDefault();
          setIsHubOpen(false);
          return;
        }
      }

      // H Key: Toggle Training Control Hub
      if (e.key === 'h' || e.key === 'H') {
        if (!showConfirmDialog) {
          e.preventDefault();
          setIsHubOpen(prev => !prev);
        }
      }

      // Enter Key: Advance from OBSERVE to DECIDE
      if (e.key === 'Enter') {
        if (currentState === 'OBSERVE' && !isHubOpen && !showConfirmDialog) {
          e.preventDefault();
          setCurrentState('DECIDE');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentState, isHubOpen, showConfirmDialog]);

  // Current Sector Icon
  const SectorIcon = ICON_MAP[sectorConfig.iconName] || Shield;

  // Contextual Channel Header
  const getChannelHeader = () => {
    switch (activeChannel) {
      case 'cloud_oauth':
        return {
          label: 'CLOUD IDENTITY CONSENT',
          title: 'An application is requesting persistent enterprise access.',
          dockPrompt: 'Review the requested permission scopes and application publisher status.'
        };
      case 'voice_phone':
        return {
          label: 'INCOMING TELEPHONY INTERCEPT',
          title: 'An urgent voicemail was left on your direct extension.',
          dockPrompt: 'Inspect the caller identity, claimed emergency, and dual-control bypass cues.'
        };
      case 'slack_teams':
        return {
          label: 'INTERNAL WORKSPACE MESSAGE',
          title: 'A direct message just arrived in your collaboration workspace.',
          dockPrompt: 'Inspect the sender handle and embedded external URL.'
        };
      case 'qr_code':
        return {
          label: 'PHYSICAL ENVIRONMENT NOTICE',
          title: 'A printed workplace advisory was discovered on the floor.',
          dockPrompt: 'Examine the destination URL encoded in the physical QR pattern.'
        };
      case 'sms_push':
        return {
          label: 'MOBILE AUTHENTICATOR PUSH',
          title: 'Repeated sign-in requests are bombarding your mobile device.',
          dockPrompt: 'Verify the IP geolocation and unauthorized login attempt context.'
        };
      case 'physical_media':
        return {
          label: 'PHYSICAL MEDIA INCIDENT',
          title: 'An untrusted removable drive was plugged into the workstation.',
          dockPrompt: 'Examine the physical labeling and OS auto-run prompt.'
        };
      case 'email':
      default:
        return {
          label: 'INCOMING MESSAGE',
          title: 'An email just arrived in your corporate inbox.',
          dockPrompt: 'Review the sender domain, urgency cues, and requested actions.'
        };
    }
  };

  const channelMeta = getChannelHeader();

  // Animations
  const pageVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }
  };

  return (
    <main className="h-dvh flex flex-col overflow-hidden bg-[#080D12] text-primary font-sans selection:bg-blue/20 relative">

      {/* ── REGION 1: STICKY TOP NAVIGATION BAR ───────────────────────────── */}
      <header 
        className="shrink-0 border-b z-20 px-6 md:px-8 py-3.5 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(11,15,20,0.85)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Left: Back to Dashboard & Sector Label */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={handleExit}
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
              e.currentTarget.style.boxShadow = '0 0 16px rgba(79,124,255,0.05)';
            }}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" style={{ color: 'rgba(165,184,255,0.9)' }} />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>

          <span className="h-4 w-px bg-white/10 hidden sm:inline-block"></span>

          {/* Current Threat Sector Indicator */}
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
            <span className="hidden lg:inline" style={{ color: 'rgba(141,152,165,0.6)' }}>NEXT: {priorityChannel.toUpperCase().replace('_', ' ')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded hidden sm:inline"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(141,152,165,0.5)' }}>
              H
            </span>
          </button>
        </div>

        {/* Right: Difficulty & Exit Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <span 
            className="text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg hidden sm:inline-block"
            style={{ background: 'rgba(79,124,255,0.07)', border: '1px solid rgba(79,124,255,0.15)', color: 'rgba(165,184,255,0.7)' }}
          >
            Tier: {scenario.difficulty || 'beginner'}
          </span>

          <button
            onClick={handleExit}
            aria-label="Exit Scenario"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.6)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(217,104,104,0.35)';
              e.currentTarget.style.color = '#E2847A';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = 'rgba(141,152,165,0.6)';
            }}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>


      {/* ── REGION 2: INDEPENDENTLY SCROLLABLE CONTENT VIEWPORT ───────────── */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto"
        tabIndex={0}
        aria-label="Scenario content viewport"
      >
        <div className="max-w-3xl mx-auto px-6 pt-6 pb-20">
          <AnimatePresence mode="wait">
            
            {/* 1. INTRO STATE */}
            {currentState === 'INTRO' && (
              <motion.div
                key="intro"
                variants={pageVariants} initial="initial" animate="animate" exit="exit"
                className="flex flex-col items-center justify-center min-h-[60vh] text-center py-8"
              >
                <p 
                  className="text-xs font-mono uppercase tracking-[0.16em] px-3 py-1 rounded-full mb-6"
                  style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.85)' }}
                >
                  ◉ SITUATION CHALLENGE · {sectorConfig.label.toUpperCase()}
                </p>

                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight mb-8">
                  {scenario.situation_tagline || "Not everything urgent deserves an immediate response."}
                </h1>

                <p className="text-base text-muted font-medium mb-12 max-w-xl">
                  Take a moment. Examine the lure, author identity, and requested privileges carefully.
                </p>

                <button
                  onClick={() => setCurrentState('OBSERVE')}
                  className="font-mono uppercase tracking-[0.12em] text-xs px-8 py-3.5 rounded-xl transition-all duration-200 inline-flex items-center gap-2 group"
                  style={{
                    background: 'rgba(79,124,255,0.1)',
                    border: '1px solid rgba(79,124,255,0.22)',
                    color: 'rgba(165,184,255,0.85)',
                    boxShadow: '0 0 20px rgba(79,124,255,0.08)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(79,124,255,0.18)';
                    e.currentTarget.style.borderColor = 'rgba(79,124,255,0.38)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(79,124,255,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(79,124,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                    e.currentTarget.style.color = 'rgba(165,184,255,0.85)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(79,124,255,0.08)'
                  }}
                >
                  <span>Begin Observation</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'rgba(165,184,255,0.85)' }} />
                </button>
              </motion.div>
            )}

            {/* 2. OBSERVE STATE - Channel Simulation Card */}
            {currentState === 'OBSERVE' && (
              <motion.div
                key="observe"
                variants={pageVariants} initial="initial" animate="animate" exit="exit"
                className="space-y-6"
              >
                {/* Header Subtitle */}
                <div className="text-center space-y-2 pb-2">
                  <span 
                    className="text-[10px] font-mono uppercase tracking-[0.16em] px-2.5 py-0.5 rounded-md inline-block"
                    style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.85)' }}
                  >
                    {channelMeta.label}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                    {channelMeta.title}
                  </h2>
                </div>

                {/* Inline Notice if API latency fallback */}
                {scenarioError && (
                  <div 
                    className="p-3.5 rounded-xl text-xs font-mono flex items-center justify-between"
                    style={{ background: 'rgba(214,167,86,0.1)', border: '1px solid rgba(214,167,86,0.25)', color: 'rgba(214,167,86,0.9)' }}
                  >
                    <span>{scenarioError}</span>
                    <button 
                      onClick={() => fetchScenario(activeChannel)}
                      className="underline hover:text-primary flex items-center gap-1"
                      style={{ color: 'rgba(165,184,255,0.85)' }}
                    >
                      <RotateCcw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}

                {/* Simulation Canvas */}
                <div className="w-full">
                  {isLoadingScenario ? (
                    <div 
                      className="w-full p-16 rounded-2xl text-center space-y-4"
                      style={{ background: 'rgba(17,24,33,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-t-cyan animate-spin mx-auto" style={{ borderColor: 'rgba(79,124,255,0.3)', borderTopColor: 'rgba(165,184,255,0.9)' }}></div>
                      <p className="text-xs font-mono text-muted uppercase tracking-wider">
                        Generating situational threat model for {sectorConfig.label}...
                      </p>
                    </div>
                  ) : (
                    <ChannelRenderer scenario={scenario} />
                  )}
                </div>

                {/* Inline Action Bar (Directly below simulation) */}
                <div 
                  className="mt-6 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    background: 'rgba(17,24,33,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  <div className="flex items-center gap-2.5 text-xs font-mono text-muted text-center sm:text-left">
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'rgba(165,184,255,0.9)' }} />
                    <span>{channelMeta.dockPrompt}</span>
                  </div>
                  <button
                    onClick={() => setCurrentState('DECIDE')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-2 shrink-0"
                    style={{
                      background: 'rgba(79,124,255,0.12)',
                      border: '1px solid rgba(79,124,255,0.25)',
                      color: 'rgba(165,184,255,0.9)',
                      boxShadow: '0 0 20px rgba(79,124,255,0.15)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(79,124,255,0.22)';
                      e.currentTarget.style.borderColor = 'rgba(79,124,255,0.4)';
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(79,124,255,0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(79,124,255,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(79,124,255,0.25)';
                      e.currentTarget.style.color = 'rgba(165,184,255,0.9)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(79,124,255,0.15)';
                    }}
                  >
                    <span>Continue to Decision</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(165,184,255,0.7)' }}>
                      ↵ ENTER
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. DECIDE STATE - 4 Adaptive Action Choices */}
            {currentState === 'DECIDE' && (
              <motion.div
                key="decide"
                variants={pageVariants} initial="initial" animate="animate" exit="exit"
                className="space-y-8 py-4"
              >
                <div className="text-center space-y-2">
                  <span 
                    className="text-[10px] font-mono uppercase tracking-[0.16em] px-2.5 py-0.5 rounded-md inline-block"
                    style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.85)' }}
                  >
                    DECISION POINT
                  </span>
                  <h2 className="text-3xl font-bold tracking-tight text-primary">
                    What is your immediate response?
                  </h2>
                  <p className="text-sm text-muted">
                    Select the option that best protects organization assets and follows policy.
                  </p>
                </div>

                <div className="space-y-3">
                  {(scenario.choices || []).map((choice, i) => {
                    const isSelected = selectedChoice === choice;
                    return (
                      <button
                        key={i}
                        onClick={() => handleChoice(choice)}
                        className="w-full p-4 rounded-xl text-left flex items-center gap-4 transition-all duration-200 group"
                        style={isSelected
                          ? {
                              background: 'rgba(79,124,255,0.08)',
                              border: '1px solid rgba(79,124,255,0.35)',
                              boxShadow: '0 0 24px rgba(79,124,255,0.12)'
                            }
                          : {
                              background: 'rgba(17,24,33,0.6)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              backdropFilter: 'blur(12px)'
                            }
                        }
                        onMouseEnter={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'rgba(79,124,255,0.25)';
                            e.currentTarget.style.background = 'rgba(17,24,33,0.85)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.background = 'rgba(17,24,33,0.6)';
                          }
                        }}
                      >
                        <span 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-all"
                          style={isSelected
                            ? { background: 'rgba(79,124,255,0.22)', border: '1px solid rgba(79,124,255,0.45)', color: '#FFFFFF', boxShadow: '0 0 12px rgba(79,124,255,0.3)' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.5)' }
                          }
                        >
                          0{i + 1}
                        </span>
                        <span className={`text-sm md:text-base font-medium leading-snug flex-1 transition-colors ${
                          isSelected ? 'text-primary font-semibold' : 'text-primary/80 group-hover:text-primary'
                        }`}>
                          {choice}
                        </span>
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                          style={isSelected
                            ? { background: 'rgba(79,124,255,0.3)', border: '2px solid rgba(165,184,255,0.9)' }
                            : { border: '1px solid rgba(255,255,255,0.15)' }
                          }
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full" style={{ background: '#FFFFFF' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Inline Action Navigation Below Choices */}
                <div 
                  className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <button
                    onClick={() => setCurrentState('OBSERVE')}
                    className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors py-2 px-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(141,152,165,0.6)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E8EDF2'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(141,152,165,0.6)'}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Review Simulation Observation</span>
                  </button>

                  {selectedChoice ? (
                    <button
                      onClick={() => setCurrentState('REASONING')}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-mono text-xs uppercase tracking-[0.12em] transition-all duration-200 flex items-center justify-center gap-2 group"
                      style={{
                        background: 'rgba(79,124,255,0.12)',
                        border: '1px solid rgba(79,124,255,0.25)',
                        color: 'rgba(165,184,255,0.9)',
                        boxShadow: '0 0 20px rgba(79,124,255,0.1)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(79,124,255,0.22)';
                        e.currentTarget.style.borderColor = 'rgba(79,124,255,0.4)';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 24px rgba(79,124,255,0.22)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(79,124,255,0.12)';
                        e.currentTarget.style.borderColor = 'rgba(79,124,255,0.25)';
                        e.currentTarget.style.color = 'rgba(165,184,255,0.9)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(79,124,255,0.1)';
                      }}
                    >
                      <span>Explain Defensive Reasoning</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'rgba(165,184,255,0.9)' }} />
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-muted/50 italic">
                      Select an option above to proceed
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {/* 4. REASONING STATE */}
            {currentState === 'REASONING' && (
              <motion.div
                key="reasoning"
                variants={pageVariants} initial="initial" animate="animate" exit="exit"
                className="space-y-8 py-4 text-center"
              >
                <div className="space-y-2">
                  <span 
                    className="text-[10px] font-mono uppercase tracking-[0.16em] px-2.5 py-0.5 rounded-md inline-block"
                    style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.85)' }}
                  >
                    DEFENSIVE REASONING
                  </span>
                  
                  {/* Selected Choice Reminder Box */}
                  <div 
                    className="p-4 rounded-2xl max-w-xl mx-auto text-left relative overflow-hidden"
                    style={{
                      background: 'rgba(17,24,33,0.7)',
                      border: '1px solid rgba(79,124,255,0.2)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.2)', color: 'rgba(165,184,255,0.85)' }}>
                        Selected Action
                      </span>
                      <button
                        onClick={() => setCurrentState('DECIDE')}
                        className="text-[10px] font-mono text-muted hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <span>Change choice</span>
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[13px] font-medium text-primary leading-snug">
                      {selectedChoice}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-primary">
                    Why did you make this decision?
                  </h2>
                  <p className="text-sm text-muted max-w-md mx-auto">
                    Explain the specific clues, warning signs, or corporate policies that guided your judgment.
                  </p>
                </div>

                <div className="max-w-xl mx-auto text-left space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                    <span>Defensive Analysis & Indicators</span>
                    <span>{reasoning.length} characters</span>
                  </div>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="I noticed the anomalous sender domain, the artificial urgency attempting to bypass dual-control checks, and the broad OAuth consent scopes..."
                    rows={4}
                    className="w-full p-4 rounded-2xl text-primary text-sm leading-relaxed resize-none transition-all outline-none"
                    style={{
                      background: 'rgba(11,15,20,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(12px)'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(79,124,255,0.45)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    autoFocus
                  />
                </div>

                {/* Inline Action Buttons */}
                <div 
                  className="pt-4 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <button
                    onClick={() => setCurrentState('DECIDE')}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-primary transition-colors py-2 px-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Choice</span>
                  </button>

                  <button
                    onClick={submitReasoning}
                    disabled={!reasoning.trim() || isSubmitting}
                    className="w-full sm:w-auto px-7 py-2.5 rounded-xl font-mono text-xs uppercase tracking-[0.12em] transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
                    style={{
                      background: 'rgba(79,124,255,0.14)',
                      border: '1px solid rgba(79,124,255,0.28)',
                      color: 'rgba(165,184,255,0.95)',
                      boxShadow: '0 0 20px rgba(79,124,255,0.12)'
                    }}
                    onMouseEnter={e => {
                      if (reasoning.trim() && !isSubmitting) {
                        e.currentTarget.style.background = 'rgba(79,124,255,0.24)';
                        e.currentTarget.style.borderColor = 'rgba(79,124,255,0.45)';
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 0 24px rgba(79,124,255,0.25)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(79,124,255,0.14)';
                      e.currentTarget.style.borderColor = 'rgba(79,124,255,0.28)';
                      e.currentTarget.style.color = 'rgba(165,184,255,0.95)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(79,124,255,0.12)';
                    }}
                  >
                    <span>{isSubmitting ? 'Evaluating with AI Agent...' : 'Submit Evaluation'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'rgba(165,184,255,0.95)' }} />
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>


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


      {/* ── UNSAVED PROGRESS CONFIRMATION MODAL ───────────────────────────── */}
      <AnimatePresence>
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelDiscard}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md p-6 rounded-2xl space-y-4 font-sans z-10"
              style={{
                background: 'rgba(17, 24, 33, 0.96)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                boxShadow: '0 24px 80px rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(20px)'
              }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
            >
              <div className="flex items-center gap-3" style={{ color: '#FBBF24' }}>
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#FBBF24'
                  }}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="confirm-title" className="text-sm font-bold text-primary">
                    Switch Sector Challenge?
                  </h3>
                  <p className="text-xs font-mono" style={{ color: 'rgba(141, 152, 165, 0.7)' }}>Unsaved Decision In Progress</p>
                </div>
              </div>

              <p id="confirm-desc" className="text-xs leading-relaxed text-primary/80">
                You have selected a decision or started typing reasoning for this scenario. Switching sectors or exiting now will discard your in-progress answer.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCancelDiscard}
                  className="px-4 py-2 rounded-xl text-xs font-mono transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: 'rgba(141, 152, 165, 0.7)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(141, 152, 165, 0.7)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-200"
                  style={{
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.24)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.45)';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.14)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.color = '#F87171';
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(239, 68, 68, 0.1)';
                  }}
                >
                  Discard & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

export default function CinematicScenario() {
  return (
    <Suspense fallback={
      <div className="h-dvh bg-[#080D12] flex items-center justify-center text-muted font-mono text-xs">
        Initializing Midnight Intelligence Viewport...
      </div>
    }>
      <ScenarioFlow />
    </Suspense>
  );
}
