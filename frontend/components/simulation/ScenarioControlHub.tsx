"use client";
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, 
  HardDrive, ChevronRight, ArrowRight, Shield, CheckCircle2, 
  AlertTriangle, Target, ScrollText, LayoutDashboard
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
  const strokeDashoffset = 283 - (283 * finalReadiness) / 100;

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
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 transition-opacity"
            aria-hidden="true"
          />

          {/* Slide-over Drawer Modal */}
          <motion.div
            key="hub-drawer"
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-[560px] bg-[#0A0E14] border-l border-[#1E293B] shadow-2xl flex flex-col font-sans"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hub-title"
          >
            {/* 1. Header */}
            <div className="shrink-0 px-6 py-4 border-b border-[#1E293B] bg-[#080D12] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="hub-title" className="text-xs font-mono font-bold tracking-widest text-primary uppercase">
                    TRAINING CONTROL HUB
                  </h2>
                  <p className="text-[11px] text-muted font-mono">
                    Real-time defense readiness & threat sectors
                  </p>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close Hub"
                className="w-8 h-8 rounded-lg bg-surface border border-primary/10 hover:border-primary/30 text-muted hover:text-primary flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-cyan/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Scrollable Body Content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
              
              {/* Telemetry Gauge & Counts */}
              <div className="p-5 rounded-2xl bg-[#0E141D] border border-[#1E293B] flex items-center justify-between gap-6 shadow-sm">
                {/* Circular Gauge */}
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#1E293B"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#45D9E8"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold font-mono tracking-tight text-primary">
                      {finalReadiness}%
                    </span>
                    <span className="text-[9px] font-mono text-muted uppercase tracking-wider">
                      READY
                    </span>
                  </div>
                </div>

                {/* Counts & Summary */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-cyan uppercase tracking-wider">
                        Defense Posture
                      </span>
                      {isLoadingTelemetry && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping"></span>
                      )}
                    </div>
                    <p className="text-xs text-primary/80 mt-0.5 font-medium">
                      Multi-vector threat resilience calculated across simulated attack channels.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="px-3 py-2 rounded-xl bg-[#080D12] border border-primary/5">
                      <p className="text-[10px] font-mono text-muted uppercase">Completed</p>
                      <p className="text-base font-bold font-mono text-primary">{completedCount}</p>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-[#080D12] border border-primary/5">
                      <p className="text-[10px] font-mono text-muted uppercase">Secure Decided</p>
                      <p className="text-base font-bold font-mono text-cyan">{secureCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coach Recommendation Card */}
              <div className="p-4 rounded-2xl bg-[#14181E] border border-amber/25 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber/5 rounded-full blur-xl pointer-events-none"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber animate-pulse"></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber">
                      COACH TARGET RECOMMENDATION
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber/10 text-amber border border-amber/20 font-semibold">
                    HIGH VALUE
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-primary">
                    {targetSituationTitle} ({recommendedSector.label})
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {targetRationale}
                  </p>
                </div>

                <button
                  onClick={() => onSelectSector(recommendedSector.channel)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue hover:bg-blue/90 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_15px_rgba(79,124,255,0.25)]"
                >
                  <span>Launch Recommended Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Threat Sectors List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                    Threat Defense Sectors
                  </h3>
                  <span className="text-[10px] font-mono text-muted">
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
                        className={`w-full p-3.5 rounded-xl text-left flex items-center justify-between gap-4 transition-all duration-200 group ${
                          isActive
                            ? 'bg-[#111A24] border-2 border-cyan/60 shadow-[0_0_15px_rgba(69,217,232,0.15)]'
                            : 'bg-[#0E141D] border border-[#1E293B] hover:border-primary/20 hover:bg-[#121822]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              isActive
                                ? 'bg-cyan/20 text-cyan border border-cyan/40'
                                : 'bg-surface border border-primary/10 text-muted group-hover:text-primary'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isActive ? 'text-primary' : 'text-primary/90'
                                }`}
                              >
                                {sec.label}
                              </span>

                              {/* Status Badges */}
                              {status === 'ACTIVE' && (
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
                                  ACTIVE
                                </span>
                              )}
                              {status === 'PRIORITY' && !isActive && (
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/30">
                                  PRIORITY
                                </span>
                              )}
                              {status === 'MASTERED' && !isActive && (
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  MASTERED
                                </span>
                              )}
                              {status === 'WEAK' && !isActive && (
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-coral/15 text-coral border border-coral/30">
                                  WEAK
                                </span>
                              )}
                              {status === 'NEW' && !isActive && (
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 text-muted border border-primary/10">
                                  NEW
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-muted truncate mt-0.5">
                              {sec.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-semibold text-primary/80">
                            {score > 0 ? `${score}%` : '—'}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                              isActive ? 'text-cyan' : 'text-muted'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Decision History Timeline */}
              <div className="space-y-3 pt-2">
                <h3 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted">
                  Recent Decision Timeline
                </h3>

                {decisionJourney.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0E141D] border border-primary/5 text-center">
                    <p className="text-xs text-muted font-mono">
                      No decisions logged yet. Complete your current scenario to record evaluation telemetry.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {decisionJourney.slice(0, 4).map((record, i) => (
                      <div
                        key={record.id || i}
                        className="p-3 rounded-xl bg-[#0E141D] border border-primary/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-primary truncate">{record.title}</p>
                          <p className="text-[10px] font-mono text-muted mt-0.5">
                            {record.threat || 'Threat Evaluation'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              record.is_safe !== false
                                ? 'bg-teal/15 text-teal border border-teal/30'
                                : 'coral/15 text-coral border border-coral/30'
                            }`}
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
            <div className="shrink-0 px-6 py-4 border-t border-[#1E293B] bg-[#080D12] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {onNavigateOverview && (
                  <button
                    onClick={onNavigateOverview}
                    className="px-3.5 py-1.5 rounded-lg bg-surface border border-primary/10 hover:border-primary/25 text-muted hover:text-primary text-xs font-mono transition-colors flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan" />
                    <span>Overview</span>
                  </button>
                )}
                {onNavigatePolicies && (
                  <button
                    onClick={onNavigatePolicies}
                    className="px-3.5 py-1.5 rounded-lg bg-surface border border-primary/10 hover:border-primary/25 text-muted hover:text-primary text-xs font-mono transition-colors flex items-center gap-1.5"
                  >
                    <ScrollText className="w-3.5 h-3.5 text-blue" />
                    <span>Policies</span>
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary text-xs font-mono transition-colors border border-primary/10 ml-auto"
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
