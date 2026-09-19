"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_CASES = [
  {
    id: 'CG-0281',
    user: 'sarah.t@novatech.lk',
    role: 'HR Officer',
    scenario_type: 'Credential Verification',
    confidence: 54,
    ambiguity_level: 'High',
    reason_for_escalation: 'Conflicting behavioral signals',
    what_happened: {
      action: 'Replied to sender',
      reasoning: '"I replied asking them to verify their employee ID before I process the bank account change."'
    },
    ai_evidence: [
      { type: 'positive', text: 'Attempted identity verification before acting.' },
      { type: 'negative', text: 'Replied directly to suspected attacker.' },
      { type: 'negative', text: 'Confirmed active email account to external threat.' }
    ],
    relevant_policy: {
      id: 'HR-SEC-02',
      title: 'Identity Verification',
      text: 'Do not verify suspicious requests using the same channel the request arrived on.'
    },
    status: 'pending'
  },
  {
    id: 'CG-0282',
    user: 'kasun.perera@novatech.lk',
    role: 'Finance Manager',
    scenario_type: 'Urgent Payment (BEC)',
    confidence: 61,
    ambiguity_level: 'High',
    reason_for_escalation: 'Policy ambiguity regarding physical verification',
    what_happened: {
      action: 'Ignored the email',
      reasoning: '"I shouted across the room to David and he said he didn\'t send it, so I just ignored it."'
    },
    ai_evidence: [
      { type: 'positive', text: 'Did not comply with fraudulent request.' },
      { type: 'positive', text: 'Used out-of-band verification (verbal).' },
      { type: 'negative', text: 'Did not report the phishing email to IT.' }
    ],
    relevant_policy: {
      id: 'FIN-SEC-04',
      title: 'Payment Verification',
      text: 'Payment requests must be verified using an independent communication channel.'
    },
    status: 'pending'
  }
];// No mock data — real data loaded from the Admin API backed by LangGraph traces
type AiEvidence = { type: 'positive' | 'negative'; text: string };
type ReviewCase = {
  id: string;
  decision_id: string;
  user_id: string;
  scenario_id: string;
  chosen_action: string;
  reasoning: string;
  final_score: number;
  confidence: number;
  is_safe: boolean;
  ai_evidence: AiEvidence[];
  created_at: string;
  status: string;
};
type AgentBreakdown = { agent: string; avg_latency_s: number; call_count: number };
type PerformanceMetrics = {
  total_runs: number;
  avg_final_score: number;
  human_review_rate_pct: number;
  safe_rate_pct: number;
  agent_breakdown: AgentBreakdown[];
};

