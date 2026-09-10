"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { FirstUserGuide } from '@/components/FirstUserGuide';
import { Circle, Lightbulb, ScrollText, X, Shield, Compass, Target } from 'lucide-react';

interface DashboardData {
  user: {
    id: string;
    name: string;
    role: string;
    company?: string;
    department?: string;
    access_role: string;
  };
  readiness_score: number;
  feedback_headline: string;
  next_situation: {
    title: string;
    role: string;
    category: string;
    difficulty: string;
    estimated_minutes: number;
    tactic_target: string;
  };
  decision_journey: Array<{
    id: number;
    title: string;
    threat: string;
    score: number;
    status: string;
    is_safe: boolean;
  }>;
  weakness_breakdown: Record<string, number>;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    user: { 
      id: "", 
      name: "", 
      role: "Employee", 
      company: "",
      department: "",
      access_role: "learner" 
    },
    readiness_score: 0,
    feedback_headline: "Welcome — your first adaptive simulation is ready. Let's establish your baseline.",
    next_situation: {
      title: "A payment request that cannot wait.",
      role: "Employee",
      category: "Payment & Invoice Verification",
      difficulty: "medium",
      estimated_minutes: 3,
      tactic_target: "urgency_bias"
    },
    decision_journey: [],
    weakness_breakdown: {
      "Phishing & Spoofing": 0,
      "Urgency & BEC Defense": 0,
      "Data Protection & Privacy": 0,
      "Policy Compliance & Verification": 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [policiesCount, setPoliciesCount] = useState<number>(3);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // 0. Handle OAuth callback from Supabase (e.g., Google login redirect)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        localStorage.setItem('cyberguard_token', accessToken);
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const oauthUser = {
            id: payload.sub || payload.id,
            email: payload.email,
            full_name: payload.user_metadata?.full_name || payload.user_metadata?.name || payload.email?.split('@')[0],
            role: payload.user_metadata?.role || 'Employee',
            company: payload.user_metadata?.company || 'Your Organization',
            access_role: payload.app_metadata?.access_role || 'learner'
          };
          localStorage.setItem('cyberguard_user', JSON.stringify(oauthUser));
        } catch (e) {}
        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // 1. Check for stored session & organization onboarding details
    const storedUser = localStorage.getItem('cyberguard_user');
    const token = localStorage.getItem('cyberguard_token');
    let currentCompany = 'Your Organization';

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        currentCompany = u.company || 'Your Organization';
        setData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            name: u.full_name || u.name || u.email || 'User',
            role: u.role || 'Employee',
            company: u.company || 'Your Organization',
            department: u.department || ''
          }
        }));

        if (u.policies_count) {
          setPoliciesCount(Number(u.policies_count));
        }
      } catch (e) {}
    }

    const storedCount = localStorage.getItem('cyberguard_policies_count');
    if (storedCount) {
      setPoliciesCount(Number(storedCount));
    }

    // 2. Fetch live policy count from backend for this company
    fetch(`http://localhost:8000/api/org/policies/${encodeURIComponent(currentCompany)}`)
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success && typeof resData.count === 'number') {
          setPoliciesCount(resData.count);
        }
      })
      .catch(() => {});

    // 3. Fetch live dashboard data — pass JWT so backend returns the real user's data
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('http://localhost:8000/api/coach/dashboard-summary', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Not authorised');
        return res.json();
      })
      .then(resData => {
        if (resData && resData.success) {
          setData(prev => {
            const { user: apiUser, ...restApiData } = resData;
            return {
              ...prev,
              ...restApiData,
              user: {
                ...apiUser,
                ...prev.user, // localStorage values take precedence (name, company, dept)
              }
            };
          });
        }
      })
      .catch(() => {
        // Backend offline or token invalid — keep localStorage-seeded state
      })
      .finally(() => setLoading(false));

    // 4. Check if first-time user tour should be displayed
    const tourCompleted = localStorage.getItem('cyberguard_tour_completed');
    if (!tourCompleted) {
      setShowTour(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cyberguard_token');
    localStorage.removeItem('cyberguard_user');
    router.push('/login');
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans selection:bg-blue/20 flex flex-col">
      
      {/* First-User Interactive Walkthrough Guide */}
      <FirstUserGuide
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        userRole={data.user.role}
        companyName={data.user.company || "TechCorp Global"}
      />

      {/* Top Navigation */}
      <nav className="w-full z-40 pt-8 pb-4 shrink-0 border-b border-primary/5">
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Target className="w-6 h-6 text-cyan opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="font-semibold tracking-tight text-lg">CyberGuard AI</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Guide & Tips Walkthrough Trigger */}
            <button
              onClick={() => setShowTour(true)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan/10 text-cyan hover:bg-cyan/20 transition-all cursor-pointer border border-cyan/20"
              title="Open Navigation Tour & Pro Tips"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="tracking-wide">Tour & Tips</span>
            </button>

            {/* Policy Onboarding Shortcut */}
            <Link
              href="/onboarding"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/5 text-muted hover:text-primary hover:bg-primary/10 transition-colors border border-primary/10"
              title="Update Organizational Security Policies"
            >
              <ScrollText className="w-4 h-4" />
              <span>Policies</span>
            </Link>

            {/* Role & Org Badge */}
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue/10 text-cyan uppercase tracking-wider">
              {data.user.role}
            </span>

            {/* Sign Out */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-muted hover:text-red-400 transition-colors tracking-wide ml-2"
              title="Sign Out"
            >
              <span>{data.user.name.split(' ')[0]}</span>
              <X className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <motion.div 
        initial="hidden" animate="visible" variants={staggerContainer}
        className="flex-1 max-w-[1600px] w-full mx-auto px-8 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start"
      >
        
        {/* LEFT COLUMN: Coach Narrative & Next Challenge (Col span 5) */}
        <motion.div variants={fadeUp} className="lg:col-span-5 flex flex-col justify-start h-full pr-4">
          
          {/* Welcome & Organization Context Header */}
          <div className="mb-4">
            <p className="text-xs tracking-widest uppercase text-muted font-bold mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
              {data.user.company || 'TechCorp Global'} • {data.user.department || 'Finance & Accounting'}
            </p>
            <p className="text-xs text-muted font-medium">
              Logged in as <strong className="text-primary font-semibold">{data.user.name}</strong> ({data.user.role})
            </p>
          </div>

          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.3] mb-8 opacity-90 max-w-lg text-primary">
            {data.feedback_headline}
          </h1>

          {/* Organization Security Grounding Telemetry Card */}
          <div className="mb-8 p-5 rounded-2xl bg-surface/80 border border-primary/10 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Policy Grounding Active
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                    HF Vectorized
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  <strong className="text-cyan font-bold">{policiesCount} rules</strong> grounded in {data.user.company || 'TechCorp Global'} SOPs
                </p>
              </div>
            </div>

            <Link
              href="/onboarding"
              className="text-xs font-semibold text-cyan hover:underline tracking-wide"
            >
              Update →
            </Link>
          </div>

          {/* The Next Situation Frame */}
          <div className="relative bg-surface rounded-[2.5rem] p-8 md:p-10 border border-primary/5 overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber/80"></div>
            
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber opacity-80 animate-pulse"></span>
              Coach Recommended Challenge
            </p>
            
            <h2 className="text-2xl font-semibold tracking-tight mb-3 relative z-10 text-primary">
              {data.next_situation.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-2 mb-8 relative z-10">
              <span className="text-xs font-semibold px-3 py-1 bg-primary/5 text-muted rounded-full">
                {data.next_situation.category}
              </span>
              <span className="text-xs font-semibold px-3 py-1 bg-amber/10 text-amber rounded-full capitalize">
                Diff: {data.next_situation.difficulty}
              </span>
              <span className="text-xs font-semibold px-3 py-1 bg-primary/5 text-muted rounded-full">
                {data.next_situation.estimated_minutes} min
              </span>
            </div>
            
            <Link 
              href={`/scenario?role=${encodeURIComponent(data.user.role)}&company=${encodeURIComponent(data.user.company || 'TechCorp Global')}&difficulty=${data.next_situation.difficulty}&topic=${encodeURIComponent(data.next_situation.category)}`}
              className="inline-flex items-center gap-3 text-blue hover:text-cyan font-semibold text-sm uppercase tracking-widest transition-all group-hover:translate-x-1"
            >
              Enter situation <span className="text-xl font-light">→</span>
            </Link>
          </div>

          {/* Weakness Breakdown Telemetry section removed for now */}
        </motion.div>

        {/* CENTER COLUMN: Decision Journey (Col span 4) */}
        <motion.div variants={fadeUp} className="lg:col-span-4 flex flex-col justify-start h-full relative border-l border-primary/10 pl-8 lg:pl-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted">
              Longitudinal Decision Journey
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan/10 text-cyan">
              Live Evaluation
            </span>
          </div>
          
          <div className="w-full flex flex-col relative space-y-8 mt-2">
            {data.decision_journey.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5 text-muted" />
                </div>
                <p className="text-xs font-semibold text-muted">No simulations yet</p>
                <p className="text-[11px] text-muted/60 mt-1 max-w-[180px] leading-relaxed">
                  Complete your first scenario to start building your decision journey.
                </p>
              </div>
            ) : (
              data.decision_journey.map((step, idx) => (
                <div key={step.id} className="flex gap-4 items-start relative group">
                  <div className="relative z-10 mt-1 bg-background w-4 h-4 flex items-center justify-center rounded-full border-2 border-primary/20">
                    <div className={`w-1.5 h-1.5 rounded-full ${step.is_safe ? 'bg-cyan shadow-[0_0_8px_rgba(92,200,215,0.8)]' : 'bg-amber'}`}></div>
                  </div>
                  <div className="flex-1 bg-surface/40 p-4 rounded-xl border border-primary/5 hover:border-primary/15 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-muted">
                        0{idx + 1} / {step.threat}
                      </span>
                      <span className={`text-xs font-semibold ${step.is_safe ? 'text-cyan' : 'text-amber'}`}>
                        {step.score}/100
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight text-primary">
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted mt-1">
                      {step.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="mt-10 p-5 rounded-2xl bg-cyan/5 border border-cyan/15">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-cyan flex-shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-cyan uppercase tracking-wider mb-1">
                  Responsible AI (RAI) Grounding
                </h5>
                <p className="text-[11px] text-muted leading-relaxed">
                  All simulated phishing payloads and domains are benign, non-executable, and strictly audited under our Responsible AI framework.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Readiness Score & Metrics (Col span 3) */}
        <motion.div variants={fadeUp} className="lg:col-span-3 flex flex-col justify-between h-full pl-4 py-2 relative">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-8">
              Defense Readiness Score
            </h3>

            <div>
              <div className="text-[85px] font-semibold tracking-tighter leading-none mb-4 text-primary flex items-start">
                {data.readiness_score}<span className="text-2xl font-medium text-muted mt-3 ml-1">/100</span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-muted">
                Calculated dynamically across threat recognition, response timeliness, and reasoning consistency against {data.user.company || 'TechCorp Global'} policies.
              </p>
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 mt-12 pt-8 border-t border-primary/10">
             <div>
               <div className="text-2xl font-semibold tracking-tighter mb-1 text-primary">
                 0{data.decision_journey.length}
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Simulations</div>
             </div>
             <div>
               <div className="text-2xl font-semibold tracking-tighter mb-1 text-cyan">
                 0{policiesCount}
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Policies Vectorized</div>
             </div>
             <div>
               <div className="text-2xl font-semibold tracking-tighter mb-1 text-amber">
                 {data.next_situation.difficulty}
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Next Tier</div>
             </div>
             <div>
               <div className="text-2xl font-semibold tracking-tighter mb-1 text-emerald-400">
                 100%
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">RAI Audited</div>
             </div>
          </div>

          {/* Re-open Tour Shortcut */}
          <div className="mt-8 pt-6 border-t border-primary/5">
            <button
              onClick={() => setShowTour(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-primary/5 hover:bg-primary/10 text-muted hover:text-primary text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Replay Onboarding Guide</span>
            </button>
          </div>

        </motion.div>

      </motion.div>
    </main>
  );
}
