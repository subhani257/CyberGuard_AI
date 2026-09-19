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
  LogOut, Clock, ChevronRight, ArrowLeft,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardData {
  user: { id: string; name: string; role: string; company?: string; department?: string; access_role: string; avatar_url?: string };
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
    user: { id: '', name: '', role: 'Employee', company: '', department: '', access_role: 'learner', avatar_url: '' },
    readiness_score: 0,
    feedback_headline: "Welcome — your first adaptive simulation is ready. Let's establish your baseline.",
    next_situation: { title: 'A payment request that cannot wait.', role: 'Employee', category: 'Payment & Invoice Verification', difficulty: 'beginner', estimated_minutes: 3, tactic_target: 'urgency_bias' },
    decision_journey: [],
    weakness_breakdown: { 'Phishing & Spoofing': 0, 'Urgency & BEC Defense': 0, 'Data Protection & Privacy': 0, 'Policy Compliance & Verification': 0 },
  });

  const [policiesCount, setPoliciesCount]   = useState<number>(3);
  const [showTour, setShowTour]             = useState(false);
  const [isProfileOpen, setIsProfileOpen]   = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [coachInput, setCoachInput]                 = useState('');
  const [coachTipModal, setCoachTipModal]           = useState<string | null>(null);
  const [priorityChannel, setPriority]      = useState('voice_phone');
  const [nextDifficulty, setDifficulty]     = useState('beginner');
  const [personalizedMap, setPersonalizedMap] = useState<any[]>([]);

  const handleAskCoach = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('urgency') || q.includes('checklist')) {
      setCoachTipModal("⚡ Urgency Bias Protocol: Attackers manufacture artificial time pressure to bypass dual-control checks. Verify any rush payment or credential request over an out-of-band confirmed phone number.");
    } else if (q.includes('sop') || q.includes('protocol') || q.includes('policy')) {
      setCoachTipModal(`📋 SOP Policy Verification: ${policiesCount} corporate rules are active for ${data.user.company || 'your organization'}. All external wire transfers above threshold require secondary signatory approval.`);
    } else if (q.includes('quish') || q.includes('qr')) {
      setCoachTipModal("📱 Quishing Defense: Never scan unknown QR codes in emails or physical areas to authorize login sessions. QR codes obscure destination URLs and bypass email scanner filters.");
    } else {
      setCoachTipModal(`💡 AI Coach Guidance for ${data.user.role}: When presented with unexpected requests, pause and inspect the sender header and cryptographic consent scopes before taking action.`);
    }
  };

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
        completedDecisions={data.decision_journey.length}
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
                      className="text-[10px] font-mono text-muted hover:text-primary transition-colors flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/15"
                    >
                      <span>Edit</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Center: Profile Picture & Greetings */}
                  <div className="flex flex-col items-center text-center my-1 relative z-10">
                    {/* Avatar Container with Ring */}
                    <div className="relative group cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 border-2 border-dashed border-blue/40 group-hover:border-blue transition-colors flex items-center justify-center">
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
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider text-white shadow-md shrink-0 whitespace-nowrap"
                        style={{
                          background: nextDifficulty === 'advanced' 
                            ? 'linear-gradient(90deg, #D96868, #E2847A)' 
                            : nextDifficulty === 'intermediate'
                            ? 'linear-gradient(90deg, #4F7CFF, #5CC8D7)'
                            : 'linear-gradient(90deg, #D96868, #E08560)',
                          boxShadow: '0 2px 8px rgba(217,104,104,0.35)'
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
                      <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-white/70">
                        {data.user.department || 'Corporate Operations'}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue/10 border border-blue/20 text-cyan">
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
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20 text-cyan">
                        Active Index
                      </span>
                    </div>

                    {/* Multi-color segment breakdown bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-1 bg-white/[0.04] mb-1.5 p-0.5">
                      <div 
                        style={{ width: `${Math.max(15, (data.weakness_breakdown['Phishing & Spoofing'] || 50) * 0.4)}%`, background: '#5CC8D7' }} 
                        className="h-full rounded-full transition-all duration-500" 
                        title="Phishing & Spoofing"
                      />
                      <div 
                        style={{ width: `${Math.max(15, (data.weakness_breakdown['Urgency & BEC Defense'] || 40) * 0.35)}%`, background: '#D6A756' }} 
                        className="h-full rounded-full transition-all duration-500" 
                        title="Urgency & BEC Defense"
                      />
                      <div 
                        style={{ width: `${Math.max(15, (data.weakness_breakdown['Policy Compliance & Verification'] || 60) * 0.35)}%`, background: '#4F7CFF' }} 
                        className="h-full rounded-full transition-all duration-500" 
                        title="Policy Compliance"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono text-muted/60">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan inline-block" /> Phish</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber inline-block" /> BEC</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue inline-block" /> Policy</span>
                    </div>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-2 mt-1 relative z-10">
                    <div className="p-2 sm:p-2.5 rounded-xl flex flex-col items-center text-center transition-all bg-white/[0.02] border border-white/[0.06] hover:border-white/12">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 bg-blue/10 text-cyan">
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="text-[14px] font-bold text-primary leading-none">07</span>
                      <span className="text-[8px] font-mono text-muted mt-0.5 uppercase tracking-tight">Vectors</span>
                    </div>

                    <Link href="/policies" className="p-2 sm:p-2.5 rounded-xl flex flex-col items-center text-center transition-all bg-white/[0.02] border border-white/[0.06] hover:border-white/12 group">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 bg-amber/10 text-amber group-hover:scale-105 transition-transform">
                        <ScrollText className="w-3 h-3" />
                      </div>
                      <span className="text-[14px] font-bold text-primary leading-none">0{policiesCount}</span>
                      <span className="text-[8px] font-mono text-muted mt-0.5 uppercase tracking-tight">Policies</span>
                    </Link>

                    <button 
                      onClick={() => setIsJourneyModalOpen(true)}
                      className="p-2 sm:p-2.5 rounded-xl flex flex-col items-center text-center transition-all bg-white/[0.02] border border-white/[0.06] hover:border-white/12 group cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-1 bg-coral/10 text-coral group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <span className="text-[14px] font-bold text-primary leading-none">{data.decision_journey.length}</span>
                      <span className="text-[8px] font-mono text-muted mt-0.5 uppercase tracking-tight">Simulated</span>
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
                          <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
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
                        className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-primary transition-colors flex items-center gap-1"
                      >
                        <span>View All (7)</span>
                        <ArrowRight className="w-3 h-3 text-cyan" />
                      </button>
                    </div>

                    {/* 3 Directive Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 flex-1 min-h-0">
                      {/* Card 1: Top Priority Coach Directive */}
                      <div className="p-3 rounded-xl flex flex-col justify-between bg-surface/90 border border-blue/30 shadow-md relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue to-cyan" />
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue/20 text-cyan border border-blue/30">
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
                            <span className="text-cyan font-bold">{data.readiness_score || 50}%</span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden mb-2">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-blue to-cyan"
                              style={{ width: `${Math.min(100, Math.max(15, data.readiness_score || 50))}%` }}
                            />
                          </div>

                          <Link
                            href={scenarioUrl(priorityChannel, data.next_situation.category)}
                            className="w-full py-1.5 px-2 rounded-lg bg-blue hover:bg-blue/90 text-white text-[11px] font-medium transition-all flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(79,124,255,0.2)]"
                          >
                            <span>Launch Scenario</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Card 2: Cloud & OAuth Directive */}
                      <div className="p-3 rounded-xl flex flex-col justify-between bg-surface/70 border border-white/[0.08] hover:border-white/15 transition-all group">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] text-muted border border-white/[0.08]">
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
                            <span className="text-primary font-bold">{getSectorScore('cloud_oauth', data.weakness_breakdown) || 68}%</span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden mb-2">
                            <div 
                              className="h-full rounded-full bg-cyan/70"
                              style={{ width: `${getSectorScore('cloud_oauth', data.weakness_breakdown) || 68}%` }}
                            />
                          </div>

                          <Link
                            href={scenarioUrl('cloud_oauth', 'Cloud & OAuth Consent Verification')}
                            className="w-full py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-primary text-[11px] font-medium border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center gap-1"
                          >
                            <span>Launch Scenario</span>
                            <ArrowRight className="w-3 h-3 text-muted" />
                          </Link>
                        </div>
                      </div>

                      {/* Card 3: Voice & BEC Directive */}
                      <div className="p-3 rounded-xl flex flex-col justify-between bg-surface/70 border border-white/[0.08] hover:border-white/15 transition-all group">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.04] text-muted border border-white/[0.08]">
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
                            <span className="text-primary font-bold">{getSectorScore('voice_phone', data.weakness_breakdown) || 54}%</span>
                          </div>
                          <div className="w-full h-1 rounded-full bg-white/[0.05] overflow-hidden mb-2">
                            <div 
                              className="h-full rounded-full bg-amber/70"
                              style={{ width: `${getSectorScore('voice_phone', data.weakness_breakdown) || 54}%` }}
                            />
                          </div>

                          <Link
                            href={scenarioUrl('voice_phone', 'Executive Wire Authorization Phone Call')}
                            className="w-full py-1.5 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-primary text-[11px] font-medium border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center gap-1"
                          >
                            <span>Launch Scenario</span>
                            <ArrowRight className="w-3 h-3 text-muted" />
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
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-muted">
                          Live Metrics ▾
                        </span>
                      </div>

                      {/* 4 Vertical Bars like Study process */}
                      <div className="flex-1 min-h-0 grid grid-cols-4 gap-2.5 items-end pt-1 pb-1">
                        {[
                          { label: 'Phishing', score: data.weakness_breakdown['Phishing & Spoofing'] || 66, highlight: false },
                          { label: 'BEC', score: data.weakness_breakdown['Urgency & BEC Defense'] || 40, highlight: false },
                          { label: 'Cloud OAuth', score: data.weakness_breakdown['Policy Compliance & Verification'] || 87, highlight: true },
                          { label: 'Data Privacy', score: data.weakness_breakdown['Data Protection & Privacy'] || 56, highlight: false },
                        ].map((bar, i) => (
                          <div key={i} className="flex flex-col items-center h-full justify-end group">
                            {/* Score pill */}
                            <span 
                              className={`text-[8px] font-mono font-semibold px-1 py-0.5 rounded mb-1 transition-all ${
                                bar.highlight 
                                  ? 'bg-blue text-white shadow-sm' 
                                  : 'bg-white/[0.05] text-muted group-hover:text-primary'
                              }`}
                            >
                              {bar.score}%
                            </span>
                            {/* Bar container */}
                            <div className="w-full max-w-[42px] h-20 sm:h-24 bg-white/[0.03] rounded-xl p-1 flex items-end">
                              <div 
                                className={`w-full rounded-lg transition-all duration-700 ${
                                  bar.highlight 
                                    ? 'bg-gradient-to-t from-blue to-cyan shadow-[0_0_12px_rgba(79,124,255,0.3)]' 
                                    : 'bg-white/[0.12] group-hover:bg-white/[0.2]'
                                }`}
                                style={{ height: `${Math.max(15, bar.score)}%` }}
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
                        background: 'radial-gradient(ellipse at top right, rgba(79,124,255,0.18) 0%, rgba(17,24,33,0.85) 75%)',
                        border: '1px solid rgba(79,124,255,0.25)',
                        backdropFilter: 'blur(14px)'
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-lg bg-blue/20 text-cyan flex items-center justify-center border border-blue/30">
                              <Sparkles className="w-3 h-3" />
                            </div>
                            <h3 className="text-[12px] font-bold text-primary tracking-tight">
                              AI Defense Coach
                            </h3>
                          </div>
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan/10 text-cyan border border-cyan/20">
                            Live
                          </span>
                        </div>

                        {/* Live Headline Bubble */}
                        <div className="p-2 sm:p-2.5 rounded-xl bg-black/30 border border-white/[0.06] mb-2">
                          <p className="text-[10px] text-primary/90 leading-snug font-sans line-clamp-2">
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
                            className="w-full pl-2.5 pr-8 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] focus:border-blue/70 text-[10px] text-primary placeholder:text-muted/50 transition-colors"
                          />
                          <button
                            type="submit"
                            className="absolute right-1 w-5 h-5 rounded-lg bg-blue hover:bg-blue/90 text-white flex items-center justify-center transition-colors shadow-sm"
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
                              className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] text-muted hover:text-primary border border-white/[0.06] transition-colors"
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
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-muted hover:text-primary transition-all mb-3"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-cyan" />
                    <span>← Return to Personnel Dashboard</span>
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

      {/* ── Decision Journey Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isJourneyModalOpen && (
          <motion.div
            key="journey-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsJourneyModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-2xl p-6 bg-[#0E141D] border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-coral" />
                  <h3 className="text-[16px] font-bold text-primary">
                    Simulated Decision History ({data.decision_journey.length})
                  </h3>
                </div>
                <button 
                  onClick={() => setIsJourneyModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1 scrollbar-hide">
                {data.decision_journey.length === 0 ? (
                  <div className="text-center py-12 text-muted text-xs font-mono">
                    No simulations completed yet. Launch a directive to establish your record!
                  </div>
                ) : (
                  data.decision_journey.map((step, idx) => (
                    <div key={step.id || idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-muted">
                            0{idx + 1} · {step.threat}
                          </span>
                          <span className={`text-[10px] font-mono ${step.is_safe ? 'text-cyan' : 'text-coral'}`}>
                            {step.status}
                          </span>
                        </div>
                        <p className="text-[12px] font-semibold text-primary">{step.title}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[14px] font-bold font-mono ${step.is_safe ? 'text-cyan' : 'text-muted'}`}>
                          {step.score}/100
                        </span>
                      </div>
                    </div>
                  ))
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl p-6 bg-[#0E141D] border border-blue/40 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-cyan font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Tactical Coach Advice</span>
                </div>
                <button 
                  onClick={() => setCoachTipModal(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted hover:text-primary transition-colors"
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
                  className="px-4 py-2 rounded-xl bg-blue text-white text-xs font-medium hover:bg-blue/90 transition-colors"
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