export default function AdminDashboard() {
  const router = useRouter();
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'performance'>('queue');
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [switching, setSwitching] = useState(false);

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const pendingCount = cases.filter(c => c.status === 'pending').length;

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;

  const loginAsAdmin = async () => {
    setSwitching(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@novatech.com', password: 'password123' }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('cyberguard_token', data.access_token);
        localStorage.setItem('cyberguard_user', JSON.stringify(data.user));
        setAccessDenied(false);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAccessDenied(true);
      setCurrentUserRole('unauthenticated');
      setLoading(false);
      return;
    }

    // 1. Verify admin role
    fetch('http://localhost:8000/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        const role = data?.user?.access_role;
        setCurrentUserRole(role || 'learner');
        if (role !== 'admin') {
          setAccessDenied(true);
          setLoading(false);
          return;
        }

        // 2. Load live review queue from LangGraph-backed API
        fetch('http://localhost:8000/api/admin/pending-reviews', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : Promise.reject(r))
          .then(resData => {
            if (resData.cases) {
              setCases(resData.cases);
              if (resData.cases.length > 0) {
                setSelectedCaseId(resData.cases[0].id);
              }
            }
          })
          .catch(err => console.warn('Pending reviews fetch failed:', err))
          .finally(() => setLoading(false));

        // 3. Load agent performance metrics
        fetch('http://localhost:8000/api/admin/performance', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : Promise.reject(r))
          .then(resData => { if (resData.metrics) setPerformance(resData.metrics); })
          .catch(err => console.warn('Performance fetch failed:', err));
      })
      .catch(() => {
        setAccessDenied(true);
        setCurrentUserRole('expired');
        setLoading(false);
      });
  }, [router]);

  const handleAction = async (decisionId: string, caseId: string, actionType: 'confirmed' | 'overridden') => {
    const token = getToken();
    try {
      await fetch(`http://localhost:8000/api/admin/resume/${decisionId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict: actionType, override_reason: overrideReason || null }),
      });
    } catch (err) {
      console.warn('Admin verdict API failed:', err);
    }
    setCases(cases.map(c => c.id === caseId ? { ...c, status: actionType } : c));
    setTimeout(() => { setSelectedCaseId(null); setShowOverrideForm(false); setOverrideReason(""); }, 1500);
  };

  if (accessDenied) {
    return (
      <main className="h-screen w-screen bg-[#07090D] text-primary flex items-center justify-center p-6 selection:bg-blue/20">
        <div className="max-w-md w-full bg-[#0D1219] border border-surface/80 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 text-amber flex items-center justify-center text-2xl mx-auto mb-5">
            🛡️
          </div>
          <h2 className="text-xl font-semibold mb-2 text-primary tracking-tight">Admin Privileges Required</h2>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            {currentUserRole === 'unauthenticated'
              ? 'You are not signed in. The SecOps Governance Console requires an active Administrator session.'
              : `You are signed in with the role "${currentUserRole}". The Governance Console requires an Administrator account.`}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={loginAsAdmin}
              disabled={switching}
              className="w-full py-3 bg-blue hover:bg-blue/90 text-white text-sm font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(79,124,255,0.25)] flex items-center justify-center gap-2"
            >
              {switching ? 'Authenticating...' : 'Sign in as SecOps Admin (Demo)'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 bg-transparent border border-surface hover:border-muted text-muted hover:text-primary text-xs font-medium rounded-xl transition-colors"
            >
              Return to Learner Dashboard
            </button>
          </div>
          <p className="mt-5 text-[11px] font-mono text-muted/60">
            Account: <code className="text-blue">admin@novatech.com</code> / <code className="text-blue">password123</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background text-primary font-sans flex flex-col selection:bg-blue/20">

      
      {/* 1. Global Header & Metrics Bar */}
      <header className="h-20 shrink-0 border-b border-surface bg-[#0A0D12] flex items-center justify-between px-8">
        <div className="flex items-center gap-12">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-amber rounded-full animate-pulse"></div>
              <h1 className="text-[10px] font-bold tracking-widest uppercase text-muted">Admin / SecOps</h1>
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-primary">Governance Console</h2>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 border-l border-surface pl-8">
            <div>
              <div className="text-2xl font-light text-primary leading-none">{pendingCount}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-1">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-light text-amber leading-none">{cases.filter(c => c.confidence < 60).length}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-1">High Ambiguity</div>
            </div>
            <div>
              <div className="text-2xl font-light text-teal leading-none">
                {performance ? `${performance.avg_final_score}%` : '—'}
              </div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-1">Avg Score</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="hidden lg:flex items-center gap-2 border-l border-surface pl-8">
            <button
              onClick={() => setActiveTab('queue')}
              className={`text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-colors ${activeTab === 'queue' ? 'bg-blue/10 text-blue' : 'text-muted hover:text-primary'}`}
            >
              Review Queue
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-lg transition-colors ${activeTab === 'performance' ? 'bg-blue/10 text-blue' : 'text-muted hover:text-primary'}`}
            >
              Agent Performance
            </button>
          </div>
        </div>

        <Link href="/dashboard" className="text-xs font-semibold tracking-widest uppercase text-cyan hover:text-white transition-colors px-4 py-2 border border-cyan/20 rounded-md bg-cyan/5 hover:bg-cyan/10">
          Exit to Dashboard
        </Link>
      </header>

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <h2 className="text-2xl font-semibold text-primary mb-8">Agent Performance Metrics</h2>
          {performance ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-[#0f151c] rounded-xl p-6 border border-surface">
                <div className="text-3xl font-light text-primary">{performance.total_runs}</div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-2">Total Runs</div>
              </div>
              <div className="bg-[#0f151c] rounded-xl p-6 border border-surface">
                <div className="text-3xl font-light text-teal">{performance.avg_final_score}%</div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-2">Avg Decision Score</div>
              </div>
              <div className="bg-[#0f151c] rounded-xl p-6 border border-surface">
                <div className="text-3xl font-light text-amber">{performance.human_review_rate_pct}%</div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-2">Human Review Rate</div>
              </div>
              <div className="bg-[#0f151c] rounded-xl p-6 border border-surface">
                <div className="text-3xl font-light text-blue">{performance.safe_rate_pct}%</div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-2">Safe Decision Rate</div>
              </div>
            </div>
          ) : (
            <p className="text-muted text-sm mb-8">Loading metrics... (run some scenarios to populate data)</p>
          )}
          <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6">Per-Node Latency (from LangGraph Trace)</h3>
          <div className="space-y-3">
            {performance?.agent_breakdown?.map((agent) => (
              <div key={agent.agent} className="bg-[#0f151c] rounded-xl px-6 py-4 border border-surface flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-primary capitalize">{agent.agent.replace(/_/g, ' ')}</div>
                  <div className="text-[10px] text-muted mt-1">{agent.call_count} calls traced</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-light text-cyan">{agent.avg_latency_s}s</div>
                  <div className="text-[10px] text-muted">avg latency</div>
                </div>
              </div>
            ))}
            {(!performance?.agent_breakdown || performance.agent_breakdown.length === 0) && (
              <p className="text-muted text-sm">No latency data yet. Agent traces will appear here after the first scenario run.</p>
            )}
          </div>
          <div className="mt-10 p-6 rounded-xl border border-blue/20 bg-blue/5">
            <p className="text-xs text-blue font-medium mb-1">LangSmith Full Traces</p>
            <p className="text-xs text-muted">For detailed token counts, prompt inspection, and per-call replay, open <a href="https://smith.langchain.com" target="_blank" rel="noreferrer" className="text-cyan underline">smith.langchain.com</a> → Project: <span className="font-bold text-primary">CyberGuard-AI</span></p>
          </div>
        </div>
      )}

      {/* Review Queue Tab */}
      {activeTab === 'queue' && (
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Minimalist Queue */}
        <aside className="w-80 shrink-0 border-r border-surface/60 bg-[#0A0D12]/50 flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
          <div className="px-5 py-4 border-b border-surface/50 flex justify-between items-center">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted">Review Queue</h3>
            <span className="text-[10px] font-medium text-cyan bg-cyan/10 px-2 rounded-full">{pendingCount}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {cases.map((c) => (
              <div 
                key={c.id}
                onClick={() => {
                  setSelectedCaseId(c.id);
                  setShowOverrideForm(false);
                }}
                className={`relative px-5 py-3 cursor-pointer transition-all group ${
                  selectedCaseId === c.id 
                    ? 'bg-blue/5' 
                    : c.status !== 'pending'
                      ? 'opacity-30'
                      : 'hover:bg-surface/30'
                }`}
              >
                {/* Active Indicator Line */}
                {selectedCaseId === c.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue rounded-r shadow-[0_0_8px_rgba(79,124,255,0.8)]"></div>
                )}
                
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    {c.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-coral"></div>}
                    <span className={`text-[11px] font-bold tracking-wider uppercase ${selectedCaseId === c.id ? 'text-blue' : 'text-muted group-hover:text-primary transition-colors'}`}>
                      {c.id}
                    </span>
                  </div>
                  {c.status === 'pending' ? (
                    <span className={`text-[10px] font-bold ${c.confidence < 60 ? 'text-coral' : 'text-amber'}`}>
                      {c.confidence}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal font-bold">✓</span>
                  )}
                </div>
                
                <div className="text-sm font-medium text-primary truncate leading-tight mb-0.5">
                  Score: {c.final_score}/100
                </div>
                <div className="text-[11px] text-muted truncate">
                  {c.chosen_action?.slice(0, 50) || 'No action recorded'}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Main Area: Case Review Panel */}
        <section className="flex-1 overflow-y-auto bg-background relative custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedCase ? (
              <motion.div 
                key={selectedCase.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                className="max-w-3xl mx-auto px-10 py-16 pb-32"
              >
                
                {/* Minimalist Header */}
                <div className="mb-14">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue bg-blue/10 px-2 py-1 rounded">Case {selectedCase.id}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted"></span> 
                      {selectedCase.is_safe ? 'Classified: Safe' : 'Classified: Unsafe'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl font-semibold tracking-tight text-primary mb-2">Score: {selectedCase.final_score}/100</h2>
                      <p className="text-sm text-cyan">User: {selectedCase.user_id?.slice(0, 8)}…</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-[10px] font-bold tracking-widest uppercase text-coral mb-1">AI Confidence</div>
                      <div className="text-4xl font-light text-primary tracking-tighter">{selectedCase.confidence}<span className="text-xl text-muted">%</span></div>
                    </div>
                  </div>
                </div>

                {/* Content Flow */}
                <div className="space-y-16">
                  
                  {/* 1. The Incident */}
                  <div>
                    <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-4">
                      <span className="w-4 h-px bg-surface"></span>
                      What Happened
                    </h3>
                    <div className="pl-8 border-l border-surface/50">
                      <div className="text-sm font-medium text-primary mb-3">
                        <span className="text-muted mr-3">Action</span> 
                        <span className="text-blue">{selectedCase.chosen_action}</span>
                      </div>
                      <div className="text-lg text-muted font-serif italic leading-relaxed">
                        &ldquo;{selectedCase.reasoning}&rdquo;
                      </div>
                    </div>
                  </div>

                  {/* 2. Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    
                    <div>
                      <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-4">
                        <span className="w-4 h-px bg-surface"></span>
                        AI Evidence
                      </h3>
                      <div className="space-y-4">
                        {selectedCase.ai_evidence.map((evidence, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            {evidence.type === 'positive' ? (
                              <div className="mt-1 text-teal text-xs">●</div>
                            ) : (
                              <div className="mt-1 text-coral text-xs">●</div>
                            )}
                            <div className="text-sm text-primary/80 leading-relaxed">{evidence.text}</div>
                          </div>
                        ))}
                        {selectedCase.ai_evidence.length === 0 && (
                          <p className="text-sm text-muted">No evidence recorded.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-4">
                        <span className="w-4 h-px bg-surface"></span>
                        Framework
                      </h3>
                      <div className="bg-[#0f151c] rounded-xl p-6 border border-surface">
                        <div className="text-[10px] font-bold tracking-widest uppercase text-cyan mb-2">NIST SP 800-50</div>
                        <div className="text-sm font-medium text-primary mb-3">Security Awareness Training</div>
                        <div className="text-xs text-muted leading-relaxed">Organizations should ensure user behavior aligns with verifiable communication channels before executing high-risk requests.</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Escalation Context */}
                  <div>
                     <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-4">
                      <span className="w-4 h-px bg-surface"></span>
                      Escalation Context
                    </h3>
                    <div className="bg-gradient-to-r from-coral/5 to-transparent p-6 rounded-r-xl border-l-2 border-coral/30">
                      <p className="text-sm text-coral/90 font-medium leading-relaxed mb-4">
                        This decision falls in the ambiguous range (score 40–60) or the AI confidence is below 70%. Human review ensures fair and accurate training outcomes.
                      </p>
                      <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-muted">
                        <div>Score: <span className="text-primary">{selectedCase.final_score}/100</span></div>
                        <div>Confidence: <span className="text-primary">{selectedCase.confidence}%</span></div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Judgment Area */}
                  <div className="pt-8">
                    {selectedCase.status === 'pending' ? (
                      <div className="bg-[#111821] border border-surface rounded-2xl p-8 shadow-2xl">
                        {!showOverrideForm ? (
                          <div>
                            <div className="text-xs font-bold tracking-widest uppercase text-muted mb-2 text-center">Human Judgment Required</div>
                            <h2 className="text-xl font-medium text-primary text-center mb-8">Does this behavior violate policy?</h2>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                              <button 
                                onClick={() => handleAction(selectedCase.decision_id, selectedCase.id, 'confirmed')}
                                className="px-8 py-3.5 bg-blue hover:bg-blue/90 text-white text-sm font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(79,124,255,0.2)] hover:shadow-[0_0_25px_rgba(79,124,255,0.3)] hover:-translate-y-0.5"
                              >
                                Confirm AI Assessment
                              </button>
                              <button 
                                onClick={() => setShowOverrideForm(true)}
                                className="px-8 py-3.5 bg-transparent border border-muted/30 hover:border-primary text-primary text-sm font-medium rounded-xl transition-colors"
                              >
                                Override Manual
                              </button>
                            </div>
                          </div>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="text-sm font-medium text-primary mb-4">Specify Override Reason</div>
                            <select 
                              className="w-full bg-[#0A0D12] border border-surface rounded-xl p-4 text-sm text-primary mb-4 outline-none focus:border-blue"
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e.target.value)}
                            >
                              <option value="">Select organizational context...</option>
                              <option value="policy_allows">Policy explicitly allows this behavior</option>
                              <option value="ai_misunderstood">AI misunderstood the real-world context</option>
                              <option value="policy_unclear">Current policy is too vague/unclear</option>
                              <option value="wrong_signal">AI prioritized the wrong behavioral signal</option>
                            </select>
                            <input 
                              type="text"
                              placeholder="Operator note (adds to organizational knowledge)..."
                              className="w-full bg-[#0A0D12] border border-surface rounded-xl p-4 text-sm text-primary mb-6 outline-none focus:border-blue"
                            />
                            <div className="flex items-center justify-end gap-4">
                              <button 
                                onClick={() => setShowOverrideForm(false)}
                                className="px-6 py-3 text-sm font-medium text-muted hover:text-primary transition-colors"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleAction(selectedCase.decision_id, selectedCase.id, 'overridden')}
                                className="px-8 py-3 bg-primary text-background text-sm font-semibold rounded-xl transition-colors"
                              >
                                Submit Override
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 border border-surface/50 rounded-2xl bg-[#0f151c]">
                        <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center text-lg ${selectedCase.status === 'confirmed' ? 'bg-blue/10 text-blue' : 'bg-teal/10 text-teal'}`}>
                          ✓
                        </div>
                        <div className="text-lg font-medium text-primary capitalize mb-2">Case {selectedCase.status}</div>
                        <div className="text-sm text-muted">The AI evaluation engine has been updated with this decision.</div>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <p className="text-xs font-bold uppercase tracking-widest mb-2">Queue Ready</p>
                <p className="text-sm">Select a flagged case from the sidebar to begin review.</p>
              </div>
            )}
          </AnimatePresence>
        </section>

      </div>
      )} {/* end activeTab === 'queue' */}

      {/* Global styles for custom scrollbar to keep it clean */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1f2937;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #374151;
        }
      `}} />
    </main>
  );
}
