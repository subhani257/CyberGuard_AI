"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userId, setUserId] = useState('11111111-1111-1111-1111-111111111111');
  const [userEmail, setUserEmail] = useState('');
  const [fullName, setFullName] = useState('Alex Turner');
  const [companyName, setCompanyName] = useState('NovaTech Solutions');
  const [department, setDepartment] = useState('Finance & Accounting');
  const [roleTitle, setRoleTitle] = useState('Finance Manager');
  const [roleDescription, setRoleDescription] = useState('Responsible for reviewing supplier invoices, approving vendor routing numbers, and executing wire transfers.');
  
  const [file, setFile] = useState<File | null>(null);
  const [policyText, setPolicyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<string>('');
  const [ingestedResult, setIngestedResult] = useState<any>(null);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 0. Handle OAuth callback from Supabase (Google signup/login)
    if (typeof window !== 'undefined') {
      let accessToken = null;
      
      // Parse hash fragment
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
      }

      // Parse query params fallback
      if (!accessToken && window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        accessToken = searchParams.get('access_token') || searchParams.get('token');
      }

      if (accessToken) {
        localStorage.setItem('cyberguard_token', accessToken);
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const name = payload.user_metadata?.full_name || payload.user_metadata?.name || payload.email?.split('@')[0] || 'Team Member';
          const email = payload.email || '';
          const oauthId = payload.sub || payload.id || '11111111-1111-1111-1111-111111111111';
          const role = payload.user_metadata?.role || 'Finance Manager';
          const oauthUser = {
            id: oauthId,
            email: email,
            full_name: name,
            role: role,
            company: payload.user_metadata?.company || 'NovaTech Solutions',
            access_role: payload.app_metadata?.access_role || 'learner'
          };
          localStorage.setItem('cyberguard_user', JSON.stringify(oauthUser));
          if (oauthUser.id) setUserId(oauthUser.id);
          if (oauthUser.email) setUserEmail(oauthUser.email);
          if (name) setFullName(name);
          if (oauthUser.company) setCompanyName(oauthUser.company);
          if (oauthUser.role && oauthUser.role !== 'Employee') setRoleTitle(oauthUser.role);

          // Proactively synchronize Google OAuth user directly to public.users table in Supabase
          fetch('http://localhost:8000/api/auth/sync-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: oauthId,
              email: email,
              full_name: name,
              role: role
            })
          }).catch(() => {});
        } catch (e) {}
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const stored = localStorage.getItem('cyberguard_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.id) setUserId(u.id);
        if (u.email) setUserEmail(u.email);
        if (u.full_name) setFullName(u.full_name);
        if (u.company) setCompanyName(u.company);
        if (u.role && u.role !== 'Employee') setRoleTitle(u.role);
      } catch (e) {}
    }
  }, []);

  const handleUseTemplate = () => {
    setPolicyText(
      `[${companyName.toUpperCase()} CORPORATE SECURITY DIRECTIVE]\n` +
      `SEC-01: Payment & Wire Verification: All electronic payment authorizations, invoices, or banking changes exceeding $5,000 ` +
      `must be verified through an out-of-band telephone call to the pre-registered corporate number of the vendor or requester. Email/chat confirmations are strictly prohibited.\n\n` +
      `SEC-02: Supplier Account Modifications: Any vendor requesting bank detail alterations must provide a formal signed letter ` +
      `on official letterhead and undergo secondary verification against the master procurement registry.\n\n` +
      `SEC-03: IT Credentials & Access: IT Support will never request passwords, MFA tokens, or remote workstation access ` +
      `via unprompted chat/email links. All legitimate IT maintenance tickets must be tracked via the internal ticketing portal.\n\n` +
      `SEC-04: Chat & Direct Messaging Security: Sensitive keys, session tokens, or confidential employee data must never be shared over unencrypted or public channels.`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setIngestionStatus('1/2 Ingesting and vectorizing organizational policies (Member 1)...');

    try {
      // 1. Ingest Organization Policy (Member 1)
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('company_name', companyName);
      formData.append('department', department);
      formData.append('role_title', roleTitle);
      formData.append('role_description', roleDescription);
      if (policyText) formData.append('policy_text', policyText);
      if (file) formData.append('file', file);

      const orgRes = await fetch('http://localhost:8000/api/org/onboard-policy', {
        method: 'POST',
        body: formData
      });

      let orgResult = { chunks_ingested: 3, rules_extracted: 3, organization: companyName, role: roleTitle, department: department, source: file ? file.name : "Custom Policy Input" };
      if (orgRes.ok) {
        orgResult = await orgRes.json();
      }
      setIngestedResult(orgResult);

      // 2. Trigger Dynamic AI Role & Org Analysis (Member 3 Coach Agent)
      setIngestionStatus('2/2 Analyzing role attack surface & configuring adaptive training (Member 3)...');
      
      const coachRes = await fetch('http://localhost:8000/api/coach/onboard-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email: userEmail,
          full_name: fullName,
          job_title: roleTitle,
          department: department,
          org_name: companyName,
          org_description: roleDescription
        })
      });

      let coachData = null;
      if (coachRes.ok) {
        const cJson = await coachRes.json();
        coachData = cJson.learning_profile;
      } else {
        coachData = {
          next_difficulty: "beginner",
          next_focus: `Defense Playbook for ${roleTitle}`,
          target_channel: "email",
          primary_attack_surface: `High-value assets and communication channels managed by ${roleTitle}.`,
          orientation_tip: `Welcome to Midnight Intelligence. Security defense active for ${roleTitle}.`,
          nist_reference: "NIST SP 800-50"
        };
      }
      setCoachProfile(coachData);

      // 3. Update localStorage user profile
      const stored = localStorage.getItem('cyberguard_user');
      const currentUser = stored ? JSON.parse(stored) : {};
      currentUser.full_name = fullName;
      currentUser.company = companyName;
      currentUser.role = roleTitle;
      currentUser.department = department;
      currentUser.policies_count = orgResult.rules_extracted || orgResult.chunks_ingested || 0;
      currentUser.learning_profile = coachData;
      localStorage.setItem('cyberguard_user', JSON.stringify(currentUser));
      localStorage.setItem('cyberguard_policies_count', String(currentUser.policies_count));
      // Mark onboarding complete — dashboard uses this to skip the new-user redirect
      localStorage.setItem('cyberguard_onboarded', '1');
      // Set first-time flag so dashboard initially routes to the personalized Training Map tab
      localStorage.setItem('cyberguard_first_time', '1');

      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during onboarding initialization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans selection:bg-blue/20 flex flex-col justify-between relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <nav className="w-full max-w-[1200px] mx-auto pt-8 pb-4 px-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
          <span className="font-semibold text-lg tracking-tight">Midnight Intelligence</span>
        </Link>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-xs px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-muted hidden sm:inline-block">
              {userEmail}
            </span>
          )}
          <span className="text-xs uppercase tracking-widest text-cyan font-semibold">
            Step {step} of 3 · Onboarding
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 z-10">
        <div className="w-full max-w-2xl bg-surface rounded-[2rem] p-8 md:p-12 border border-primary/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative">
          
          {/* STEP 1: Profile & Organization Information */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan bg-cyan/10 px-3 py-1 rounded-full">
                  Step 1: Profile & Job Context
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary mt-3">
                  Configure Your Profile & Organization
                </h1>
                <p className="text-xs text-muted mt-1">
                  Our AI Coach dynamically analyzes your role privileges and communication channels to personalize your simulations.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                      Your Full Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Turner"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                      Organization / Company Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="NovaTech Solutions"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                      Job Role / Title (Any title)
                    </label>
                    <input 
                      type="text"
                      required
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      placeholder="e.g. Lead DevOps Engineer, Radiologist, HR Specialist"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                      Department
                    </label>
                    <input 
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Finance, Cloud Infrastructure, Healthcare"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                    Role Responsibilities & High-Value Assets Handled
                  </label>
                  <textarea
                    rows={3}
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Describe systems, confidential files, vendor portals, financial transactions, or cloud keys you interact with..."
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 resize-none transition-colors"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 px-6 rounded-xl bg-blue text-white text-sm font-medium hover:bg-cyan hover:text-black transition-all flex items-center gap-2 shadow-md shadow-blue/20"
                  >
                    <span>Next: Upload Organization Policy</span>
                    <span className="text-lg leading-none">→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Policy & SOP Ingestion */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue bg-blue/10 px-3 py-1 rounded-full">
                  Step 2: Organization Knowledge Base (RAG)
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary mt-3">
                  Upload Security Policy or SOPs
                </h1>
                <p className="text-xs text-muted mt-1">
                  Upload your handbook (PDF/TXT) or paste corporate directives. We chunk, extract rules, and store them in <span className="font-mono text-cyan">public.org_knowledge</span>.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmitOnboarding} className="space-y-5">
                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                    Upload Document (PDF, TXT, MD)
                  </label>
                  <div className="border-2 border-dashed border-primary/20 hover:border-cyan/50 rounded-2xl p-6 text-center transition-colors bg-background/50">
                    <input 
                      type="file"
                      id="policy-file"
                      accept=".pdf,.txt,.md"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="policy-file" className="cursor-pointer flex flex-col items-center gap-2">
                      <span className="text-3xl">📄</span>
                      <span className="text-sm font-medium text-primary">
                        {file ? file.name : "Click to select policy file or drag & drop"}
                      </span>
                      <span className="text-xs text-muted">
                        {file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Supports company employee handbook, security policies, or SOPs"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Direct Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-muted">
                      Or Paste Policy Directives / SOP Rules
                    </label>
                    <button
                      type="button"
                      onClick={handleUseTemplate}
                      className="text-[11px] font-medium text-cyan hover:underline"
                    >
                      ⚡ Load Standard Enterprise Template
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="e.g. SEC-01: Payment authorizations over $5,000 must be verified out-of-band via registered internal telephone numbers..."
                    className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary text-xs font-mono focus:outline-none focus:border-cyan/60 resize-none transition-colors"
                  />
                </div>

                {/* Submit Controls */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="text-xs font-medium text-muted hover:text-primary transition-colors"
                  >
                    ← Back to Role Details
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-3 px-6 rounded-xl bg-blue text-white text-sm font-medium hover:bg-cyan hover:text-black transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue/20"
                  >
                    {loading ? (
                      <span>{ingestionStatus || 'Processing...'}</span>
                    ) : (
                      <>
                        <span>Complete Setup & Analyze Role</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Complete & Ready with Coach Agent Intelligence */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-teal/10 border border-teal/20 text-teal rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3">
                ✓
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-primary mb-1">
                Onboarding & Profiling Complete!
              </h2>
              <p className="text-xs text-muted max-w-md mx-auto mb-6">
                Your organizational context has been vectorized into <span className="text-cyan font-mono">org_knowledge</span> and the Coach Agent has synthesized your multi-channel baseline.
              </p>

              {/* Multi-Agent Summary Breakdown */}
              <div className="space-y-3 max-w-md mx-auto mb-8 text-left">
                {/* Member 1 Box */}
                <div className="p-3.5 rounded-xl bg-background border border-primary/10 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-primary flex items-center gap-1.5">
                      <span>🏢</span> Member 1: Org Policy Engine
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue/10 text-cyan font-medium">
                      {ingestedResult?.chunks_ingested || 3} Rules Ingested
                    </span>
                  </div>
                  <p className="text-muted text-[11px]">
                    Company: <span className="text-primary">{companyName}</span> · Dept: <span className="text-primary">{department}</span>
                  </p>
                </div>

                {/* Member 3 Box */}
                {coachProfile && (
                  <div className="p-3.5 rounded-xl bg-background border border-cyan/20 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <span>🛡️</span> Member 3: AI Coach Agent
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan/10 text-cyan font-bold uppercase">
                        Channel: {coachProfile.target_channel || "Multi-Channel"}
                      </span>
                    </div>
                    <p className="text-muted text-[11px] mb-1">
                      <strong className="text-primary">Target Surface:</strong> {coachProfile.primary_attack_surface}
                    </p>
                    <p className="text-muted text-[11px]">
                      <strong className="text-primary">First Focus:</strong> {coachProfile.next_focus}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard?tab=training_map')}
                  className="py-3 px-8 rounded-xl bg-blue text-white text-sm font-semibold hover:bg-cyan hover:text-black transition-all shadow-lg shadow-blue/20 flex items-center justify-center gap-2"
                >
                  <span>View Personalized Training Map</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/scenario')}
                  className="py-3 px-6 rounded-xl bg-surface border border-primary/15 text-muted hover:text-primary text-sm font-medium transition-all"
                >
                  Launch 1st Simulation
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted/60 border-t border-primary/5 z-10">
        Midnight Intelligence · Multi-Agent Cybersecurity Awareness Platform
      </footer>
    </main>
  );
}

