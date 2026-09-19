"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FirstUserGuide } from '@/components/FirstUserGuide';
import UserProfileModal from '@/components/profile/UserProfileModal';
import {
  Lightbulb, ScrollText, X, Shield, Compass, Target,
  Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, HardDrive,
  LayoutDashboard, Map, History, Sparkles, CheckCircle2, AlertCircle, ArrowRight,
  LogOut, Clock, ChevronRight, ArrowLeft,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardData {
  data_source: 'supabase' | 'memory';
  decision_count: number;
  user: { id: string; name: string; role: string; company?: string; department?: string; access_role: string; avatar_url?: string };
  readiness_score: number;
  feedback_headline: string;
  next_situation: { title: string; role: string; category: string; difficulty: string; estimated_minutes: number; tactic_target: string };
  decision_journey: Array<{ id: number; title: string; threat: string; score: number; status: string; is_safe: boolean; channel?: string; reasoning?: string }>;
  weakness_breakdown: Record<string, number>;
  channel_scores: Record<string, number | null>;
}

interface CompletedScenario {
  id: string;
  scenario_id: string | null;
  title: string;
  channel: string;
  score: number | null;
  is_safe: boolean | null;
  chosen_action: string;
  reasoning: string;
  completed_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Training sector config — unified glass palette, single blue accent
// ─────────────────────────────────────────────────────────────────────────────
const TRAINING_SECTORS = [
  { channel: 'voice_phone',    label: 'Voice & Vishing',  description: 'Phone-based social engineering & authority impersonation', Icon: Phone         },
  { channel: 'email',          label: 'Email & BEC',      description: 'Business email compromise, spoofing & urgency manipulation', Icon: Mail          },
  { channel: 'slack_teams',    label: 'Slack / Teams',    description: 'Chat-platform attacks, credential leakage & impersonation', Icon: MessageSquare  },
  { channel: 'qr_code',        label: 'QR / Quishing',   description: 'Malicious QR codes in physical or digital environments',    Icon: QrCode        },
  { channel: 'cloud_oauth',    label: 'Cloud & OAuth',   description: 'Malicious app consent, token hijacking & cloud takeover',   Icon: Cloud         },
  { channel: 'sms_push',       label: 'MFA Fatigue',     description: 'Push-bombing, SIM swap and MFA bypass techniques',         Icon: Smartphone    },
  { channel: 'physical_media', label: 'Physical Media',  description: 'USB drops, rogue hardware & physical access exploitation',  Icon: HardDrive     },
] as const;

type SectorChannel = typeof TRAINING_SECTORS[number]['channel'];

function getSectorScore(channel: SectorChannel, scores: Record<string, number | null>): number | null {
  return scores[channel] ?? null;
}

// ── Design tokens — no cartoon colors ────────────────────────────────────────
const glassCard  = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' };
const glassDim   = { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.055)' };
const priorityGlow = { background: 'rgba(79,124,255,0.04)', border: '1px solid rgba(79,124,255,0.18)', boxShadow: '0 0 30px rgba(79,124,255,0.07)' };

function ScoreBadge({ score, isPriority }: { score: number | null; isPriority: boolean }) {
  if (isPriority) return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.2)', color: 'rgba(165,184,255,0.8)' }}>
      Priority
    </span>
  );
  if (score === null) return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.6)' }}>
      New
    </span>
  );
  if (score >= 80) return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(180,200,180,0.7)' }}>
      Mastered
    </span>
  );
  if (score < 40) return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.6)' }}>
      Needs Work
    </span>
  );
  return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(79,124,255,0.07)', border: '1px solid rgba(79,124,255,0.15)', color: 'rgba(165,184,255,0.7)' }}>
      Active
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation Tab Type
// ─────────────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'arena';

