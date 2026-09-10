"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userId, setUserId] = useState('11111111-1111-1111-1111-111111111111');
  const [companyName, setCompanyName] = useState('Acme Global Technologies');
  const [department, setDepartment] = useState('Finance');
  const [roleTitle, setRoleTitle] = useState('Finance Manager');
  const [roleDescription, setRoleDescription] = useState('Responsible for reviewing high-value supplier invoices and executing wire transfers.');
  
  const [file, setFile] = useState<File | null>(null);
  const [policyText, setPolicyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingestionStatus, setIngestionStatus] = useState<string>('');
  const [ingestedResult, setIngestedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('cyberguard_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.id) setUserId(u.id);
        if (u.company) setCompanyName(u.company);
        if (u.role && u.role !== 'Employee') setRoleTitle(u.role);
      } catch (e) {}
    }
  }, []);

  const handleUseTemplate = () => {
    setPolicyText(
      `[${companyName.toUpperCase()} INTERNAL SECURITY DIRECTIVE]\n` +
      `SEC-01: All electronic payment authorizations exceeding $15,000 must be verified through an out-of-band telephone call ` +
      `to the pre-registered corporate extension of the requesting director. Email and SMS confirmations are not permitted.\n\n` +
      `SEC-02: Supplier Account Modifications: Any vendor requesting bank detail alterations must provide a formal signed letter ` +
      `on official letterhead and undergo secondary verification against the master procurement registry.\n\n` +
      `SEC-03: IT Credentials & Access: Global IT Support will never request passwords, MFA tokens, or remote workstation access ` +
      `via unprompted email links. All legitimate IT maintenance tickets must be tracked via the internal service desk.`
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setIngestionStatus('Uploading and parsing document...');

    try {
      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('company_name', companyName);
      formData.append('department', department);
      formData.append('role_title', roleTitle);
      formData.append('role_description', roleDescription);
      if (policyText) formData.append('policy_text', policyText);
      if (file) formData.append('file', file);

      setIngestionStatus('Generating local Hugging Face embeddings (all-MiniLM-L6-v2)...');

      const res = await fetch('http://localhost:8000/api/org/onboard-policy', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to onboard policy.');
      }

      const result = await res.json();
      setIngestedResult(result);

      // Update local storage user profile with newly configured company & role
      const stored = localStorage.getItem('cyberguard_user');
      const currentUser = stored ? JSON.parse(stored) : {};
      currentUser.company = companyName;
      currentUser.role = roleTitle;
      currentUser.department = department;
      localStorage.setItem('cyberguard_user', JSON.stringify(currentUser));

      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during vector embedding ingestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans selection:bg-blue/20 flex flex-col justify-between">
      {/* Navigation Header */}
      <nav className="w-full max-w-[1200px] mx-auto pt-8 pb-4 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
          <span className="font-semibold text-lg tracking-tight">CyberGuard AI</span>
        </Link>
        <span className="text-xs uppercase tracking-widest text-muted font-medium">
          Step {step} of 3 · Personalization Gateway
        </span>
      </nav>

      {/* Main Card Container */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl bg-surface rounded-[2rem] p-8 md:p-12 border border-primary/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative">
          
          {/* STEP 1: Role & Company Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="mb-8">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan bg-cyan/10 px-3 py-1 rounded-full">
                  Step 1: Role & Organization
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary mt-3">
                  Tell us about your organization
                </h1>
                <p className="text-xs text-muted mt-1">
                  We customize simulated lures according to your corporate domain and job workflows.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                      Company Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Global Technologies"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60"
                    >
                      <option value="Finance">Finance & Accounting</option>
                      <option value="Human Resources">Human Resources & Payroll</option>
                      <option value="IT & Security">IT & Information Security</option>
                      <option value="Executive">Executive Office</option>
                      <option value="Legal">Legal & Compliance</option>
                      <option value="General">Sales & Operations</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                    Your Role / Job Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Accounts Payable Specialist"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
                    Role Responsibilities (Brief summary)
                  </label>
                  <textarea
                    rows={3}
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Describe typical decisions, transactions, or communications you handle..."
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 px-6 rounded-xl bg-blue text-white text-sm font-medium hover:bg-cyan hover:text-black transition-all flex items-center gap-2"
                  >
                    <span>Proceed to Policy Submission</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Policy & SOP Ingestion */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue bg-blue/10 px-3 py-1 rounded-full">
                  Step 2: Company Policy Ingestion
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-primary mt-3">
                  Upload Security Policy or SOPs
                </h1>
                <p className="text-xs text-muted mt-1">
                  Upload your employee handbook or paste policy rules. We will extract, chunk, and embed them locally via Hugging Face.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmitPolicy} className="space-y-5">
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
                        {file ? file.name : "Click to select a policy file or drag here"}
                      </span>
                      <span className="text-xs text-muted">
                        {file ? `${(file.size / 1024).toFixed(1)} KB selected` : "Supports PDF employee guidelines or text SOPs"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Direct Text Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold tracking-wider uppercase text-muted">
                      Or Paste Policy Rules / SOPs
                    </label>
                    <button
                      type="button"
                      onClick={handleUseTemplate}
                      className="text-[11px] font-medium text-cyan hover:underline"
                    >
                      ⚡ Load Default Enterprise Template
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="e.g. SEC-04: Any wire transfer over $10,000 must be verified out-of-band via internal phone extension..."
                    className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary text-xs font-mono focus:outline-none focus:border-cyan/60 resize-none"
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
                    className="py-3 px-6 rounded-xl bg-blue text-white text-sm font-medium hover:bg-cyan hover:text-black transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span>{ingestionStatus || 'Embedding & Storing...'}</span>
                    ) : (
                      <>
                        <span>Ingest & Vectorize Policy</span>
                        <span>⚡</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 3: Complete & Ready */}
          {step === 3 && ingestedResult && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-teal/10 border border-teal/20 text-teal rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">
                Onboarding Complete!
              </h2>
              <p className="text-sm text-muted max-w-md mx-auto mb-6">
                Successfully vectorized <span className="text-primary font-semibold">{ingestedResult.chunks_ingested} policy rules</span> for{' '}
                <span className="text-cyan font-semibold">{ingestedResult.organization}</span> using free local Hugging Face embeddings.
              </p>

              <div className="p-4 rounded-2xl bg-background border border-primary/10 text-left max-w-md mx-auto mb-8 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Target Role:</span>
                  <span className="font-semibold text-primary">{ingestedResult.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Department:</span>
                  <span className="font-semibold text-primary">{ingestedResult.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Document Source:</span>
                  <span className="font-semibold text-primary">{ingestedResult.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Vector Table:</span>
                  <span className="font-mono text-cyan">public.org_knowledge</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => router.push('/scenario')}
                  className="py-3 px-8 rounded-xl bg-blue text-white text-sm font-semibold hover:bg-cyan hover:text-black transition-all shadow-lg shadow-blue/20 flex items-center justify-center gap-2"
                >
                  <span>Launch Personalized Scenario</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="py-3 px-6 rounded-xl bg-surface border border-primary/15 text-muted hover:text-primary text-sm font-medium transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted/60 border-t border-primary/5">
        CyberGuard AI · Member 1 Organizational RAG Personalization Engine
      </footer>
    </main>
  );
}
