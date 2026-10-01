"use client";
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, 
  HardDrive, ChevronRight, ArrowRight, Shield, CheckCircle2, 
  AlertTriangle, Target, ScrollText, LayoutDashboard, Sparkles
} from 'lucide-react';
import { SECTORS, SectorChannel } from '@/lib/sectors';
import { formatReadiness, getSectorStatus } from '@/lib/scenario_helpers';

export interface DecisionRecord {
  id: number | string;
  title: string;
  threat?: string;
  score?: number;
  status?: string;
  is_safe?: boolean;
  channel?: string;
}

export interface ScenarioControlHubProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannel: string;
  onSelectSector: (channel: SectorChannel) => void;
  readinessScore?: number;
  completedCount?: number;
  secureCount?: number;
  priorityChannel?: string;
  recommendedSituation?: string;
  recommendationRationale?: string;
  decisionJourney?: DecisionRecord[];
  sectorScores?: Record<string, number>;
  isLoadingTelemetry?: boolean;
  onNavigateOverview?: () => void;
  onNavigatePolicies?: () => void;
  launcherRef?: React.RefObject<HTMLElement>;
}

const ICON_COMPONENTS = {
  Phone,
  Mail,
  MessageSquare,
  QrCode,
  Cloud,
  Smartphone,
  HardDrive,
};