// ─────────────────────────────────────────────────────────────────────────────
// Readiness ring — SVG circular progress
// ─────────────────────────────────────────────────────────────────────────────
function ReadinessRing({ score }: { score: number }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        {/* Track */}
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        {/* Progress */}
        <motion.circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(79,124,255,0.6)" />
            <stop offset="100%" stopColor="rgba(165,184,255,0.9)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-[24px] font-semibold leading-none text-primary">{score}</p>
        <p className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(141,152,165,0.5)' }}>/100</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [data, setData] = useState<DashboardData>({
    data_source: 'memory',
    decision_count: 0,
    user: { id: '', name: '', role: 'Employee', company: '', department: '', access_role: 'learner', avatar_url: '' },
    readiness_score: 0,
    feedback_headline: "Welcome — your first adaptive simulation is ready. Let's establish your baseline.",
    next_situation: { title: 'A payment request that cannot wait.', role: 'Employee', category: 'Payment & Invoice Verification', difficulty: 'beginner', estimated_minutes: 3, tactic_target: 'urgency_bias' },
    decision_journey: [],
    weakness_breakdown: { 'Phishing & Spoofing': 0, 'Urgency & BEC Defense': 0, 'Data Protection & Privacy': 0, 'Policy Compliance & Verification': 0 },
    channel_scores: {},
  });
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [policiesCount, setPoliciesCount]   = useState<number>(0);
  const [showTour, setShowTour]             = useState(false);
  const [isProfileOpen, setIsProfileOpen]   = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<CompletedScenario[]>([]);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [completedHasMore, setCompletedHasMore] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedError, setCompletedError] = useState<string | null>(null);
  const [coachInput, setCoachInput]                 = useState('');
  const [coachTipModal, setCoachTipModal]           = useState<string | null>(null);
  const [priorityChannel, setPriority]      = useState('email');
  const [nextDifficulty, setDifficulty]     = useState('beginner');
  const [personalizedMap, setPersonalizedMap] = useState<any[]>([]);

  const handleAskCoach = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('urgency') || q.includes('checklist')) {
      setCoachTipModal("⚡ Urgency Bias Protocol: Attackers manufacture artificial time pressure to bypass dual-control checks. Verify any rush payment or credential request over an out-of-band confirmed phone number.");
    } else if (q.includes('sop') || q.includes('protocol') || q.includes('policy')) {
      setCoachTipModal(`📋 Policy check: ${policiesCount} policy records are available for ${data.user.company || 'your organization'}. Open Policies to review the actual rules before acting.`);
    } else if (q.includes('quish') || q.includes('qr')) {
      setCoachTipModal("📱 Quishing Defense: Never scan unknown QR codes in emails or physical areas to authorize login sessions. QR codes obscure destination URLs and bypass email scanner filters.");
    } else {
      setCoachTipModal(`💡 General guidance for ${data.user.role}: Pause on unexpected requests and verify through a trusted channel before acting.`);
    }
  };

  interface SelectedSectorModalData {
    channel: string;
    label: string;
    description: string;
    isPriority: boolean;
    score: number | null;
    challengeTopic: string;
    url: string;
    Icon: React.ElementType;
  }
  const [selectedSector, setSelectedSector] = useState<SelectedSectorModalData | null>(null);
  const [sectorHistory, setSectorHistory] = useState<CompletedScenario[]>([]);
  const [sectorTotal, setSectorTotal] = useState(0);
  const [sectorScore, setSectorScore] = useState<number | null>(null);
  const [sectorHasMore, setSectorHasMore] = useState(false);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [sectorError, setSectorError] = useState<string | null>(null);
  const sectorRequestId = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      const isFirstTime = localStorage.getItem('cyberguard_first_time') === '1';
      if (tabParam === 'training_map' || tabParam === 'arena' || isFirstTime) {
        setActiveTab('arena');
        localStorage.removeItem('cyberguard_first_time');
      }
    }

    if (typeof window !== 'undefined' && window.location.hash) {
      const hp = new URLSearchParams(window.location.hash.substring(1));
      const at = hp.get('access_token');
      if (at) {
        try {
          const p = JSON.parse(atob(at.split('.')[1]));
          const ou = { 
            id: p.sub || p.id, 
            email: p.email, 
            full_name: p.user_metadata?.full_name || p.user_metadata?.name || p.email?.split('@')[0], 
            role: p.user_metadata?.role || 'Employee', 
            company: p.user_metadata?.company || 'Your Organization', 
            access_role: p.app_metadata?.access_role || 'learner',
            avatar_url: p.user_metadata?.avatar_url || p.user_metadata?.picture || ''
          };
          const ex = localStorage.getItem('cyberguard_user');
          let ep = null;
          if (ex) { try { const ep2 = JSON.parse(ex); if (ep2.id === ou.id) ep = ep2.learning_profile || null; } catch (_) {} }
          localStorage.setItem('cyberguard_user', JSON.stringify({ ...ou, ...(ep ? { learning_profile: ep } : {}) }));
          fetch('http://localhost:8000/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: at })
          }).then(r => r.ok ? r.json() : Promise.reject(r)).then(session => {
            localStorage.setItem('cyberguard_token', session.access_token);
            localStorage.setItem('cyberguard_user', JSON.stringify({ ...session.user, ...(ep ? { learning_profile: ep } : {}) }));
            window.location.reload();
          }).catch(() => router.replace('/login'));
        } catch (_) {}
        window.history.replaceState(null, '', window.location.pathname);
        // ── Wait for the Google token exchange to complete (reload) before
        //    running the rest of this effect. Without this return the
        //    dashboard-summary fetch fires immediately with no token → 401.
        return;
      }
    }

    const raw = localStorage.getItem('cyberguard_user');
    const onboarded = localStorage.getItem('cyberguard_onboarded') === '1';
    if (raw && !onboarded) {
      try {
        const u = JSON.parse(raw);
        if (!!localStorage.getItem('cyberguard_token') && !u.learning_profile && (!u.company || u.company === 'Your Organization')) {
          router.replace('/onboarding'); return;
        }
      } catch (_) {}
    }

    const stored = localStorage.getItem('cyberguard_user');
    const token  = localStorage.getItem('cyberguard_token');
    let company  = 'Your Organization';
    if (stored) {
      try {
        const u = JSON.parse(stored);
        company = u.company || company;
        setData(prev => ({ 
          ...prev, 
          user: { 
            ...prev.user, 
            name: u.full_name || u.name || u.email || 'User', 
            role: u.role || 'Employee', 
            company: u.company || 'Your Organization', 
            department: u.department || '',
            avatar_url: u.avatar_url || u.picture || ''
          } 
        }));
        // Training metrics are loaded from the authenticated dashboard endpoint.
      } catch (_) {}
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`http://localhost:8000/api/org/policies/${encodeURIComponent(company)}`, { headers }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { if (d?.success && typeof d.count === 'number') setPoliciesCount(d.source === 'database' || d.source === 'memory' ? d.count : 0); }).catch(() => setPoliciesCount(0));
    fetch('http://localhost:8000/api/coach/dashboard-summary', { headers })
      .then(r => { if (!r.ok) throw new Error('unauth'); return r.json(); })
      .then(d => {
        if (!d?.success) throw new Error('Dashboard summary unavailable');
        if (d?.success) {
          setDashboardError(null);
          setData(prev => { const { user: au, ...rest } = d; return { ...prev, ...rest, user: { ...prev.user, ...au } }; });
          if (d.learning_profile?.target_channel) setPriority(d.learning_profile.target_channel);
          if (d.learning_profile?.next_difficulty) setDifficulty(d.learning_profile.next_difficulty);
          if (d.training_map && Array.isArray(d.training_map)) setPersonalizedMap(d.training_map);
          else if (d.learning_profile?.training_map && Array.isArray(d.learning_profile.training_map)) setPersonalizedMap(d.learning_profile.training_map);
          setDashboardLoading(false);
        }
      }).catch(() => { setDashboardError('Dashboard data could not be loaded from the database. Please try again.'); setDashboardLoading(false); });

    if (!localStorage.getItem('cyberguard_tour_completed')) setShowTour(true);
  }, []);

  const handleLogout = () => { localStorage.removeItem('cyberguard_token'); localStorage.removeItem('cyberguard_user'); router.push('/login'); };

  const loadCompletedScenarios = async (offset: number) => {
    setCompletedLoading(true);
    setCompletedError(null);
    try {
      const token = localStorage.getItem('cyberguard_token');
      if (!token) throw new Error('Please sign in again.');
      const response = await fetch(`http://localhost:8000/api/coach/completed-scenarios?limit=20&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Completed scenarios could not be loaded.');
      const result = await response.json();
      if (!result.success || !Array.isArray(result.items)) throw new Error('Completed scenarios could not be loaded.');
      setCompletedScenarios(previous => offset === 0 ? result.items : [...previous, ...result.items]);
      setCompletedTotal(result.total);
      setCompletedHasMore(result.has_more);
    } catch (error) {
      setCompletedError(error instanceof Error ? error.message : 'Completed scenarios could not be loaded.');
    } finally {
      setCompletedLoading(false);
    }
  };

  const openCompletedScenarios = () => {
    setIsJourneyModalOpen(true);
    setCompletedScenarios([]);
    setCompletedTotal(0);
    void loadCompletedScenarios(0);
  };

  const loadSectorHistory = async (channel: string, offset: number, requestId: number) => {
    setSectorLoading(true);
    setSectorError(null);
    try {
      const token = localStorage.getItem('cyberguard_token');
      if (!token) throw new Error('Please sign in again.');
      const response = await fetch(`http://localhost:8000/api/coach/completed-scenarios?channel=${encodeURIComponent(channel)}&limit=20&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Sector history could not be loaded.');
      const result = await response.json();
      if (!result.success || !Array.isArray(result.items)) throw new Error('Sector history could not be loaded.');
      if (requestId !== sectorRequestId.current) return;
      setSectorHistory(previous => offset === 0 ? result.items : [...previous, ...result.items]);
      setSectorTotal(result.total);
      setSectorScore(result.average_score);
      setSectorHasMore(result.has_more);
    } catch (error) {
      if (requestId === sectorRequestId.current) {
        setSectorError(error instanceof Error ? error.message : 'Sector history could not be loaded.');
      }
    } finally {
      if (requestId === sectorRequestId.current) setSectorLoading(false);
    }
  };

  const openSector = (sector: SelectedSectorModalData) => {
    const requestId = ++sectorRequestId.current;
    setSelectedSector(sector);
    setSectorHistory([]);
    setSectorTotal(0);
    setSectorScore(data.channel_scores[sector.channel] ?? null);
    setSectorHasMore(false);
    void loadSectorHistory(sector.channel, 0, requestId);
  };

  const scenarioUrl = (ch: string, topic: string) =>
    `/scenario?channel=${encodeURIComponent(ch)}&role=${encodeURIComponent(data.user.role)}&company=${encodeURIComponent(data.user.company || 'TechCorp Global')}&difficulty=${nextDifficulty}&topic=${encodeURIComponent(topic)}`;

  const slideIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] as const } },
    exit:   { opacity: 0, y: -6, transition: { duration: 0.2 } },
  };

  const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  };

  const up: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  };

  const userInitial = data.user.name ? data.user.name.charAt(0).toUpperCase() : 'U';

  if (dashboardLoading) return <main className="min-h-screen bg-background text-primary flex items-center justify-center">Loading dashboard data…</main>;
  if (dashboardError) return <main role="alert" className="min-h-screen bg-background text-primary flex flex-col gap-4 items-center justify-center"><p>{dashboardError}</p><button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg border border-white/20">Retry</button></main>;

  return (
    <main className="h-screen overflow-hidden bg-background text-primary font-sans selection:bg-white/10 flex flex-col relative">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(79,124,255,0.05) 0%, transparent 55%)' }} />

      <FirstUserGuide isOpen={showTour} onClose={() => setShowTour(false)} userRole={data.user.role} companyName={data.user.company || 'TechCorp Global'} />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={{ 
          id: data.user.id, 
          name: data.user.name, 
          role: data.user.role, 
          company: data.user.company, 
          department: data.user.department, 
          access_role: data.user.access_role, 
          readiness_score: data.readiness_score,
          avatar_url: data.user.avatar_url
        }}
        readinessScore={data.readiness_score}
        completedDecisions={data.decision_count}
        priorityChannel={priorityChannel}
        onUpdateUser={(updated) => {
          setData(prev => ({
            ...prev,
            user: { 
              ...prev.user, 
              name: updated.name || prev.user.name, 
              role: updated.role || prev.user.role, 
              company: updated.company || prev.user.company, 
              department: updated.department || prev.user.department,
              avatar_url: updated.avatar_url !== undefined ? updated.avatar_url : prev.user.avatar_url
            }
          }));
        }}
        onLogout={handleLogout}
      />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="shrink-0 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(11,15,20,0.85)', backdropFilter: 'blur(14px)' }}>
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 flex items-center justify-between">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-lg leading-none opacity-60 group-hover:opacity-90 transition-opacity" style={{ color: '#4F7CFF' }}>◉</span>
            <span className="font-semibold tracking-tight text-[14px]">Midnight Intelligence</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Tour button */}
            <button
              onClick={() => setShowTour(true)}
              className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(141,152,165,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline tracking-wide">Tour & Tips</span>
            </button>

            {/* Policies */}
            <Link
              href="/policies"
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.7)' }}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Policies</span>
            </Link>

            <Link
              href="/history"
              className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.7)' }}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Completed Scenarios</span>
              <span className="sm:hidden">History</span>
            </Link>

            {/* Admin Console (Visible only to administrators) */}
            {data?.user?.access_role === 'admin' && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.25)', color: 'rgba(165,184,255,0.9)' }}
              >
                <Shield className="w-3.5 h-3.5 text-blue" />
                <span>Admin Console</span>
              </Link>
            )}


            {/* Profile */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#E8EDF2'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(141,152,165,0.7)'; }}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: 'rgba(79,124,255,0.15)', color: 'rgba(165,184,255,0.8)', border: '1px solid rgba(79,124,255,0.3)' }}>
                {data.user.avatar_url ? (
                  <img src={data.user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <span>{data.user.name ? data.user.name.split(' ')[0] : 'Profile'}</span>
              <span className="text-[9px] font-mono uppercase tracking-wider hidden md:inline px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(141,152,165,0.5)' }}>
                {data.user.role}
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg transition-colors duration-200"
              style={{ color: 'rgba(141,152,165,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E8EDF2')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(141,152,165,0.4)')}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>
      <div className="px-6 py-1 text-[10px] font-mono text-muted">Metrics source: {data.data_source === 'supabase' ? 'database' : 'local demo memory'} · {data.decision_count} evaluated decisions</div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-6 md:px-10 pt-2.5 pb-3 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════
              OVERVIEW TAB (Corporate Executive Bento Layout - Viewport Fit)
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="h-full w-full overflow-hidden flex flex-col min-h-0">
              <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 flex-1">

                {/* ── PANEL 1: LEFT (4 cols) - Executive Personnel & Readiness Card ── */}
                <div 
                  className="lg:col-span-4 rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden h-full"
                  style={{
                    background: 'rgba(17,24,33,0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  {/* Subtle top glow */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(79,124,255,0.15) 0%, transparent 70%)' }} />

                  {/* Card Header */}
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary font-semibold">
                      Personnel Profile
                    </span>
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="text-[10px] font-mono transition-all flex items-center gap-1 px-2.5 py-1 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(141,152,165,0.6)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(79,124,255,0.25)';
                        e.currentTarget.style.background = 'rgba(79,124,255,0.08)';
                        e.currentTarget.style.color = '#E8EDF2';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = 'rgba(141,152,165,0.6)';
                      }}
                    >
                      <span>Edit</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Center: Profile Picture & Greetings */}
                  <div className="flex flex-col items-center text-center my-1 relative z-10">
                    {/* Avatar Container with Ring */}
                    <div className="relative group cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                      <div 
                        className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 border-2 border-dashed transition-colors flex items-center justify-center"
                        style={{ borderColor: 'rgba(79,124,255,0.35)' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(79,124,255,0.7)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(79,124,255,0.35)'}
                      >
                        <div className="w-full h-full rounded-full overflow-hidden bg-surface/90 flex items-center justify-center shadow-lg">
                          <img
                            src={data.user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                            alt={data.user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                      {/* Overlaid Tier / Level Badge */}
                      <div 
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider shrink-0 whitespace-nowrap transition-all"
                        style={{
                          background: 'rgba(79,124,255,0.12)',
                          border: '1px solid rgba(79,124,255,0.25)',
                          color: 'rgba(165,184,255,0.85)',
                          boxShadow: '0 0 16px rgba(79,124,255,0.15)'
                        }}
                      >
                        {nextDifficulty === 'advanced' ? 'Tier 3 · Advanced' : nextDifficulty === 'intermediate' ? 'Tier 2 · Specialist' : 'Tier 1 · Baseline'}
                      </div>
                    </div>

                    {/* Greeting & Name */}
                    <h2 className="text-[18px] sm:text-[20px] font-bold text-primary tracking-tight mt-3">
                      Welcome, {data.user.name ? data.user.name.split(' ')[0] : 'Learner'} 👋
                    </h2>
                    <p className="text-[11px] font-mono text-muted mt-0.5">
                      {data.user.role} · {data.user.company || 'NovaTech Solutions'}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap justify-center">
                      <span 
                        className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.6)' }}
                      >
                        {data.user.department || 'Corporate Operations'}
                      </span>
                      <span 
                        className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.8)' }}
                      >
                        {data.user.access_role || 'Learner'}
                      </span>
                    </div>
                  </div>

                  {/* Readiness Score Section */}
                  <div className="p-3 rounded-xl my-1 relative z-10" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[26px] font-bold tracking-tight text-primary leading-none">
                          {data.readiness_score}%
                        </span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-muted leading-tight">
                          Defense<br />Readiness
                        </span>
                      </div>
                      <span 
                        className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.8)' }}
                      >
                        Active Index
                      </span>
                    </div>

                    {/* Multi-color segment breakdown bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-1 bg-white/[0.04] mb-1.5 p-0.5">
                      <div 
                        style={{ width: `${(data.channel_scores.email ?? 0) / 3}%`, background: 'rgba(79,124,255,0.85)' }} 
                        className="h-full rounded-full transition-all duration-500" 
                        title="Phishing & Spoofing"
                      />
                      <div 
                        style={{ width: `${(data.channel_scores.voice_phone ?? 0) / 3}%`, background: 'rgba(165,184,255,0.6)' }} 
                        className="h-full rounded-full transition-all duration-500" 
                        title="Urgency & BEC Defense"
                      />
                      <div 
                        style={{ width: `${(data.channel_scores.cloud_oauth ?? 0) / 3}%`, background: 'rgba(92,200,215,0.65)' }} 
                        className="h-full rounded-full transition-all duration-500" 
                        title="Policy Compliance"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono" style={{ color: 'rgba(141,152,165,0.55)' }}>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(79,124,255,0.85)' }} /> Phish</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(165,184,255,0.6)' }} /> BEC</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'rgba(92,200,215,0.65)' }} /> Policy</span>
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-1 relative z-10">
                    <div 
                      className="p-2 sm:p-2.5 rounded-xl flex flex-col items-center text-center transition-all"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center mb-1"
                        style={{ background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.75)' }}
                      >
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="text-[14px] font-bold text-primary leading-none">07</span>
                      <span className="text-[8px] font-mono mt-0.5 uppercase tracking-tight" style={{ color: 'rgba(141,152,165,0.5)' }}>Vectors</span>
                    </div>

                    <Link 
                      href="/policies" 
                      className="p-2 sm:p-2.5 rounded-xl flex flex-col items-center text-center transition-all group"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                        e.currentTarget.style.background = 'rgba(79,124,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 group-hover:scale-105 transition-transform"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.65)' }}
                      >
                        <ScrollText className="w-3 h-3" />
                      </div>
                      <span className="text-[14px] font-bold text-primary leading-none">{policiesCount}</span>
                      <span className="text-[8px] font-mono mt-0.5 uppercase tracking-tight" style={{ color: 'rgba(141,152,165,0.5)' }}>Stored Policies</span>
                    </Link>

                    <button 
                      onClick={openCompletedScenarios}
                      className="p-2 sm:p-2.5 rounded-xl flex flex-col items-center text-center transition-all group cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                        e.currentTarget.style.background = 'rgba(79,124,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <div 
                        className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 group-hover:scale-105 transition-transform"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.65)' }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <span className="text-[14px] font-bold text-primary leading-none">{data.decision_count}</span>
                      <span className="text-[8px] font-mono mt-0.5 uppercase tracking-tight" style={{ color: 'rgba(141,152,165,0.5)' }}>Completed</span>
                    </button>
                  </div>
                </div>

                {/* ── RIGHT COLUMN (8 cols) ── */}
                <div className="lg:col-span-8 flex flex-col gap-3.5 h-full min-h-0">

                  {/* ── TOP HERO SECTION: Active Training Directives ── */}
                  <div 
                    className="flex-[1.15] min-h-0 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, rgba(79,124,255,0.14) 0%, rgba(17,24,33,0.95) 45%, rgba(11,15,20,0.98) 100%)',
                      border: '1px solid rgba(79,124,255,0.22)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(79,124,255,0.85)' }} />
                          <h2 className="text-[15px] font-bold text-primary tracking-tight">
                            Active Training Directives
                          </h2>
                        </div>
                        <p className="text-[10px] font-mono text-muted">
                          AI-generated adaptive simulations calibrated for {data.user.role}
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab('arena')}
                        className="text-[10px] font-mono uppercase tracking-[0.12em] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5"
                        style={{
                          background: 'rgba(79,124,255,0.08)',
                          border: '1px solid rgba(79,124,255,0.18)',
                          color: 'rgba(165,184,255,0.8)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(79,124,255,0.14)';
                          e.currentTarget.style.borderColor = 'rgba(79,124,255,0.3)';
                          e.currentTarget.style.color = '#E8EDF2';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(79,124,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(79,124,255,0.18)';
                          e.currentTarget.style.color = 'rgba(165,184,255,0.8)';
                        }}
                      >
                        <span>View All (7)</span>
                        <ArrowRight className="w-3 h-3" style={{ color: 'rgba(165,184,255,0.8)' }} />
                      </button>
                    </div>

                    {/* 3 Directive Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 flex-1 min-h-0">
                      {/* Card 1: Top Priority Coach Directive */}
                      <div 
                        className="p-3 rounded-xl flex flex-col justify-between relative overflow-hidden group transition-all"
                        style={priorityGlow}
                      >
                        <div className="absolute top-0 left-0 right-0 h-px"
                          style={{ background: 'linear-gradient(90deg, transparent, rgba(79,124,255,0.45), transparent)' }} />
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span 
                              className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                              style={{ background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.2)', color: 'rgba(165,184,255,0.8)' }}
                            >
                              Coach Priority
                            </span>
                            <span className="text-[8px] font-mono text-muted">
                              ~{data.next_situation.estimated_minutes} min
                            </span>
                          </div>
                          <h3 className="text-[12px] font-semibold text-primary line-clamp-2 leading-snug mb-1">
                            {data.next_situation.title}
                          </h3>
                          <p className="text-[9px] font-mono text-muted/70 mb-1 truncate">
                            Target: {data.next_situation.tactic_target.replace('_', ' ')}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-muted mb-1">
                            <span>Readiness Target</span>
                            <span className="font-bold" style={{ color: 'rgba(165,184,255,0.85)' }}>{data.readiness_score}%</span>
                          </div>
                          <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${Math.min(100, Math.max(0, data.readiness_score))}%`,
                                background: 'linear-gradient(90deg, rgba(79,124,255,0.5), rgba(165,184,255,0.7))'
                              }}
                            />
                          </div>

                          <Link
                            href={scenarioUrl(priorityChannel, data.next_situation.category)}
                            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-mono uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-1.5"
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
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(79,124,255,0.1)';
                              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                              e.currentTarget.style.color = 'rgba(165,184,255,0.85)';
                            }}
                          >
                            <span>Launch Scenario</span>
                            <ArrowRight className="w-3 h-3" style={{ color: 'rgba(165,184,255,0.75)' }} />
                          </Link>
                        </div>
                      </div>

                      {/* Card 2: Cloud & OAuth Directive */}
                      <div 
                        className="p-3 rounded-xl flex flex-col justify-between transition-all group"
                        style={glassDim}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.055)';
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.015)';
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span 
                              className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.6)' }}
                            >
                              Cloud & OAuth
                            </span>
                            <span className="text-[8px] font-mono text-muted">
                              ~3 min
                            </span>
                          </div>
                          <h3 className="text-[12px] font-semibold text-primary line-clamp-2 leading-snug mb-1">
                            Illicit Third-Party App & Token Hijacking
                          </h3>
                          <p className="text-[9px] font-mono text-muted/70 mb-1 truncate">
                            Target: consent_grant_abuse
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-muted mb-1">
                            <span>Sector Score</span>
                            <span className="text-primary font-bold">{data.channel_scores.cloud_oauth == null ? '—' : `${data.channel_scores.cloud_oauth}%`}</span>
                          </div>
                          <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${getSectorScore('cloud_oauth', data.channel_scores)}%`,
                                background: 'linear-gradient(90deg, rgba(79,124,255,0.5), rgba(165,184,255,0.7))'
                              }}
                            />
                          </div>

                          <Link
                            href={scenarioUrl('cloud_oauth', 'Cloud & OAuth Consent Verification')}
                            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-mono uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-1.5"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'rgba(141,152,165,0.55)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(79,124,255,0.08)';
                              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                              e.currentTarget.style.color = '#E8EDF2';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                              e.currentTarget.style.color = 'rgba(141,152,165,0.55)';
                            }}
                          >
                            <span>Launch Scenario</span>
                            <ArrowRight className="w-3 h-3" style={{ color: 'rgba(141,152,165,0.45)' }} />
                          </Link>
                        </div>
                      </div>

                      {/* Card 3: Voice & BEC Directive */}
                      <div 
                        className="p-3 rounded-xl flex flex-col justify-between transition-all group"
                        style={glassDim}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.055)';
                          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.015)';
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span 
                              className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.6)' }}
                            >
                              Voice & BEC
                            </span>
                            <span className="text-[8px] font-mono text-muted">
                              ~4 min
                            </span>
                          </div>
                          <h3 className="text-[12px] font-semibold text-primary line-clamp-2 leading-snug mb-1">
                            Urgent Wire Authorization & Caller Spoofing
                          </h3>
                          <p className="text-[9px] font-mono text-muted/70 mb-1 truncate">
                            Target: executive_authority_bias
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-muted mb-1">
                            <span>Sector Score</span>
                            <span className="text-primary font-bold">{data.channel_scores.voice_phone == null ? '—' : `${data.channel_scores.voice_phone}%`}</span>
                          </div>
                          <div className="w-full h-1 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div 
                              className="h-full rounded-full transition-all duration-700"
                              style={{ 
                                width: `${getSectorScore('voice_phone', data.channel_scores)}%`,
                                background: 'linear-gradient(90deg, rgba(79,124,255,0.5), rgba(165,184,255,0.7))'
                              }}
                            />
                          </div>

                          <Link
                            href={scenarioUrl('voice_phone', 'Executive Wire Authorization Phone Call')}
                            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-mono uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-1.5"
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              color: 'rgba(141,152,165,0.55)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(79,124,255,0.08)';
                              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                              e.currentTarget.style.color = '#E8EDF2';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                              e.currentTarget.style.color = 'rgba(141,152,165,0.55)';
                            }}
                          >
                            <span>Launch Scenario</span>
                            <ArrowRight className="w-3 h-3" style={{ color: 'rgba(141,152,165,0.45)' }} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── BOTTOM ROW: 2 Cards (Threat Vector Mastery + Midnight AI Coach) ── */}
                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3.5">

                    {/* Threat Vector Mastery (Study process in reference) - 7 cols */}
                    <div 
                      className="md:col-span-7 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden h-full"
                      style={{
                        background: 'rgba(17,24,33,0.7)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(14px)'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3 className="text-[13px] font-bold text-primary tracking-tight">
                            Threat Vector Mastery
                          </h3>
                          <p className="text-[9px] font-mono text-muted">
                            Dynamic Defense Proficiency
                          </p>
                        </div>
                        <span 
                          className="text-[9px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded-md"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.55)' }}
                        >
                          Live Metrics ▾
                        </span>
                      </div>

                      {/* 4 Vertical Bars like Study process */}
                      <div className="flex-1 min-h-0 grid grid-cols-4 gap-2.5 items-end pt-1 pb-1">
                        {[
                          { label: 'Email', score: data.channel_scores.email, highlight: false },
                          { label: 'Voice', score: data.channel_scores.voice_phone, highlight: false },
                          { label: 'Cloud OAuth', score: data.channel_scores.cloud_oauth, highlight: true },
                          { label: 'Physical', score: data.channel_scores.physical_media, highlight: false },
                        ].map((bar, i) => (
                          <div key={i} className="flex flex-col items-center h-full justify-end group">
                            {/* Score pill */}
                            <span 
                              className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded mb-1 transition-all"
                              style={bar.highlight 
                                ? { background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.2)', color: 'rgba(165,184,255,0.85)' }
                                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.5)' }
                              }
                            >
                              {bar.score == null ? '—' : `${bar.score}%`}
                            </span>
                            {/* Bar container */}
                            <div className="w-full max-w-[42px] h-20 sm:h-24 bg-white/[0.03] rounded-xl p-1 flex items-end">
                              <div 
                                className="w-full rounded-lg transition-all duration-700"
                                style={bar.highlight 
                                  ? {
                                      height: `${bar.score ?? 0}%`,
                                      background: 'linear-gradient(to top, rgba(79,124,255,0.5), rgba(165,184,255,0.85))',
                                      boxShadow: '0 0 16px rgba(79,124,255,0.25)'
                                    }
                                  : {
                                      height: `${bar.score ?? 0}%`,
                                      background: 'rgba(255,255,255,0.08)'
                                    }
                                }
                              />
                            </div>
                            {/* Label */}
                            <span className="text-[9px] font-mono text-muted mt-1 tracking-tight truncate w-full text-center">
                              {bar.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Midnight AI Coach Card (AI assistant in reference) - 5 cols */}
                    <div 
                      className="md:col-span-5 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden h-full"
                      style={{
                        background: 'radial-gradient(ellipse at top right, rgba(79,124,255,0.14) 0%, rgba(17,24,33,0.85) 75%)',
                        border: '1px solid rgba(79,124,255,0.22)',
                        backdropFilter: 'blur(14px)'
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.8)' }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-[12px] font-bold text-primary tracking-tight">
                              AI Defense Coach
                            </h3>
                          </div>
                          <span 
                            className="text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
                            style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.75)' }}
                          >
                            Live
                          </span>
                        </div>

                        {/* Live Headline Bubble */}
                        <div 
                          className="p-2 sm:p-2.5 rounded-xl mb-2"
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <p className="text-[10px] leading-snug font-sans line-clamp-2" style={{ color: 'rgba(232,237,242,0.9)' }}>
                            "{data.feedback_headline}"
                          </p>
                        </div>
                      </div>

                      {/* Interactive Prompt Bar */}
                      <div>
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (coachInput.trim()) {
                              handleAskCoach(coachInput.trim());
                              setCoachInput('');
                            }
                          }}
                          className="relative flex items-center"
                        >
                          <input
                            type="text"
                            value={coachInput}
                            onChange={(e) => setCoachInput(e.target.value)}
                            placeholder="Ask Coach something..."
                            className="w-full pl-2.5 pr-8 py-1.5 rounded-xl text-[10px] text-primary placeholder:text-muted/50 transition-all outline-none"
                            style={{
                              background: 'rgba(0,0,0,0.35)',
                              border: '1px solid rgba(255,255,255,0.08)'
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = 'rgba(79,124,255,0.45)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                          />
                          <button
                            type="submit"
                            className="absolute right-1 w-5 h-5 rounded-lg flex items-center justify-center transition-all"
                            style={{
                              background: 'rgba(79,124,255,0.12)',
                              border: '1px solid rgba(79,124,255,0.22)',
                              color: 'rgba(165,184,255,0.85)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(79,124,255,0.24)';
                              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.4)';
                              e.currentTarget.style.color = '#FFFFFF';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(79,124,255,0.12)';
                              e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                              e.currentTarget.style.color = 'rgba(165,184,255,0.85)';
                            }}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </form>

                        {/* Quick Tip Prompts */}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {['Urgency checklist', 'SOP protocol', 'Quishing tip'].map((tip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleAskCoach(tip)}
                              className="text-[8px] font-mono px-2 py-0.5 rounded transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                color: 'rgba(141,152,165,0.55)'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(79,124,255,0.08)';
                                e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)';
                                e.currentTarget.style.color = '#E8EDF2';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                e.currentTarget.style.color = 'rgba(141,152,165,0.55)';
                              }}
                            >
                              {tip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TRAINING MAP TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'arena' && (
            <motion.div key="arena" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col min-h-0">

              {/* Arena header */}
              <div className="shrink-0 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] px-3 py-1.5 rounded-xl transition-all duration-200 mb-3 group"
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
                  >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" style={{ color: 'rgba(165,184,255,0.9)' }} />
                    <span>Back to Dashboard</span>
                  </button>
                  <p className="text-[9px] font-mono tracking-[0.2em] uppercase flex items-center gap-2 mb-1"
                    style={{ color: 'rgba(141,152,165,0.4)' }}>
                    <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'rgba(79,124,255,0.7)' }} />
                    AI Coach · Role-Profiled Training Map
                  </p>
                  <h2 className="text-[20px] lg:text-[24px] font-semibold tracking-tight text-primary">Training Map</h2>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(141,152,165,0.6)' }}>
                    Seven attack channels personalised for <strong className="text-primary font-medium">{data.user.role}</strong> at{' '}
                    <strong className="text-primary font-medium">{data.user.company || 'your organization'}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(79,124,255,0.07)', border: '1px solid rgba(79,124,255,0.15)', color: 'rgba(165,184,255,0.6)' }}>
                    Tier: {nextDifficulty}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.5)' }}>
                    {data.user.role}
                  </span>
                </div>
              </div>

              {/* Scrollable sector grid */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide">
                <motion.div
                  variants={stagger} initial="hidden" animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-2"
                >
                  {TRAINING_SECTORS.map(({ channel, label, description, Icon }, i) => {
                    const custom = personalizedMap.find(p => p.channel === channel);
                    const sectorLabel = custom?.label || label;
                    const sectorDesc  = custom?.description || description;
                    const isPriority  = custom
                      ? (custom.is_priority || custom.priority_level === 'Priority' || channel === priorityChannel)
                      : (channel === priorityChannel);
                    const score = getSectorScore(channel as SectorChannel, data.channel_scores);
                    const challengeTopic = custom?.recommended_challenge || sectorLabel;
                    const url = scenarioUrl(channel, challengeTopic);

                    return (
                      <motion.div
                        key={channel}
                        variants={up}
                        onClick={() => openSector({ channel, label: sectorLabel, description: sectorDesc, isPriority, score, challengeTopic, url, Icon })}
                        className="relative group rounded-xl p-4 flex flex-col cursor-pointer transition-all duration-200"
                        style={isPriority ? priorityGlow : glassDim}
                        onMouseEnter={e => {
                          if (!isPriority) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isPriority) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.055)';
                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.015)';
                          }
                        }}
                      >
                        {/* Priority top line */}
                        {isPriority && (
                          <div className="absolute top-0 left-4 right-4 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(79,124,255,0.35), transparent)' }} />
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={isPriority
                              ? { background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.18)' }
                              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                            }>
                            <Icon className="w-4 h-4"
                              style={{ color: isPriority ? 'rgba(165,184,255,0.7)' : 'rgba(141,152,165,0.5)' }} />
                          </div>
                          <ScoreBadge score={score} isPriority={isPriority} />
                        </div>

                        <h3 className="text-[11px] font-semibold text-primary tracking-tight mb-0.5">{sectorLabel}</h3>
                        <p className="text-[10px] leading-relaxed mb-3 flex-1 line-clamp-2"
                          style={{ color: 'rgba(141,152,165,0.55)' }}>
                          {sectorDesc}
                        </p>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-mono uppercase tracking-[0.15em]" style={{ color: 'rgba(141,152,165,0.35)' }}>Score</span>
                            <span className="text-[9px] font-mono tabular-nums"
                              style={{ color: score === null ? 'rgba(141,152,165,0.3)' : 'rgba(165,184,255,0.7)' }}>
                              {score === null ? '—' : `${score}/100`}
                            </span>
                          </div>
                          <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: score === null ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, rgba(79,124,255,0.5), rgba(165,184,255,0.7))' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${score ?? 0}%` }}
                              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSector({ channel, label: sectorLabel, description: sectorDesc, isPriority, score, challengeTopic, url, Icon });
                          }}
                          className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.12em] transition-all rounded-lg py-1.5 px-3 self-start"
                          style={isPriority
                            ? { background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.7)' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.5)' }
                          }
                        >
                          <span>Sector Briefing</span>
                          <span>→</span>
                        </button>
                      </motion.div>
                    );
                  })}

                  {/* Info card */}
                  <motion.div variants={up} className="rounded-xl p-4 flex flex-col justify-between" style={glassDim}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: 'rgba(79,124,255,0.07)', border: '1px solid rgba(79,124,255,0.13)' }}>
                      <Shield className="w-4 h-4" style={{ color: 'rgba(165,184,255,0.6)' }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-semibold text-primary tracking-tight mb-1.5">How the Coach profiles you</h4>
                      <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(141,152,165,0.55)' }}>
                        The AI Coach analyses your job role, department, and org data to identify which attack channels target your profile most often. Your{' '}
                        <span style={{ color: 'rgba(165,184,255,0.7)' }}>Priority</span> sector updates as you progress.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="mt-3 text-[9px] font-mono uppercase tracking-[0.12em] transition-colors"
                      style={{ color: 'rgba(141,152,165,0.4)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(165,184,255,0.7)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(141,152,165,0.4)')}
                    >
                      ← Back to Dashboard
                    </button>
                  </motion.div>
                </motion.div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Sector Defense Briefing Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedSector && (() => {
          const IconComponent = selectedSector.Icon;

          return (
            <motion.div
              key="sector-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSector(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            >
              <motion.div
                key="sector-modal-content"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl rounded-2xl p-6 md:p-8 flex flex-col max-h-[88vh] overflow-hidden"
                style={{
                  background: 'rgba(17,24,33,0.97)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
                }}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-5 shrink-0"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={selectedSector.isPriority
                        ? { background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }
                      }>
                      <IconComponent className="w-5 h-5"
                        style={{ color: selectedSector.isPriority ? 'rgba(165,184,255,0.7)' : 'rgba(141,152,165,0.55)' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.5)' }}>
                          {selectedSector.channel.replace('_', ' ').toUpperCase()}
                        </span>
                        <ScoreBadge score={sectorScore} isPriority={selectedSector.isPriority} />
                      </div>
                      <h2 className="text-[17px] font-semibold tracking-tight text-primary">{selectedSector.label}</h2>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSector(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(141,152,165,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(141,152,165,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-5 space-y-6 scrollbar-hide">

                  {/* Score strip */}
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: 'rgba(141,152,165,0.45)' }}>
                        Sector Defense Score
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: sectorScore === null ? 'rgba(141,152,165,0.4)' : 'rgba(165,184,255,0.7)' }}>
                        {sectorLoading && sectorHistory.length === 0 ? 'Loading…' : sectorScore === null ? 'Not yet evaluated' : `${sectorScore} / 100`}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${sectorScore ?? 0}%`,
                          background: sectorScore === null
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(90deg, rgba(79,124,255,0.5), rgba(165,184,255,0.7))'
                        }}
                      />
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(141,152,165,0.6)' }}>
                      {selectedSector.description}
                    </p>
                  </div>

                  {/* History */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[9px] font-mono uppercase tracking-[0.18em] flex items-center gap-1.5"
                        style={{ color: 'rgba(141,152,165,0.45)' }}>
                        <History className="w-3.5 h-3.5" />
                        <span>Completed in this Sector ({sectorTotal})</span>
                      </h4>
                      {sectorTotal > 0 && (
                        <span className="text-[9px] font-mono" style={{ color: 'rgba(141,152,165,0.4)' }}>Evaluated by Agent</span>
                      )}
                    </div>

                    {sectorLoading && sectorHistory.length === 0 ? (
                      <p className="text-[12px] text-center py-5 text-muted">Loading completed scenarios…</p>
                    ) : sectorHistory.length === 0 && !sectorError ? (
                      <div className="p-5 rounded-xl text-center flex flex-col items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <History className="w-4 h-4" style={{ color: 'rgba(141,152,165,0.35)' }} />
                        </div>
                        <p className="text-[12px] font-medium" style={{ color: 'rgba(141,152,165,0.5)' }}>No past simulations in this sector</p>
                        <p className="text-[10px] mt-0.5 max-w-xs leading-relaxed" style={{ color: 'rgba(141,152,165,0.35)' }}>
                          Your score and defensive reasoning will appear here after your first simulation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sectorHistory.map(item => (
                          <div key={item.id} className="p-3.5 rounded-xl flex items-start justify-between gap-3"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-start gap-2.5 min-w-0">
                              {item.is_safe === true
                                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(165,184,255,0.6)' }} />
                                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(141,152,165,0.5)' }} />
                              }
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-primary">{item.title}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(141,152,165,0.5)' }}>
                                  {item.completed_at ? new Date(item.completed_at).toLocaleDateString() : 'Date unavailable'}
                                  {' · '}{item.is_safe === null ? 'Evaluated' : item.is_safe ? 'Safe decision' : 'Needs practice'}
                                </p>
                                <Link href={`/history/${encodeURIComponent(item.id)}`} className="inline-block mt-1.5 text-[10px] text-[#A5B8FF] hover:underline">
                                  View scenario details →
                                </Link>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-mono tabular-nums"
                                style={{ color: item.is_safe === true ? 'rgba(165,184,255,0.7)' : 'rgba(141,152,165,0.5)' }}>
                                {item.score === null ? 'Not scored' : `${Math.round(item.score)}/100`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {sectorError && (
                      <div role="alert" className="text-center text-xs text-red-300 py-3">
                        <p>{sectorError}</p>
                        <button type="button" onClick={() => void loadSectorHistory(selectedSector.channel, sectorHistory.length, sectorRequestId.current)} className="mt-2 underline">Retry</button>
                      </div>
                    )}
                    {sectorHasMore && !sectorError && (
                      <button type="button" disabled={sectorLoading}
                        onClick={() => void loadSectorHistory(selectedSector.channel, sectorHistory.length, sectorRequestId.current)}
                        className="w-full mt-2 py-2.5 text-xs font-mono rounded-lg border border-white/10 text-primary/80 disabled:opacity-50">
                        {sectorLoading ? 'Loading…' : 'Load more scenarios'}
                      </button>
                    )}
                  </div>

                  {/* What's next */}
                  <div>
                    <h4 className="text-[9px] font-mono uppercase tracking-[0.18em] flex items-center gap-1.5 mb-3"
                      style={{ color: 'rgba(141,152,165,0.45)' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Coach Target Challenge</span>
                    </h4>

                    <div className="p-4 rounded-xl relative overflow-hidden" style={priorityGlow}>
                      <div className="absolute top-0 left-0 w-[2px] h-full rounded-r"
                        style={{ background: 'linear-gradient(to bottom, rgba(79,124,255,0.5), transparent)' }} />

                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[9px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.18)', color: 'rgba(165,184,255,0.65)' }}>
                          {selectedSector.isPriority ? 'Top Recommendation' : 'Adaptive Next Step'}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(141,152,165,0.4)' }}>~3 min</span>
                      </div>

                      <h3 className="text-[14px] font-semibold text-primary mb-1.5">{selectedSector.challengeTopic}</h3>

                      <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'rgba(141,152,165,0.6)' }}>
                        Simulates an authentic, unannounced attack over{' '}
                        <strong className="text-primary">{selectedSector.channel.replace('_', ' ').toUpperCase()}</strong>{' '}
                        to evaluate your response against corporate directives.
                      </p>

                      <div className="flex items-center gap-2">
                        {['Diff: Beginner', 'Benign RAI Payload'].map((tag) => (
                          <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.5)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="pt-4 flex items-center justify-between gap-3 shrink-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSector(null)}
                    className="py-2.5 px-4 rounded-xl text-[12px] font-mono transition-all duration-200"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.6)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(141,152,165,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    Close
                  </button>

                  <Link
                    href={selectedSector.url}
                    className="py-2.5 px-6 rounded-xl text-white text-[12px] font-medium transition-all duration-200 flex items-center gap-2 hover:opacity-90"
                    style={{ background: '#4F7CFF', boxShadow: '0 0 24px rgba(79,124,255,0.2)' }}
                  >
                    <span>Launch Scenario</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Decision Journey Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isJourneyModalOpen && (
          <motion.div
            key="journey-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsJourneyModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-2xl p-6 flex flex-col max-h-[80vh] overflow-hidden"
              style={{
                background: 'rgba(17,24,33,0.97)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)'
              }}
            >
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: 'rgba(165,184,255,0.85)' }} />
                  <h3 className="text-[16px] font-bold text-primary">
                    Completed Scenarios ({completedLoading && completedTotal === 0 ? data.decision_count : completedTotal})
                  </h3>
                  <Link href="/history" className="hidden sm:inline text-[10px] font-mono text-[#A5B8FF] hover:underline">Full history</Link>
                </div>
                <button 
                  onClick={() => setIsJourneyModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(141,152,165,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(141,152,165,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1 scrollbar-hide">
                {completedLoading && completedScenarios.length === 0 && (
                  <p className="text-center py-12 text-muted text-xs font-mono">Loading completed scenarios…</p>
                )}
                {!completedLoading && completedScenarios.length === 0 && !completedError && (
                  <p className="text-center py-12 text-muted text-xs font-mono">No completed scenarios yet. Complete a simulation to see its score here.</p>
                )}
                {completedScenarios.map(item => (
                  <details key={item.id} className="group rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <summary className="list-none cursor-pointer p-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-primary truncate">{item.title}</p>
                        <p className="text-[10px] font-mono text-muted mt-1">
                          {item.channel.replace(/_/g, ' ')}
                          {item.completed_at && ` · ${new Date(item.completed_at).toLocaleDateString()}`}
                          {' · '}{item.is_safe === null ? 'Evaluated' : item.is_safe ? 'Safe decision' : 'Needs practice'}
                        </p>
                      </div>
                      <span className="text-[14px] font-bold font-mono shrink-0" style={{ color: 'rgba(165,184,255,0.85)' }}>
                        {item.score === null ? 'Not scored' : `${Math.round(item.score)}/100`}
                      </span>
                    </summary>
                    <div className="px-3.5 pb-3.5 text-[11px] leading-relaxed text-muted border-t border-white/[0.06]">
                      <p className="mt-2"><span className="text-primary/80">Your action:</span> {item.chosen_action || 'Not recorded'}</p>
                      <p className="mt-1"><span className="text-primary/80">Your reasoning:</span> {item.reasoning || 'Not recorded'}</p>
                      <Link href={`/history/${encodeURIComponent(item.id)}`} className="inline-block mt-2 text-[#A5B8FF] hover:underline">View full scenario details →</Link>
                    </div>
                  </details>
                ))}
                {completedError && (
                  <div role="alert" className="text-center text-xs text-red-300 py-4">
                    <p>{completedError}</p>
                    <button type="button" onClick={() => void loadCompletedScenarios(completedScenarios.length)} className="mt-2 underline">Retry</button>
                  </div>
                )}
                {completedHasMore && !completedError && (
                  <button type="button" disabled={completedLoading}
                    onClick={() => void loadCompletedScenarios(completedScenarios.length)}
                    className="w-full py-2.5 text-xs font-mono rounded-lg border border-white/10 text-primary/80 disabled:opacity-50">
                    {completedLoading ? 'Loading…' : 'Load more scenarios'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Coach Quick Tip Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {coachTipModal && (
          <motion.div
            key="coach-tip-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCoachTipModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl p-6 flex flex-col"
              style={{
                background: 'rgba(17,24,33,0.97)',
                border: '1px solid rgba(79,124,255,0.25)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)'
              }}
            >
              <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'rgba(165,184,255,0.9)' }}>
                  <Sparkles className="w-4 h-4" />
                  <span>Tactical Coach Advice</span>
                </div>
                <button 
                  onClick={() => setCoachTipModal(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(141,152,165,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#E8EDF2'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(141,152,165,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-primary/90 leading-relaxed font-sans mb-4">
                {coachTipModal}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCoachTipModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-[0.1em] transition-all"
                  style={{
                    background: '#4F7CFF',
                    boxShadow: '0 0 20px rgba(79,124,255,0.25)',
                    color: '#FFFFFF'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
