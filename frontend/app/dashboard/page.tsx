"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FirstUserGuide } from '@/components/FirstUserGuide';
import UserProfileModal from '@/components/profile/UserProfileModal';
import {
  Lightbulb, ScrollText, X, Shield, Compass, Target,
  Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, HardDrive,
  LayoutDashboard, Map, History, Sparkles, CheckCircle2, AlertCircle, ArrowRight,
  LogOut,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardData {
  user: { id: string; name: string; role: string; company?: string; department?: string; access_role: string };
  readiness_score: number;
  feedback_headline: string;
  next_situation: { title: string; role: string; category: string; difficulty: string; estimated_minutes: number; tactic_target: string };
  decision_journey: Array<{ id: number; title: string; threat: string; score: number; status: string; is_safe: boolean; channel?: string; reasoning?: string }>;
  weakness_breakdown: Record<string, number>;
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

const CHANNEL_SCORE_MAP: Record<SectorChannel, string[]> = {
  voice_phone:    ['Phishing & Spoofing', 'Vishing & Phone Fraud'],
  email:          ['Urgency & BEC Defense', 'Phishing & Spoofing'],
  slack_teams:    ['Data Protection & Privacy', 'Collaboration Security'],
  qr_code:        ['Phishing & Spoofing'],
  cloud_oauth:    ['Policy Compliance & Verification', 'Cloud & OAuth Security'],
  sms_push:       ['Policy Compliance & Verification', 'MFA & Access Security'],
  physical_media: ['Data Protection & Privacy'],
};

function getSectorScore(channel: SectorChannel, breakdown: Record<string, number>): number {
  const keys = CHANNEL_SCORE_MAP[channel] || [];
  const values = keys.map(k => breakdown[k] ?? 0).filter(v => v > 0);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// ── Design tokens — no cartoon colors ────────────────────────────────────────
const glassCard  = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' };
const glassDim   = { background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.055)' };
const priorityGlow = { background: 'rgba(79,124,255,0.04)', border: '1px solid rgba(79,124,255,0.18)', boxShadow: '0 0 30px rgba(79,124,255,0.07)' };

function ScoreBadge({ score, isPriority }: { score: number; isPriority: boolean }) {
  if (isPriority) return (
    <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
      style={{ background: 'rgba(79,124,255,0.1)', border: '1px solid rgba(79,124,255,0.2)', color: 'rgba(165,184,255,0.8)' }}>
      Priority
    </span>
  );
  if (score === 0) return (
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
// Tab bar
// ─────────────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'arena';

const TABS = [
  { id: 'overview' as TabId, label: 'Overview',     Icon: LayoutDashboard },
  { id: 'arena'    as TabId, label: 'Training Map', Icon: Map              },
];

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex justify-center py-3 shrink-0">
      <div className="relative flex items-center gap-0.5 p-1 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Sliding pill */}
        <motion.div
          layoutId="tab-pill"
          className="absolute inset-y-1 rounded-lg pointer-events-none"
          style={{
            left:  active === 'overview' ? '4px' : '50%',
            right: active === 'overview' ? '50%' : '4px',
            background: 'rgba(255,255,255,0.055)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        />
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative z-10 flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-mono tracking-[0.12em] uppercase transition-colors duration-200 select-none"
            style={{ color: active === id ? '#E8EDF2' : 'rgba(141,152,165,0.55)' }}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {id === 'arena' && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: active === id ? 'rgba(79,124,255,0.15)' : 'rgba(255,255,255,0.04)',
                  color: active === id ? 'rgba(165,184,255,0.8)' : 'rgba(141,152,165,0.4)',
                }}>
                AI
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    user: { id: '', name: '', role: 'Employee', company: '', department: '', access_role: 'learner' },
    readiness_score: 0,
    feedback_headline: "Welcome — your first adaptive simulation is ready. Let's establish your baseline.",
    next_situation: { title: 'A payment request that cannot wait.', role: 'Employee', category: 'Payment & Invoice Verification', difficulty: 'beginner', estimated_minutes: 3, tactic_target: 'urgency_bias' },
    decision_journey: [],
    weakness_breakdown: { 'Phishing & Spoofing': 0, 'Urgency & BEC Defense': 0, 'Data Protection & Privacy': 0, 'Policy Compliance & Verification': 0 },
  });

  const [policiesCount, setPoliciesCount]   = useState<number>(3);
  const [showTour, setShowTour]             = useState(false);
  const [isProfileOpen, setIsProfileOpen]   = useState(false);
  const [priorityChannel, setPriority]      = useState('voice_phone');
  const [nextDifficulty, setDifficulty]     = useState('beginner');
  const [personalizedMap, setPersonalizedMap] = useState<any[]>([]);

  interface SelectedSectorModalData {
    channel: string;
    label: string;
    description: string;
    isPriority: boolean;
    score: number;
    challengeTopic: string;
    url: string;
    Icon: React.ElementType;
  }
  const [selectedSector, setSelectedSector] = useState<SelectedSectorModalData | null>(null);

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
          const ou = { id: p.sub || p.id, email: p.email, full_name: p.user_metadata?.full_name || p.user_metadata?.name || p.email?.split('@')[0], role: p.user_metadata?.role || 'Employee', company: p.user_metadata?.company || 'Your Organization', access_role: p.app_metadata?.access_role || 'learner' };
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
        setData(prev => ({ ...prev, user: { ...prev.user, name: u.full_name || u.name || u.email || 'User', role: u.role || 'Employee', company: u.company || 'Your Organization', department: u.department || '' } }));
        if (u.learning_profile?.target_channel) setPriority(u.learning_profile.target_channel);
        if (u.learning_profile?.next_difficulty) setDifficulty(u.learning_profile.next_difficulty);
        if (u.learning_profile?.training_map && Array.isArray(u.learning_profile.training_map)) setPersonalizedMap(u.learning_profile.training_map);
        if (u.policies_count) setPoliciesCount(Number(u.policies_count));
      } catch (_) {}
    }
    const sc = localStorage.getItem('cyberguard_policies_count');
    if (sc) setPoliciesCount(Number(sc));

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`http://localhost:8000/api/org/policies/${encodeURIComponent(company)}`, { headers }).then(r => r.json()).then(d => { if (d?.success && typeof d.count === 'number') setPoliciesCount(d.count); }).catch(() => {});
    fetch('http://localhost:8000/api/coach/dashboard-summary', { headers })
      .then(r => { if (!r.ok) throw new Error('unauth'); return r.json(); })
      .then(d => {
        if (d?.success) {
          setData(prev => { const { user: au, ...rest } = d; return { ...prev, ...rest, user: { ...au, ...prev.user } }; });
          if (d.learning_profile?.target_channel) setPriority(d.learning_profile.target_channel);
          if (d.learning_profile?.next_difficulty) setDifficulty(d.learning_profile.next_difficulty);
          if (d.training_map && Array.isArray(d.training_map)) setPersonalizedMap(d.training_map);
          else if (d.learning_profile?.training_map && Array.isArray(d.learning_profile.training_map)) setPersonalizedMap(d.learning_profile.training_map);
        }
      }).catch(() => {});

    if (!localStorage.getItem('cyberguard_tour_completed')) setShowTour(true);
  }, []);

  const handleLogout = () => { localStorage.removeItem('cyberguard_token'); localStorage.removeItem('cyberguard_user'); router.push('/login'); };

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

  return (
    <main className="h-screen overflow-hidden bg-background text-primary font-sans selection:bg-white/10 flex flex-col relative">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(79,124,255,0.05) 0%, transparent 55%)' }} />

      <FirstUserGuide isOpen={showTour} onClose={() => setShowTour(false)} userRole={data.user.role} companyName={data.user.company || 'TechCorp Global'} />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={{ id: data.user.id, name: data.user.name, role: data.user.role, company: data.user.company, department: data.user.department, access_role: data.user.access_role, readiness_score: data.readiness_score }}
        readinessScore={data.readiness_score}
        completedDecisions={data.decision_journey.length}
        priorityChannel={priorityChannel}
        onUpdateUser={(updated) => {
          setData(prev => ({
            ...prev,
            user: { ...prev.user, name: updated.name || prev.user.name, role: updated.role || prev.user.role, company: updated.company || prev.user.company, department: updated.department || prev.user.department }
          }));
        }}
        onLogout={handleLogout}
      />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="shrink-0 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(11,15,20,0.85)', backdropFilter: 'blur(14px)' }}>
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">

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

            {/* Profile */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#E8EDF2'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(141,152,165,0.7)'; }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(79,124,255,0.15)', color: 'rgba(165,184,255,0.8)' }}>
                {userInitial}
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

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] w-full mx-auto px-8 md:px-12 shrink-0">
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-8 md:px-12 pb-4">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════
              OVERVIEW TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="h-full">
              <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

                {/* LEFT — Coach Narrative */}
                <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide min-h-0">

                  {/* Context line */}
                  <div>
                    <p className="text-[10px] font-mono tracking-[0.18em] uppercase flex items-center gap-2 mb-1"
                      style={{ color: 'rgba(141,152,165,0.45)' }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgba(79,124,255,0.6)' }} />
                      {data.user.company || 'TechCorp Global'} · {data.user.department || 'Finance & Accounting'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'rgba(141,152,165,0.55)' }}>
                      Signed in as{' '}
                      <button
                        onClick={() => setIsProfileOpen(true)}
                        className="font-semibold transition-colors"
                        style={{ color: '#E8EDF2' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(165,184,255,0.9)')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#E8EDF2')}
                      >
                        {data.user.name}
                      </button>{' '}
                      ({data.user.role})
                    </p>
                  </div>

                  {/* Feedback headline */}
                  <h1 className="text-[18px] lg:text-[22px] font-semibold tracking-tight leading-snug text-primary max-w-lg">
                    {data.feedback_headline}
                  </h1>

                  {/* Policy grounding card */}
                  <div className="p-4 rounded-xl flex items-center justify-between shrink-0" style={glassCard}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(79,124,255,0.08)', border: '1px solid rgba(79,124,255,0.15)' }}>
                        <Shield className="w-3.5 h-3.5" style={{ color: 'rgba(165,184,255,0.7)' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary">Policy Grounding Active</h4>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(141,152,165,0.55)' }}>
                            HF Vectorized
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(141,152,165,0.55)' }}>
                          <strong className="text-primary">{policiesCount} rules</strong> grounded in {data.user.company || 'TechCorp Global'} SOPs
                        </p>
                      </div>
                    </div>
                    <Link href="/policies" className="text-[10px] font-mono transition-colors shrink-0"
                      style={{ color: 'rgba(141,152,165,0.5)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#E8EDF2')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(141,152,165,0.5)')}>
                      Manage →
                    </Link>
                  </div>

                  {/* Coach recommended challenge */}
                  <div className="relative p-5 rounded-xl overflow-hidden group shrink-0" style={priorityGlow}>
                    {/* Left accent bar */}
                    <div className="absolute top-3 bottom-3 left-0 w-[2px] rounded-r"
                      style={{ background: 'linear-gradient(to bottom, rgba(79,124,255,0.6), rgba(79,124,255,0.1))' }} />

                    <p className="text-[9px] font-mono tracking-[0.2em] uppercase flex items-center gap-2 mb-3"
                      style={{ color: 'rgba(141,152,165,0.45)' }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(79,124,255,0.7)' }} />
                      Coach Recommended Challenge
                    </p>

                    <h2 className="text-[16px] font-semibold tracking-tight mb-2 text-primary leading-snug">
                      {data.next_situation.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      {[
                        data.next_situation.category,
                        `Diff: ${data.next_situation.difficulty}`,
                        `${data.next_situation.estimated_minutes} min`,
                      ].map((tag, i) => (
                        <span key={i} className="text-[10px] font-mono px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.6)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={scenarioUrl(priorityChannel, data.next_situation.category)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.15em] transition-all"
                      style={{ color: 'rgba(165,184,255,0.7)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#E8EDF2')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(165,184,255,0.7)')}>
                      Enter situation →
                    </Link>
                  </div>

                  {/* Training map jump */}
                  <button
                    onClick={() => setActiveTab('arena')}
                    className="py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 group shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(141,152,165,0.5)', background: 'rgba(255,255,255,0.02)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,124,255,0.2)'; e.currentTarget.style.color = 'rgba(165,184,255,0.7)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(141,152,165,0.5)'; }}
                  >
                    <Map className="w-3.5 h-3.5" />
                    View Training Map →
                  </button>
                </div>

                {/* CENTER — Decision Journey */}
                <div className="lg:col-span-4 flex flex-col min-h-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="pl-6 lg:pl-8 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <h3 className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: 'rgba(141,152,165,0.45)' }}>
                        Decision Journey
                      </h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                        style={{ background: 'rgba(79,124,255,0.07)', border: '1px solid rgba(79,124,255,0.14)', color: 'rgba(165,184,255,0.6)' }}>
                        Live
                      </span>
                    </div>

                    {/* Journey list */}
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                      {data.decision_journey.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <Target className="w-4 h-4" style={{ color: 'rgba(141,152,165,0.4)' }} />
                          </div>
                          <p className="text-[12px] font-medium" style={{ color: 'rgba(141,152,165,0.6)' }}>No simulations yet</p>
                          <p className="text-[10px] mt-1 max-w-[160px] leading-relaxed" style={{ color: 'rgba(141,152,165,0.35)' }}>
                            Complete your first scenario to start building your decision history.
                          </p>
                        </div>
                      ) : (
                        data.decision_journey.map((step, idx) => (
                          <div key={step.id} className="flex gap-3 items-start group">
                            {/* Timeline dot */}
                            <div className="relative z-10 mt-1.5 w-3 h-3 flex items-center justify-center rounded-full shrink-0"
                              style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0B0F14' }}>
                              <div className="w-1.5 h-1.5 rounded-full"
                                style={{ background: step.is_safe ? 'rgba(165,184,255,0.6)' : 'rgba(141,152,165,0.4)' }} />
                            </div>
                            <div className="flex-1 p-3 rounded-xl transition-all duration-200"
                              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-mono tracking-[0.12em] uppercase" style={{ color: 'rgba(141,152,165,0.45)' }}>
                                  0{idx + 1} / {step.threat}
                                </span>
                                <span className="text-[10px] font-semibold tabular-nums"
                                  style={{ color: step.is_safe ? 'rgba(165,184,255,0.8)' : 'rgba(141,152,165,0.6)' }}>
                                  {step.score}/100
                                </span>
                              </div>
                              <h4 className="text-[11px] font-semibold tracking-tight text-primary">{step.title}</h4>
                              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(141,152,165,0.5)' }}>{step.status}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* RAI grounding */}
                    <div className="shrink-0 mt-4 p-3.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.055)' }}>
                      <div className="flex items-start gap-2">
                        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'rgba(141,152,165,0.4)' }} />
                        <div>
                          <h5 className="text-[9px] font-mono uppercase tracking-[0.18em] mb-1" style={{ color: 'rgba(141,152,165,0.45)' }}>
                            Responsible AI (RAI) Grounding
                          </h5>
                          <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(141,152,165,0.5)' }}>
                            All simulated payloads are benign, non-executable, and audited under our RAI framework.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Readiness Score */}
                <div className="lg:col-span-3 flex flex-col min-h-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="pl-4 py-1 flex flex-col gap-5">

                    <h3 className="text-[9px] font-mono tracking-[0.2em] uppercase shrink-0"
                      style={{ color: 'rgba(141,152,165,0.45)' }}>
                      Defense Readiness
                    </h3>

                    {/* Circular ring + score */}
                    <div className="flex items-center gap-4">
                      <ReadinessRing score={data.readiness_score} />
                      <div>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(141,152,165,0.55)' }}>
                          Threat recognition, response timeliness & reasoning against {data.user.company || 'org'} policies.
                        </p>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {[
                        { val: `0${data.decision_journey.length}`, label: 'Simulations' },
                        { val: `0${policiesCount}`, label: 'Policies' },
                        { val: nextDifficulty, label: 'Next Tier' },
                        { val: '100%', label: 'RAI Audited' },
                      ].map((m, i) => (
                        <div key={i}>
                          <div className="text-[18px] font-semibold tracking-tight capitalize text-primary">{m.val}</div>
                          <div className="text-[8px] font-mono uppercase tracking-[0.15em]" style={{ color: 'rgba(141,152,165,0.45)' }}>{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Coach priority */}
                    <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-[8px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: 'rgba(141,152,165,0.4)' }}>
                        Coach's Top Priority
                      </p>
                      <Link
                        href={scenarioUrl(priorityChannel, data.next_situation.category)}
                        className="block p-3.5 rounded-xl transition-all duration-200 group"
                        style={{ background: 'rgba(79,124,255,0.04)', border: '1px solid rgba(79,124,255,0.12)' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(79,124,255,0.22)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(79,124,255,0.12)')}
                      >
                        <p className="text-[11px] font-semibold text-primary mb-1 tracking-tight leading-snug">
                          {data.next_situation.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono" style={{ color: 'rgba(141,152,165,0.45)' }}>{data.next_situation.category}</span>
                          <span className="text-[9px] font-mono capitalize" style={{ color: 'rgba(141,152,165,0.45)' }}>{data.next_situation.difficulty}</span>
                        </div>
                        <span className="text-[9px] font-mono mt-1.5 block transition-transform group-hover:translate-x-0.5"
                          style={{ color: 'rgba(165,184,255,0.6)' }}>
                          Enter situation →
                        </span>
                      </Link>
                    </div>

                    {/* Replay tour */}
                    <button
                      onClick={() => setShowTour(true)}
                      className="py-2 px-4 rounded-xl text-[10px] font-mono transition-colors flex items-center justify-center gap-2"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(141,152,165,0.45)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#E8EDF2'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(141,152,165,0.45)'}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      Replay Onboarding Guide
                    </button>
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
                    const score = getSectorScore(channel as SectorChannel, data.weakness_breakdown);
                    const challengeTopic = custom?.recommended_challenge || sectorLabel;
                    const url = scenarioUrl(channel, challengeTopic);

                    return (
                      <motion.div
                        key={channel}
                        variants={up}
                        onClick={() => setSelectedSector({ channel, label: sectorLabel, description: sectorDesc, isPriority, score, challengeTopic, url, Icon })}
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
                              style={{ color: score === 0 ? 'rgba(141,152,165,0.3)' : 'rgba(165,184,255,0.7)' }}>
                              {score === 0 ? '—' : `${score}/100`}
                            </span>
                          </div>
                          <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: score === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, rgba(79,124,255,0.5), rgba(165,184,255,0.7))' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSector({ channel, label: sectorLabel, description: sectorDesc, isPriority, score, challengeTopic, url, Icon });
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
                      ← Back to Overview
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
          const historyItems = data.decision_journey.filter(
            d => (d as any).channel === selectedSector.channel ||
                 (selectedSector.channel === 'email' && !(d as any).channel)
          );
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
                        <ScoreBadge score={selectedSector.score} isPriority={selectedSector.isPriority} />
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
                      <span className="text-[11px] font-mono" style={{ color: selectedSector.score === 0 ? 'rgba(141,152,165,0.4)' : 'rgba(165,184,255,0.7)' }}>
                        {selectedSector.score === 0 ? 'Not yet evaluated' : `${selectedSector.score} / 100`}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${selectedSector.score}%`,
                          background: selectedSector.score === 0
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
                        <span>Completed in this Sector ({historyItems.length})</span>
                      </h4>
                      {historyItems.length > 0 && (
                        <span className="text-[9px] font-mono" style={{ color: 'rgba(141,152,165,0.4)' }}>Evaluated by Agent</span>
                      )}
                    </div>

                    {historyItems.length === 0 ? (
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
                        {historyItems.map((item, idx) => (
                          <div key={item.id || idx} className="p-3.5 rounded-xl flex items-start justify-between gap-3"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                            <div className="flex items-start gap-2.5">
                              {item.is_safe
                                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(165,184,255,0.6)' }} />
                                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(141,152,165,0.5)' }} />
                              }
                              <div>
                                <p className="text-[12px] font-semibold text-primary">{item.title}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(141,152,165,0.5)' }}>
                                  Vector: <strong className="text-primary/70">{item.threat}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-mono tabular-nums"
                                style={{ color: item.is_safe ? 'rgba(165,184,255,0.7)' : 'rgba(141,152,165,0.5)' }}>
                                {item.score}/100
                              </span>
                              <p className="text-[9px] font-mono mt-0.5" style={{ color: 'rgba(141,152,165,0.4)' }}>{item.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
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
    </main>
  );
}
