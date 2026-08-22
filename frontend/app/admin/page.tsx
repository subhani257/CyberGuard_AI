"use client";
import React, { useState } from 'react';
import Link from 'next/link';
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
];

export default function AdminDashboard() {
  const [cases, setCases] = useState(MOCK_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const pendingCount = cases.filter(c => c.status === 'pending').length;

  const handleAction = (id: string, actionType: 'confirmed' | 'overridden') => {
    setCases(cases.map(c => c.id === id ? { ...c, status: actionType } : c));
    setTimeout(() => {
      setSelectedCaseId(null);
      setShowOverrideForm(false);
      setOverrideReason("");
    }, 1500); // Give time to show success state before closing
  };

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
              <div className="text-2xl font-light text-amber leading-none">2</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-1">High Ambiguity</div>
            </div>
            <div>
              <div className="text-2xl font-light text-teal leading-none">94.2%</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-muted mt-1">AI Agreement</div>
            </div>
          </div>
        </div>

        <Link href="/dashboard" className="text-xs font-semibold tracking-widest uppercase text-cyan hover:text-white transition-colors px-4 py-2 border border-cyan/20 rounded-md bg-cyan/5 hover:bg-cyan/10">
          Exit to Dashboard
        </Link>
      </header>

      {/* 2. Split Screen Layout */}
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
                  {c.role}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {c.scenario_type}
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
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl mx-auto px-10 py-16 pb-32"
              >
                
                {/* Minimalist Header */}
                <div className="mb-14">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue bg-blue/10 px-2 py-1 rounded">Case {selectedCase.id}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted"></span> 
                      {selectedCase.scenario_type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-4xl font-semibold tracking-tight text-primary mb-2">{selectedCase.role}</h2>
                      <p className="text-sm text-cyan">{selectedCase.user}</p>
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
                        <span className="text-blue">{selectedCase.what_happened.action}</span>
                      </div>
                      <div className="text-lg text-muted font-serif italic leading-relaxed">
                        "{selectedCase.what_happened.reasoning}"
                      </div>
                    </div>
                  </div>

                  {/* 2. Analysis & Policy (Side by side) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    
                    {/* Evidence */}
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
                      </div>
                    </div>

                    {/* Policy */}
                    <div>
                      <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-4">
                        <span className="w-4 h-px bg-surface"></span>
                        Framework
                      </h3>
                      <div className="bg-[#0f151c] rounded-xl p-6 border border-surface">
                        <div className="text-[10px] font-bold tracking-widest uppercase text-cyan mb-2">{selectedCase.relevant_policy.id}</div>
                        <div className="text-sm font-medium text-primary mb-3">{selectedCase.relevant_policy.title}</div>
                        <div className="text-xs text-muted leading-relaxed">{selectedCase.relevant_policy.text}</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. The Hesitation */}
                  <div>
                     <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-4">
                      <span className="w-4 h-px bg-surface"></span>
                      Escalation Context
                    </h3>
                    <div className="bg-gradient-to-r from-coral/5 to-transparent p-6 rounded-r-xl border-l-2 border-coral/30">
                      <p className="text-sm text-coral/90 font-medium leading-relaxed mb-4">
                        {selectedCase.reason_for_escalation}
                      </p>
                      <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-muted">
                        <div>Score: <span className="text-primary">{selectedCase.confidence}%</span></div>
                        <div>Threshold: <span className="text-primary">70%</span></div>
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
                                onClick={() => handleAction(selectedCase.id, 'confirmed')}
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
                                onClick={() => handleAction(selectedCase.id, 'overridden')}
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
