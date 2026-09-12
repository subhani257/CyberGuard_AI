"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FirstUserGuide } from '@/components/FirstUserGuide';
import {
  Lightbulb, ScrollText, X, Shield, Compass, Target,
  Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, HardDrive,
  LayoutDashboard, Map, History, Sparkles, CheckCircle2, AlertCircle, ArrowRight
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
// Training sector config
// ─────────────────────────────────────────────────────────────────────────────
const TRAINING_SECTORS = [
  { channel: 'voice_phone',    label: 'Voice & Vishing',  description: 'Phone-based social engineering & authority impersonation', Icon: Phone,         color: 'cyan'  },
  { channel: 'email',          label: 'Email & BEC',      description: 'Business email compromise, spoofing & urgency manipulation', Icon: Mail,          color: 'blue'  },
  { channel: 'slack_teams',    label: 'Slack / Teams',    description: 'Chat-platform attacks, credential leakage & impersonation', Icon: MessageSquare, color: 'teal'  },
  { channel: 'qr_code',        label: 'QR / Quishing',   description: 'Malicious QR codes in physical or digital environments',    Icon: QrCode,        color: 'amber' },
  { channel: 'cloud_oauth',    label: 'Cloud & OAuth',   description: 'Malicious app consent, token hijacking & cloud takeover',   Icon: Cloud,         color: 'blue'  },
  { channel: 'sms_push',       label: 'MFA Fatigue',     description: 'Push-bombing, SIM swap and MFA bypass techniques',         Icon: Smartphone,    color: 'coral' },
  { channel: 'physical_media', label: 'Physical Media',  description: 'USB drops, rogue hardware & physical access exploitation',  Icon: HardDrive,     color: 'muted' },
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

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  cyan:  { bg: 'bg-cyan/10',   text: 'text-cyan',  border: 'border-cyan/20',    bar: 'bg-cyan'  },
  blue:  { bg: 'bg-blue/10',   text: 'text-blue',  border: 'border-blue/20',    bar: 'bg-blue'  },
  teal:  { bg: 'bg-teal/10',   text: 'text-teal',  border: 'border-teal/20',    bar: 'bg-teal'  },
  amber: { bg: 'bg-amber/10',  text: 'text-amber', border: 'border-amber/20',   bar: 'bg-amber' },
  coral: { bg: 'bg-coral/10',  text: 'text-coral', border: 'border-coral/20',   bar: 'bg-coral' },
  muted: { bg: 'bg-primary/5', text: 'text-muted', border: 'border-primary/10', bar: 'bg-muted' },
};

function getSectorScore(channel: SectorChannel, breakdown: Record<string, number>): number {
  const keys = CHANNEL_SCORE_MAP[channel] || [];
  const values = keys.map(k => breakdown[k] ?? 0).filter(v => v > 0);
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function StatusBadge({ score, isPriority }: { score: number; isPriority: boolean }) {
  if (isPriority)  return <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber/15 text-amber border border-amber/25">Priority</span>;
  if (score === 0) return <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/5 text-muted border border-primary/10">New</span>;
  if (score >= 80) return <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Mastered</span>;
  if (score < 40)  return <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/20">Weak</span>;
  return <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">Active</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab bar
// ─────────────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'arena';

const TABS = [
  { id: 'overview' as TabId, label: 'Overview',     Icon: LayoutDashboard, accent: 'text-cyan' },
  { id: 'arena'    as TabId, label: 'Training Map', Icon: Map,             accent: 'text-blue' },
];

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex justify-center py-3 shrink-0">
      <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-surface/80 border border-primary/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        {/* Sliding pill */}
        <motion.div
          layoutId="tab-pill"
          className="absolute inset-y-1 rounded-xl bg-primary/8 border border-primary/12 pointer-events-none"
          style={{
            left: active === 'overview' ? '4px' : '50%',
            right: active === 'overview' ? '50%' : '4px',
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        />
        {TABS.map(({ id, label, Icon, accent }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors duration-200 select-none
              ${active === id ? accent : 'text-muted hover:text-primary'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="uppercase tracking-widest">{label}</span>
            {id === 'arena' && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-colors ${active === id ? 'bg-blue/20 text-blue' : 'bg-primary/5 text-muted'}`}>AI</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
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

  const [policiesCount, setPoliciesCount] = useState<number>(3);
  const [showTour, setShowTour]         = useState(false);
  const [priorityChannel, setPriority]  = useState('voice_phone');
  const [nextDifficulty, setDifficulty] = useState('beginner');
  const [personalizedMap, setPersonalizedMap] = useState<any[]>([]);

  interface SelectedSectorModalData {
    channel: string;
    label: string;
    description: string;
    isPriority: boolean;
    score: number;
    tokens: { bg: string; text: string; border: string; bar: string };
    challengeTopic: string;
    url: string;
    Icon: React.ElementType;
  }
  const [selectedSector, setSelectedSector] = useState<SelectedSectorModalData | null>(null);

  useEffect(() => {
    // Check if redirected from first-time onboarding or requested training_map tab
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      const isFirstTime = localStorage.getItem('cyberguard_first_time') === '1';

      if (tabParam === 'training_map' || tabParam === 'arena' || isFirstTime) {
        setActiveTab('arena');
        localStorage.removeItem('cyberguard_first_time');
      }
    }

    // 0. OAuth callback
    if (typeof window !== 'undefined' && window.location.hash) {
      const hp = new URLSearchParams(window.location.hash.substring(1));
      const at = hp.get('access_token');
      if (at) {
        localStorage.setItem('cyberguard_token', at);
        try {
          const p = JSON.parse(atob(at.split('.')[1]));
          const ou = { id: p.sub || p.id, email: p.email, full_name: p.user_metadata?.full_name || p.user_metadata?.name || p.email?.split('@')[0], role: p.user_metadata?.role || 'Employee', company: p.user_metadata?.company || 'Your Organization', access_role: p.app_metadata?.access_role || 'learner' };
          const ex = localStorage.getItem('cyberguard_user');
          let ep = null;
          if (ex) { try { const ep2 = JSON.parse(ex); if (ep2.id === ou.id) ep = ep2.learning_profile || null; } catch (_) {} }
          localStorage.setItem('cyberguard_user', JSON.stringify({ ...ou, ...(ep ? { learning_profile: ep } : {}) }));
          fetch('http://localhost:8000/api/auth/sync-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: ou.id, email: ou.email, full_name: ou.full_name, role: ou.role }) }).catch(() => {});
        } catch (_) {}
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // New-user detection
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

    // 1. localStorage
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
        if (u.learning_profile?.training_map && Array.isArray(u.learning_profile.training_map)) {
          setPersonalizedMap(u.learning_profile.training_map);
        }
        if (u.policies_count) setPoliciesCount(Number(u.policies_count));
      } catch (_) {}
    }
    const sc = localStorage.getItem('cyberguard_policies_count');
    if (sc) setPoliciesCount(Number(sc));

    // 2. API calls
    fetch(`http://localhost:8000/api/org/policies/${encodeURIComponent(company)}`).then(r => r.json()).then(d => { if (d?.success && typeof d.count === 'number') setPoliciesCount(d.count); }).catch(() => {});
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('http://localhost:8000/api/coach/dashboard-summary', { headers })
      .then(r => { if (!r.ok) throw new Error('unauth'); return r.json(); })
      .then(d => {
        if (d?.success) {
          setData(prev => { const { user: au, ...rest } = d; return { ...prev, ...rest, user: { ...au, ...prev.user } }; });
          if (d.learning_profile?.target_channel) setPriority(d.learning_profile.target_channel);
          if (d.learning_profile?.next_difficulty) setDifficulty(d.learning_profile.next_difficulty);
          if (d.training_map && Array.isArray(d.training_map)) {
            setPersonalizedMap(d.training_map);
          } else if (d.learning_profile?.training_map && Array.isArray(d.learning_profile.training_map)) {
            setPersonalizedMap(d.learning_profile.training_map);
          }
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
    visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  };

  const up: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
  };

  return (
    /* ── Viewport-locked shell ──────────────────────────────────────────── */
    <main className="h-screen overflow-hidden bg-background text-primary font-sans selection:bg-blue/20 flex flex-col">

      <FirstUserGuide isOpen={showTour} onClose={() => setShowTour(false)} userRole={data.user.role} companyName={data.user.company || 'TechCorp Global'} />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="shrink-0 border-b border-primary/5 py-4">
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Target className="w-5 h-5 text-cyan opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="font-semibold tracking-tight">Midnight Intelligence</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTour(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan/10 text-cyan hover:bg-cyan/20 transition-all border border-cyan/20">
              <Lightbulb className="w-3.5 h-3.5" /><span className="tracking-wide">Tour & Tips</span>
            </button>
            <Link href="/onboarding" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/5 text-muted hover:text-primary hover:bg-primary/10 transition-colors border border-primary/10">
              <ScrollText className="w-3.5 h-3.5" /><span>Policies</span>
            </Link>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue/10 text-cyan uppercase tracking-wider">{data.user.role}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-red-400 transition-colors ml-1">
              <span>{data.user.name.split(' ')[0]}</span>
              <X className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="max-w-[1600px] w-full mx-auto px-8 md:px-12 shrink-0">
        <TabBar active={activeTab} onChange={setActiveTab} />
      </div>

      {/* ── Tab content — fills remaining height, no page scroll ─────────── */}
      <div className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-8 md:px-12 pb-4">
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════
              OVERVIEW TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="h-full">
              <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                {/* LEFT — Coach Narrative */}
                <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-hide min-h-0">

                  {/* User context */}
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-muted font-bold mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
                      {data.user.company || 'TechCorp Global'} • {data.user.department || 'Finance & Accounting'}
                    </p>
                    <p className="text-[11px] text-muted">
                      Logged in as <strong className="text-primary">{data.user.name}</strong> ({data.user.role})
                    </p>
                  </div>

                  {/* Headline */}
                  <h1 className="text-xl lg:text-2xl font-semibold tracking-tight leading-[1.3] text-primary max-w-lg">
                    {data.feedback_headline}
                  </h1>

                  {/* Policy card */}
                  <div className="p-4 rounded-2xl bg-surface/80 border border-primary/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary">Policy Grounding Active</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">HF Vectorized</span>
                        </div>
                        <p className="text-[10px] text-muted mt-0.5">
                          <strong className="text-cyan font-bold">{policiesCount} rules</strong> grounded in {data.user.company || 'TechCorp Global'} SOPs
                        </p>
                      </div>
                    </div>
                    <Link href="/onboarding" className="text-[10px] font-semibold text-cyan hover:underline tracking-wide shrink-0">Update →</Link>
                  </div>

                  {/* Coach Recommended Challenge */}
                  <div className="relative bg-surface rounded-2xl p-5 border border-primary/5 overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-shadow shrink-0">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber/80 rounded-l-2xl"></div>
                    <p className="text-[9px] font-bold tracking-widest uppercase text-muted mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber opacity-80 animate-pulse"></span>
                      Coach Recommended Challenge
                    </p>
                    <h2 className="text-lg font-semibold tracking-tight mb-2 relative z-10 text-primary leading-snug">
                      {data.next_situation.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mb-5 relative z-10">
                      <span className="text-[10px] font-semibold px-2.5 py-1 bg-primary/5 text-muted rounded-full">{data.next_situation.category}</span>
                      <span className="text-[10px] font-semibold px-2.5 py-1 bg-amber/10 text-amber rounded-full capitalize">Diff: {data.next_situation.difficulty}</span>
                      <span className="text-[10px] font-semibold px-2.5 py-1 bg-primary/5 text-muted rounded-full">{data.next_situation.estimated_minutes} min</span>
                    </div>
                    <Link href={scenarioUrl(priorityChannel, data.next_situation.category)}
                      className="inline-flex items-center gap-2 text-blue hover:text-cyan font-semibold text-xs uppercase tracking-widest transition-all group-hover:translate-x-1">
                      Enter situation <span className="text-base font-light">→</span>
                    </Link>
                  </div>

                  {/* Jump to Training Map */}
                  <button onClick={() => setActiveTab('arena')}
                    className="py-2.5 rounded-xl border border-primary/8 bg-surface/40 hover:bg-blue/5 hover:border-blue/20 text-muted hover:text-blue text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group shrink-0">
                    <Map className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    View Training Map →
                  </button>
                </div>

                {/* CENTER — Decision Journey */}
                <div className="lg:col-span-4 flex flex-col min-h-0 border-l border-primary/10 pl-6 lg:pl-8">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="text-[9px] font-bold tracking-widest uppercase text-muted">Longitudinal Decision Journey</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan/10 text-cyan">Live Evaluation</span>
                  </div>

                  {/* Scrollable journey list */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                    {data.decision_journey.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                          <Target className="w-5 h-5 text-muted" />
                        </div>
                        <p className="text-xs font-semibold text-muted">No simulations yet</p>
                        <p className="text-[10px] text-muted/60 mt-1 max-w-[160px] leading-relaxed">
                          Complete your first scenario to start building your decision journey.
                        </p>
                      </div>
                    ) : (
                      data.decision_journey.map((step, idx) => (
                        <div key={step.id} className="flex gap-3 items-start group">
                          <div className="relative z-10 mt-1 bg-background w-4 h-4 flex items-center justify-center rounded-full border-2 border-primary/20 shrink-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${step.is_safe ? 'bg-cyan shadow-[0_0_8px_rgba(92,200,215,0.8)]' : 'bg-amber'}`}></div>
                          </div>
                          <div className="flex-1 bg-surface/40 p-3 rounded-xl border border-primary/5 hover:border-primary/15 transition-all">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold tracking-widest uppercase text-muted">0{idx + 1} / {step.threat}</span>
                              <span className={`text-[10px] font-semibold ${step.is_safe ? 'text-cyan' : 'text-amber'}`}>{step.score}/100</span>
                            </div>
                            <h4 className="text-xs font-semibold tracking-tight text-primary">{step.title}</h4>
                            <p className="text-[10px] text-muted mt-0.5">{step.status}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* RAI grounding */}
                  <div className="shrink-0 mt-4 p-4 rounded-2xl bg-cyan/5 border border-cyan/15">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[9px] font-bold text-cyan uppercase tracking-wider mb-1">Responsible AI (RAI) Grounding</h5>
                        <p className="text-[10px] text-muted leading-relaxed">All simulated payloads are benign, non-executable, and audited under our RAI framework.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Readiness Score */}
                <div className="lg:col-span-3 flex flex-col min-h-0 pl-4 py-1">
                  <h3 className="text-[9px] font-bold tracking-widest uppercase text-muted mb-4 shrink-0">Defense Readiness Score</h3>

                  <div className="shrink-0">
                    <div className="text-[72px] font-semibold tracking-tighter leading-none mb-2 text-primary flex items-start">
                      {data.readiness_score}<span className="text-xl font-medium text-muted mt-3 ml-1">/100</span>
                    </div>
                    <p className="text-[10px] font-medium leading-relaxed text-muted">
                      Calculated across threat recognition, response timeliness, and reasoning against {data.user.company || 'TechCorp Global'} policies.
                    </p>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-5 mt-6 pt-5 border-t border-primary/10 shrink-0">
                    <div>
                      <div className="text-xl font-semibold tracking-tighter mb-0.5 text-primary">0{data.decision_journey.length}</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-muted">Simulations</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold tracking-tighter mb-0.5 text-cyan">0{policiesCount}</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-muted">Policies Vectorized</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold tracking-tighter mb-0.5 text-amber capitalize">{nextDifficulty}</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-muted">Next Tier</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold tracking-tighter mb-0.5 text-emerald-400">100%</div>
                      <div className="text-[8px] font-bold uppercase tracking-widest text-muted">RAI Audited</div>
                    </div>
                  </div>

                  {/* Coach priority */}
                  <div className="mt-5 pt-5 border-t border-primary/5 shrink-0">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted mb-2">Coach's Top Priority</p>
                    <Link href={scenarioUrl(priorityChannel, data.next_situation.category)}
                      className="block p-3 rounded-xl bg-amber/5 border border-amber/15 hover:border-amber/30 transition-all group">
                      <p className="text-[11px] font-semibold text-primary mb-1 tracking-tight leading-snug">{data.next_situation.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-bold text-muted">{data.next_situation.category}</span>
                        <span className="text-[9px] font-bold text-amber capitalize">{data.next_situation.difficulty}</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber mt-1.5 block group-hover:translate-x-0.5 transition-transform">Enter situation →</span>
                    </Link>
                  </div>

                  {/* Tour button */}
                  <button onClick={() => setShowTour(true)}
                    className="mt-3 w-full py-2 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 text-muted hover:text-primary text-[10px] font-semibold transition-colors flex items-center justify-center gap-2 shrink-0">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Replay Onboarding Guide</span>
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TRAINING MAP TAB
          ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'arena' && (
            <motion.div key="arena" variants={slideIn} initial="hidden" animate="visible" exit="exit" className="h-full flex flex-col min-h-0">

              {/* Arena header — fixed height */}
              <div className="shrink-0 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-primary/5 mb-4">
                <div>
                  <p className="text-[9px] font-bold tracking-widest uppercase text-muted flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse"></span>
                    AI Coach • Role-Profiled Training Map
                  </p>
                  <h2 className="text-xl lg:text-2xl font-semibold tracking-tight text-primary">Training Map</h2>
                  <p className="text-xs text-muted mt-0.5 max-w-xl">
                    Seven attack channels personalized by Coach Agent for <strong className="text-primary font-medium">{data.user.role}</strong> at <strong className="text-primary font-medium">{data.user.company || 'your organization'}</strong>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-blue/10 text-blue border border-blue/20 uppercase tracking-wider">Tier: {nextDifficulty}</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-primary/5 text-muted border border-primary/10 uppercase tracking-wider">{data.user.role}</span>
                </div>
              </div>

              {/* Scrollable sector grid */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-hide">
                <motion.div
                  variants={stagger} initial="hidden" animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-2"
                >
                  {TRAINING_SECTORS.map(({ channel, label, description, Icon, color }, i) => {
                    const custom = personalizedMap.find(p => p.channel === channel);
                    const sectorLabel = custom?.label || label;
                    const sectorDesc = custom?.description || description;
                    const isPriority = custom ? (custom.is_priority || custom.priority_level === 'Priority' || channel === priorityChannel) : (channel === priorityChannel);
                    const score      = getSectorScore(channel as SectorChannel, data.weakness_breakdown);
                    const tokens     = COLOR_MAP[color] || COLOR_MAP.muted;
                    const challengeTopic = custom?.recommended_challenge || sectorLabel;
                    const url        = scenarioUrl(channel, challengeTopic);

                    return (
                      <motion.div key={channel} variants={up}
                        onClick={() => setSelectedSector({ channel, label: sectorLabel, description: sectorDesc, isPriority, score, tokens, challengeTopic, url, Icon })}
                        className={`relative group rounded-2xl p-4 border transition-all duration-300 flex flex-col cursor-pointer
                          ${isPriority
                            ? 'bg-gradient-to-br from-amber/8 to-amber/3 border-amber/25 hover:border-amber/45 hover:shadow-[0_0_25px_rgba(214,167,86,0.1)]'
                            : 'bg-surface/50 border-primary/8 hover:border-primary/20 hover:bg-surface/80'
                          }`}
                      >
                        {isPriority && <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber/50 to-transparent" />}

                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${tokens.bg} ${tokens.border}`}>
                            <Icon className={`w-4 h-4 ${tokens.text}`} />
                          </div>
                          <StatusBadge score={score} isPriority={isPriority} />
                        </div>

                        <h3 className="text-xs font-bold text-primary tracking-tight mb-0.5">{sectorLabel}</h3>
                        <p className="text-[10px] text-muted leading-relaxed mb-3 flex-1 line-clamp-2">{sectorDesc}</p>

                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted">Score</span>
                            <span className={`text-[9px] font-bold tabular-nums ${score === 0 ? 'text-muted/40' : tokens.text}`}>
                              {score === 0 ? '—' : `${score}/100`}
                            </span>
                          </div>
                          <div className="w-full h-0.5 bg-primary/6 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${score === 0 ? 'bg-primary/10' : tokens.bar}`}
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
                            setSelectedSector({ channel, label: sectorLabel, description: sectorDesc, isPriority, score, tokens, challengeTopic, url, Icon });
                          }}
                          className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all rounded-lg py-1.5 px-3 border self-start
                            ${isPriority
                              ? 'bg-amber/10 border-amber/25 text-amber hover:bg-amber/20'
                              : `bg-primary/5 border-primary/10 ${tokens.text} opacity-60 group-hover:opacity-100 group-hover:bg-primary/10`
                            }`}
                        >
                          <span>Sector Briefing</span>
                          <span>→</span>
                        </button>
                      </motion.div>
                    );
                  })}

                  {/* Info card */}
                  <motion.div variants={up} className="rounded-2xl p-4 border border-primary/5 bg-gradient-to-br from-blue/5 to-transparent flex flex-col justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue/10 border border-blue/20 flex items-center justify-center mb-3">
                      <Shield className="w-4 h-4 text-blue" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-primary tracking-tight mb-1.5">How the Coach profiles you</h4>
                      <p className="text-[10px] text-muted leading-relaxed">
                        The AI Coach analyzes your job role, department, and org data to identify which attack channels target people like you most often. Your <span className="text-amber font-bold">Priority</span> sector updates as you progress.
                      </p>
                    </div>
                    <button onClick={() => setActiveTab('overview')}
                      className="mt-3 text-[9px] font-bold text-blue hover:underline tracking-widest uppercase flex items-center gap-1">
                      ← Back to Overview
                    </button>
                  </motion.div>
                </motion.div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Sector Defense Briefing Modal (History & What's Next) ──────── */}
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
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                key="sector-modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-surface rounded-[2rem] border border-primary/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 md:p-8 flex flex-col max-h-[88vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-5 border-b border-primary/8 shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${selectedSector.tokens.bg} ${selectedSector.tokens.border} shadow-sm shrink-0`}>
                      <IconComponent className={`w-6 h-6 ${selectedSector.tokens.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/5 text-muted border border-primary/10">
                          {selectedSector.channel.replace('_', ' ').toUpperCase()}
                        </span>
                        <StatusBadge score={selectedSector.score} isPriority={selectedSector.isPriority} />
                      </div>
                      <h2 className="text-lg md:text-xl font-bold tracking-tight text-primary">
                        {selectedSector.label}
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSector(null)}
                    className="w-8 h-8 rounded-xl bg-primary/5 hover:bg-primary/10 text-muted hover:text-primary transition-colors flex items-center justify-center shrink-0"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-5 space-y-6 scrollbar-hide">
                  
                  {/* Defense Score & Context Strip */}
                  <div className="p-4 rounded-2xl bg-background/60 border border-primary/8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Sector Defense Score</span>
                      <span className={`text-xs font-bold ${selectedSector.score === 0 ? 'text-muted' : selectedSector.tokens.text}`}>
                        {selectedSector.score === 0 ? 'Not Yet Evaluated (0%)' : `${selectedSector.score} / 100`}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-primary/8 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${selectedSector.score === 0 ? 'bg-primary/10' : selectedSector.tokens.bar}`}
                        style={{ width: `${selectedSector.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {selectedSector.description}
                    </p>
                  </div>

                  {/* Section 1: Completed Simulation History */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-muted flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-cyan" />
                        <span>Completed in this Sector ({historyItems.length})</span>
                      </h4>
                      {historyItems.length > 0 && (
                        <span className="text-[9px] font-semibold text-emerald-400">Evaluated by Member 2</span>
                      )}
                    </div>

                    {historyItems.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-background/40 border border-dashed border-primary/10 text-center flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center mb-2">
                          <History className="w-4 h-4 text-muted/60" />
                        </div>
                        <p className="text-xs font-semibold text-muted">No past simulations in this sector yet</p>
                        <p className="text-[10px] text-muted/60 mt-0.5 max-w-xs leading-relaxed">
                          Your threat recognition score and defensive reasoning history will appear here after your first simulation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {historyItems.map((item, idx) => (
                          <div key={item.id || idx} className="p-3.5 rounded-xl bg-background/80 border border-primary/8 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              {item.is_safe ? (
                                <CheckCircle2 className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className="text-xs font-semibold text-primary">{item.title}</p>
                                <p className="text-[10px] text-muted mt-0.5">
                                  Vector: <strong className="text-primary/80">{item.threat}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-bold ${item.is_safe ? 'text-cyan' : 'text-amber'}`}>
                                {item.score}/100
                              </span>
                              <p className="text-[9px] text-muted">{item.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: What's Next */}
                  <div>
                    <h4 className="text-[10px] font-bold tracking-widest uppercase text-muted flex items-center gap-1.5 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-amber" />
                      <span>What's Next: Coach Target Challenge</span>
                    </h4>

                    <div className="p-4 rounded-2xl bg-amber/5 border border-amber/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber rounded-l-2xl" />
                      
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber bg-amber/10 px-2 py-0.5 rounded-full border border-amber/20">
                          {selectedSector.isPriority ? 'Coach Top Recommendation' : 'Adaptive Next Step'}
                        </span>
                        <span className="text-[10px] font-semibold text-muted">~3 min baseline</span>
                      </div>

                      <h3 className="text-sm font-bold text-primary mb-1.5">
                        {selectedSector.challengeTopic}
                      </h3>

                      <p className="text-[11px] text-muted leading-relaxed mb-3">
                        Simulates an authentic, unannounced attack over <strong className="text-primary">{selectedSector.channel.replace('_', ' ').toUpperCase()}</strong> to evaluate your response against corporate directives.
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-muted/80">
                        <span className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10">Diff: Beginner</span>
                        <span className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10">Audit: Benign RAI Payload</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-primary/8 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSector(null)}
                    className="py-2.5 px-4 rounded-xl border border-primary/10 hover:bg-primary/5 text-muted hover:text-primary text-xs font-semibold transition-colors"
                  >
                    Close Briefing
                  </button>

                  <Link
                    href={selectedSector.url}
                    className="py-2.5 px-6 rounded-xl bg-blue hover:bg-cyan hover:text-black text-white font-semibold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue/20 flex items-center gap-2"
                  >
                    <span>Launch This Scenario</span>
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