export default function ScenarioControlHub({
  isOpen,
  onClose,
  activeChannel,
  onSelectSector,
  readinessScore = 74,
  completedCount = 0,
  secureCount = 0,
  priorityChannel = 'voice_phone',
  recommendedSituation,
  recommendationRationale,
  decisionJourney = [],
  sectorScores = {},
  isLoadingTelemetry = false,
  onNavigateOverview,
  onNavigatePolicies,
  launcherRef,
}: ScenarioControlHubProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const finalReadiness = formatReadiness(readinessScore);
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (circumference * finalReadiness) / 100;

  // Recommended sector resolution
  const recommendedSector = SECTORS.find(s => s.channel === priorityChannel) || SECTORS[0];
  const targetSituationTitle = recommendedSituation || recommendedSector.recommendedSituation;
  const targetRationale = recommendationRationale || `Prioritize defense verification for ${recommendedSector.label}.`;

  // Focus management: Trap focus & Auto-focus close button when opened
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Trap focus inside drawer
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Return focus to launcher
      launcherRef?.current?.focus();
    };
  }, [isOpen, launcherRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            key="hub-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 z-40 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Modal */}
          <motion.div
            key="hub-drawer"
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-[540px] flex flex-col font-sans"
            style={{
              background: 'rgba(11, 15, 20, 0.96)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '-16px 0 50px rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(24px)'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hub-title"
          >
            {/* 1. Header */}
            <div 
              className="shrink-0 px-6 py-4 flex items-center justify-between"
              style={{
                background: 'rgba(11, 15, 20, 0.85)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(79, 124, 255, 0.1)',
                    border: '1px solid rgba(79, 124, 255, 0.22)',
                    color: 'rgba(165, 184, 255, 0.95)'
                  }}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="hub-title" className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                    TRAINING CONTROL HUB
                  </h2>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.75)' }}>
                    Real-time defense readiness & threat sectors
                  </p>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close Hub"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(141, 152, 165, 0.7)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.3)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.background = 'rgba(79, 124, 255, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = 'rgba(141, 152, 165, 0.7)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Scrollable Body Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
              
              {/* Telemetry Gauge & Counts */}
              <div 
                className="p-5 rounded-2xl flex items-center justify-between gap-6 shadow-sm"
                style={{
                  background: 'rgba(17, 24, 33, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Circular Gauge */}
                <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="hubRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(79, 124, 255, 0.6)" />
                        <stop offset="100%" stopColor="rgba(165, 184, 255, 0.9)" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r={r}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={r}
                      fill="transparent"
                      stroke="url(#hubRingGrad)"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold tracking-tight text-primary leading-none">
                      {finalReadiness}%
                    </span>
                    <span className="text-[8px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>
                      INDEX
                    </span>
                  </div>
                </div>

                {/* Counts & Summary */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[9px] font-mono font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                        style={{
                          background: 'rgba(79, 124, 255, 0.08)',
                          border: '1px solid rgba(79, 124, 255, 0.18)',
                          color: 'rgba(165, 184, 255, 0.85)'
                        }}
                      >
                        Active Defense Posture
                      </span>
                      {isLoadingTelemetry && (
                        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: 'rgba(79, 124, 255, 0.9)' }}></span>
                      )}
                    </div>
                    <p className="text-xs text-primary/80 mt-1 font-medium leading-relaxed">
                      Multi-vector threat resilience calculated across simulated attack channels.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div 
                      className="px-3 py-2 rounded-xl"
                      style={{
                        background: 'rgba(11, 15, 20, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <p className="text-[9px] font-mono uppercase" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>Completed</p>
                      <p className="text-base font-bold font-mono text-primary leading-tight mt-0.5">{completedCount}</p>
                    </div>
                    <div 
                      className="px-3 py-2 rounded-xl"
                      style={{
                        background: 'rgba(11, 15, 20, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <p className="text-[9px] font-mono uppercase" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>Secure Decided</p>
                      <p className="text-base font-bold font-mono leading-tight mt-0.5" style={{ color: 'rgba(165, 184, 255, 0.95)' }}>{secureCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coach Recommendation Card */}
              <div 
                className="p-4 rounded-2xl space-y-3 relative overflow-hidden transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 124, 255, 0.12) 0%, rgba(17, 24, 33, 0.9) 100%)',
                  border: '1px solid rgba(79, 124, 255, 0.22)',
                  boxShadow: '0 8px 24px rgba(79, 124, 255, 0.08)'
                }}
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(79, 124, 255, 0.45), transparent)' }} 
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.9)' }} />
                    <span 
                      className="text-[9px] font-mono font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(165, 184, 255, 0.9)' }}
                    >
                      COACH TARGET RECOMMENDATION
                    </span>
                  </div>
                  <span 
                    className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                    style={{
                      background: 'rgba(79, 124, 255, 0.1)',
                      border: '1px solid rgba(79, 124, 255, 0.2)',
                      color: 'rgba(165, 184, 255, 0.8)'
                    }}
                  >
                    Priority
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-primary">
                    {targetSituationTitle} ({recommendedSector.label})
                  </h3>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
                    {targetRationale}
                  </p>
                </div>

                <button
                  onClick={() => onSelectSector(recommendedSector.channel)}
                  className="w-full py-2 px-3 rounded-xl font-mono text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 group"
                  style={{
                    background: 'rgba(79, 124, 255, 0.1)',
                    border: '1px solid rgba(79, 124, 255, 0.22)',
                    color: 'rgba(165, 184, 255, 0.85)',
                    boxShadow: '0 0 20px rgba(79, 124, 255, 0.08)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(79, 124, 255, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.38)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(79, 124, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.22)';
                    e.currentTarget.style.color = 'rgba(165, 184, 255, 0.85)';
                  }}
                >
                  <span>Launch Recommended Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: 'rgba(165, 184, 255, 0.85)' }} />
                </button>
              </div>

              {/* Threat Sectors List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
                    Threat Defense Sectors
                  </h3>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(141, 152, 165, 0.55)' }}>
                    Click row to switch challenge
                  </span>
                </div>

                <div className="space-y-2">
                  {SECTORS.map((sec) => {
                    const Icon = ICON_COMPONENTS[sec.iconName] || Shield;
                    const isActive = sec.channel === activeChannel;
                    const score = sectorScores[sec.channel] || 0;
                    const isPriority = sec.channel === priorityChannel;
                    const status = getSectorStatus(sec.channel, activeChannel, isPriority, score);

                    return (
                      <button
                        key={sec.channel}
                        onClick={() => onSelectSector(sec.channel)}
                        className="w-full p-3 rounded-xl text-left flex items-center justify-between gap-3.5 transition-all duration-200 group"
                        style={isActive
                          ? {
                              background: 'rgba(79, 124, 255, 0.1)',
                              border: '1px solid rgba(79, 124, 255, 0.35)',
                              boxShadow: '0 0 24px rgba(79, 124, 255, 0.12)'
                            }
                          : {
                              background: 'rgba(17, 24, 33, 0.6)',
                              border: '1px solid rgba(255, 255, 255, 0.07)'
                            }
                        }
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.25)';
                            e.currentTarget.style.background = 'rgba(17, 24, 33, 0.85)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                            e.currentTarget.style.background = 'rgba(17, 24, 33, 0.6)';
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                            style={isActive
                              ? {
                                  background: 'rgba(79, 124, 255, 0.2)',
                                  border: '1px solid rgba(79, 124, 255, 0.4)',
                                  color: '#FFFFFF'
                                }
                              : {
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid rgba(255, 255, 255, 0.07)',
                                  color: 'rgba(141, 152, 165, 0.65)'
                                }
                            }
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isActive ? 'text-primary' : 'text-primary/90'
                                }`}
                              >
                                {sec.label}
                              </span>

                              {/* Status Badges */}
                              {status === 'ACTIVE' && (
                                <span 
                                  className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                                  style={{
                                    background: 'rgba(79, 124, 255, 0.16)',
                                    border: '1px solid rgba(79, 124, 255, 0.35)',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  Active
                                </span>
                              )}
                              {status === 'PRIORITY' && !isActive && (
                                <span 
                                  className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                                  style={{
                                    background: 'rgba(79, 124, 255, 0.1)',
                                    border: '1px solid rgba(79, 124, 255, 0.2)',
                                    color: 'rgba(165, 184, 255, 0.8)'
                                  }}
                                >
                                  Priority
                                </span>
                              )}
                              {status === 'MASTERED' && !isActive && (
                                <span 
                                  className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(180, 200, 180, 0.7)'
                                  }}
                                >
                                  Mastered
                                </span>
                              )}
                              {status === 'WEAK' && !isActive && (
                                <span 
                                  className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.07)',
                                    color: 'rgba(141, 152, 165, 0.6)'
                                  }}
                                >
                                  Needs Work
                                </span>
                              )}
                              {status === 'NEW' && !isActive && (
                                <span 
                                  className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: 'rgba(141, 152, 165, 0.6)'
                                  }}
                                >
                                  New
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>
                              {sec.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-mono font-semibold" style={{ color: 'rgba(165, 184, 255, 0.85)' }}>
                            {score > 0 ? `${score}%` : '—'}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${
                              isActive ? 'text-white' : 'text-muted/60'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Decision History Timeline */}
              <div className="space-y-3 pt-1">
                <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: 'rgba(141, 152, 165, 0.85)' }}>
                  Recent Decision Timeline
                </h3>

                {decisionJourney.length === 0 ? (
                  <div 
                    className="p-4 rounded-xl text-center"
                    style={{
                      background: 'rgba(17, 24, 33, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <p className="text-xs font-mono" style={{ color: 'rgba(141, 152, 165, 0.65)' }}>
                      No decisions logged yet. Complete your current scenario to record evaluation telemetry.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {decisionJourney.slice(0, 4).map((record, i) => (
                      <div
                        key={record.id || i}
                        className="p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                        style={{
                          background: 'rgba(17, 24, 33, 0.55)',
                          border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-primary truncate">{record.title}</p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(141, 152, 165, 0.6)' }}>
                            {record.threat || 'Threat Evaluation'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={record.is_safe !== false
                              ? {
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  color: '#34D399'
                                }
                              : {
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#F87171'
                                }
                            }
                          >
                            {record.is_safe !== false ? 'SECURE' : 'COMPROMISED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Pinned Reachable Footer */}
            <div 
              className="shrink-0 px-6 py-3.5 flex items-center justify-between gap-3"
              style={{
                background: 'rgba(11, 15, 20, 0.92)',
                borderTop: '1px solid rgba(255, 255, 255, 0.07)'
              }}
            >
              <div className="flex items-center gap-2">
                {onNavigateOverview && (
                  <button
                    onClick={onNavigateOverview}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      color: 'rgba(141, 152, 165, 0.75)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(79, 124, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.25)';
                      e.currentTarget.style.color = '#E8EDF2';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.color = 'rgba(141, 152, 165, 0.75)'
                    }}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.85)' }} />
                    <span>Overview</span>
                  </button>
                )}
                {onNavigatePolicies && (
                  <button
                    onClick={onNavigatePolicies}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      color: 'rgba(141, 152, 165, 0.75)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(79, 124, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.25)';
                      e.currentTarget.style.color = '#E8EDF2';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                      e.currentTarget.style.color = 'rgba(141, 152, 165, 0.75)'
                    }}
                  >
                    <ScrollText className="w-3.5 h-3.5" style={{ color: 'rgba(165, 184, 255, 0.85)' }} />
                    <span>Policies</span>
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-mono uppercase tracking-[0.1em] transition-all ml-auto"
                style={{
                  background: 'rgba(79, 124, 255, 0.08)',
                  border: '1px solid rgba(79, 124, 255, 0.18)',
                  color: 'rgba(165, 184, 255, 0.85)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(79, 124, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.32)';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(79, 124, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(79, 124, 255, 0.18)';
                  e.currentTarget.style.color = 'rgba(165, 184, 255, 0.85)';
                }}
              >
                Close Hub
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
