"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface DashboardData {
  user: {
    id: string;
    name: string;
    role: string;
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
    user: { id: "1111", name: "Nimal Perera", role: "Finance Manager", access_role: "learner" },
    readiness_score: 76,
    feedback_headline: "You're getting better at noticing when urgency is being used against you.",
    next_situation: {
      title: "A payment request that cannot wait.",
      role: "Finance Manager",
      category: "Urgency Indicators & BEC",
      difficulty: "medium",
      estimated_minutes: 3,
      tactic_target: "urgency_bias"
    },
    decision_journey: [
      { id: 1, title: "Wire Transfer Authorization", threat: "Executive Impersonation", score: 40, status: "Learning Opportunity", is_safe: false },
      { id: 2, title: "Vendor Invoice Adjustment", threat: "Spoofed Domain", score: 85, status: "Defense Mastered", is_safe: true },
      { id: 3, title: "Password Reset Alert", threat: "Credential Harvesting", score: 92, status: "Defense Mastered", is_safe: true }
    ],
    weakness_breakdown: {
      "Phishing & Spoofing": 82,
      "Urgency & BEC Defense": 45,
      "Data Protection": 78,
      "Identity Verification": 60
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for stored session
    const storedUser = localStorage.getItem('cyberguard_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setData(prev => ({ ...prev, user: { ...prev.user, name: u.full_name || u.email, role: u.role || 'Finance Manager' } }));
      } catch (e) {}
    }

    // 2. Fetch live data from Member 3 Coach Agent API
    fetch('http://localhost:8000/api/coach/dashboard-summary')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.success) {
          setData(resData);
        }
      })
      .catch(() => {
        // Retain initial structured data if API offline
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cyberguard_token');
    localStorage.removeItem('cyberguard_user');
    router.push('/login');
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans selection:bg-blue/20 flex flex-col">
      
      {/* Navigation */}
      <nav className="w-full z-50 pt-8 pb-4 shrink-0">
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
            <span className="font-semibold tracking-tight text-lg">CyberGuard AI</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue/10 text-cyan uppercase tracking-wider">
              {data.user.role}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-muted hover:text-red-400 transition-colors tracking-wide"
              title="Sign Out"
            >
              <span>{data.user.name}</span>
              <span className="text-xs opacity-60">✕</span>
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
          <p className="text-sm tracking-widest uppercase text-muted font-semibold mb-4 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue opacity-50"></span> Good afternoon, {data.user.name.split(' ')[0]}
          </p>
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.3] mb-10 opacity-90 max-w-lg text-primary">
            {data.feedback_headline}
          </h1>

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
              href={`/scenario?role=${encodeURIComponent(data.user.role)}&difficulty=${data.next_situation.difficulty}&topic=${encodeURIComponent(data.next_situation.category)}`}
              className="inline-flex items-center gap-3 text-blue hover:text-cyan font-semibold text-sm uppercase tracking-widest transition-all group-hover:translate-x-1"
            >
              Enter situation <span className="text-xl font-light">→</span>
            </Link>
          </div>

          {/* Weakness Breakdown Telemetry */}
          <div className="mt-8 p-6 rounded-2xl bg-surface/60 border border-primary/5">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-4">
              Vulnerability Competency Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(data.weakness_breakdown).map(([label, score]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold text-primary">{score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${score < 50 ? 'bg-amber' : score < 75 ? 'bg-blue' : 'bg-cyan'}`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CENTER COLUMN: Decision Journey (Col span 4) */}
        <motion.div variants={fadeUp} className="lg:col-span-4 flex flex-col justify-start h-full relative border-l border-primary/10 pl-8 lg:pl-10">
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6">
            Longitudinal Decision Journey
          </h3>
          
          <div className="w-full flex flex-col relative space-y-8 mt-2">
            {data.decision_journey.map((step, idx) => (
              <div key={step.id} className="flex gap-4 items-start relative group">
                <div className="relative z-10 mt-1 bg-background w-4 h-4 flex items-center justify-center rounded-full border-2 border-primary/20">
                  <div className={`w-1.5 h-1.5 rounded-full ${step.is_safe ? 'bg-cyan shadow-[0_0_8px_rgba(92,200,215,0.8)]' : 'bg-amber'}`}></div>
                </div>
                <div className="flex-1 bg-surface/40 p-4 rounded-xl border border-primary/5">
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
            ))}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Readiness Score & Metrics (Col span 3) */}
        <motion.div variants={fadeUp} className="lg:col-span-3 flex flex-col justify-between h-full pl-4 py-2 relative">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-8">
              Readiness Score
            </h3>

            <div>
              <div className="text-[85px] font-semibold tracking-tighter leading-none mb-4 text-primary flex items-start">
                {data.readiness_score}<span className="text-2xl font-medium text-muted mt-3 ml-1">/100</span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-muted">
                Calculated dynamically across threat recognition, response timeliness, and reasoning consistency.
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
                 04
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Vectors Tracked</div>
             </div>
             <div>
               <div className="text-2xl font-semibold tracking-tighter mb-1 text-amber">
                 {data.next_situation.difficulty}
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Next Tier</div>
             </div>
             <div>
               <div className="text-2xl font-semibold tracking-tighter mb-1 text-primary">
                 100%
               </div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">RAI Audited</div>
             </div>
          </div>

        </motion.div>

      </motion.div>
    </main>
  );
}
