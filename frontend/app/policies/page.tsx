"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, UploadCloud, FileText, Plus, Trash2, Search,
  Filter, Check, AlertCircle, ArrowLeft, RefreshCw, Cpu,
  Building, Briefcase, FileUp, ChevronDown, ChevronUp,
  Tag, ExternalLink, Sparkles, BookOpen, Layers, CheckCircle2
} from 'lucide-react';
import UserProfileModal, { UserProfileData } from '@/components/profile/UserProfileModal';

export interface PolicyRule {
  rule_code: string;
  title: string;
  enforcement_level: 'MANDATORY' | 'STANDARD' | string;
  department: string;
  summary: string;
  content: string;
  full_text?: string;
  trigger_keywords?: string[];
  source?: string;
  is_custom?: boolean;
}

const DEPARTMENT_OPTIONS = [
  'All',
  'Finance',
  'Human Resources',
  'IT & Security',
  'Executive Office',
  'General'
];

const TEMPLATE_PRESETS = [
  {
    label: 'Wire Transfer SOP',
    dept: 'Finance',
    text: `FIN-SEC-04: Out-of-Band Wire Verification Protocol
All wire transfers exceeding $10,000 require secondary out-of-band verification via direct phone call to registered internal extension or in-person confirmation with the CFO or Finance Director.
Email or SMS approvals are strictly prohibited, even if purportedly sent by the CEO.
Company payment information is never transmitted to unverified external email domains.`
  },
  {
    label: 'OAuth Scopes SOP',
    dept: 'IT & Security',
    text: `IT-OAUTH-02: Third-Party Enterprise App Grant Governance
Employees are strictly prohibited from granting offline read/write access to corporate email or cloud storage drives to third-party applications without explicit Security Operations approval.
Unverified publisher integrations requesting administrative consent must be reported immediately.`
  },
  {
    label: 'Direct Deposit SOP',
    dept: 'Human Resources',
    text: `HR-SEC-02: Employee Payroll & Direct Deposit Protection
Direct deposit modifications and tax form requests require multi-factor verification through the corporate Workday portal.
HR personnel must never update direct deposit bank details based on emailed PDF forms or urgent requests from personal email addresses.`
  }
];

export default function PoliciesPage() {
  const router = useRouter();

  // User session state
  const [user, setUser] = useState<UserProfileData>({
    id: '',
    name: 'Learner User',
    role: 'Finance Manager',
    company: 'NovaTech Solutions',
    department: 'Finance & Accounting',
    access_role: 'learner'
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Policy rules list state
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filtering and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [enforcementFilter, setEnforcementFilter] = useState<'ALL' | 'MANDATORY' | 'STANDARD'>('ALL');
  const [expandedRuleCode, setExpandedRuleCode] = useState<string | null>(null);

  // Ingestion form state
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [ingestCompany, setIngestCompany] = useState('NovaTech Solutions');
  const [ingestDept, setIngestDept] = useState('Finance');
  const [ingestRole, setIngestRole] = useState('Finance Manager');
  const [ingestRoleDesc, setIngestRoleDesc] = useState('');
  const [policyText, setPolicyText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  // Deletion confirmation state
  const [deletingRuleCode, setDeletingRuleCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Load User Session from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cyberguard_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          const resolvedUser = {
            id: u.id || '',
            name: u.full_name || u.name || 'Learner User',
            email: u.email || '',
            role: u.role || 'Finance Manager',
            company: u.company || 'NovaTech Solutions',
            department: u.department || 'Finance & Accounting',
            access_role: u.access_role || 'learner'
          };
          setUser(resolvedUser);
          setIngestCompany(resolvedUser.company);
          setIngestRole(resolvedUser.role);
          setIngestDept(resolvedUser.department.split('&')[0].trim() || 'Finance');
        } catch (_) {}
      }
    }
  }, []);

  // 2. Fetch Structured Policies from Backend
  const fetchPolicies = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const targetCompany = user.company || 'NovaTech Solutions';
      const res = await fetch(`http://localhost:8000/api/org/policies/${encodeURIComponent(targetCompany)}`, {
        headers
      });

      if (!res.ok) {
        throw new Error(`Failed to load policies (Status ${res.status})`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.rules)) {
        setRules(data.rules);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cyberguard_policies_count', String(data.rules.length));
        }
      } else {
        setRules([]);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Unable to retrieve organizational policies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [user.company]);

  // 3. Handle File Drop & Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'txt', 'md'].includes(ext || '')) {
        setIngestStatus({
          type: 'error',
          message: 'Unsupported format. Please upload PDF, TXT, or Markdown documents.'
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setIngestStatus({
          type: 'error',
          message: 'Document exceeds the 2 MB file size limit.'
        });
        return;
      }
      setSelectedFile(file);
      setIngestStatus({ type: 'idle', message: '' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'txt', 'md'].includes(ext || '')) {
        setIngestStatus({
          type: 'error',
          message: 'Unsupported format. Please upload PDF, TXT, or Markdown documents.'
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setIngestStatus({
          type: 'error',
          message: 'Document exceeds the 2 MB limit.'
        });
        return;
      }
      setSelectedFile(file);
      setIngestStatus({ type: 'idle', message: '' });
    }
  };

  // 4. Submit Policy Ingestion (Form Data)
  const handleIngestPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'upload' && !selectedFile && !policyText.trim()) {
      setIngestStatus({
        type: 'error',
        message: 'Please choose a document file or enter policy guidelines.'
      });
      return;
    }
    if (activeTab === 'text' && !policyText.trim()) {
      setIngestStatus({
        type: 'error',
        message: 'Please provide policy text or select a preset template.'
      });
      return;
    }

    setIsIngesting(true);
    setIngestStatus({ type: 'idle', message: '' });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;
      const formData = new FormData();
      formData.append('company_name', ingestCompany.trim());
      formData.append('department', ingestDept.trim());
      formData.append('role_title', ingestRole.trim());
      if (ingestRoleDesc.trim()) {
        formData.append('role_description', ingestRoleDesc.trim());
      }
      if (policyText.trim()) {
        formData.append('policy_text', policyText.trim());
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8000/api/org/onboard-policy', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.message || 'Failed to ingest and vectorize policy');
      }

      setIngestStatus({
        type: 'success',
        message: `Successfully extracted and vectorized ${data.rules_extracted || 1} rules for ${ingestCompany}!`
      });

      // Clear inputs
      setPolicyText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh list
      await fetchPolicies();
    } catch (err: any) {
      setIngestStatus({
        type: 'error',
        message: err.message || 'Error vectorizing policy'
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // 5. Delete a Policy Rule
  const handleDeleteRule = async (ruleCode: string) => {
    setDeletingRuleCode(ruleCode);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:8000/api/org/policies/${encodeURIComponent(ruleCode)}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        throw new Error('Failed to delete rule');
      }

      // Optimistically update UI
      setRules(prev => prev.filter(r => r.rule_code !== ruleCode));
      if (typeof window !== 'undefined') {
        const count = Math.max(0, rules.length - 1);
        localStorage.setItem('cyberguard_policies_count', String(count));
      }
    } catch (err: any) {
      alert(err.message || 'Error removing rule');
    } finally {
      setDeletingRuleCode(null);
    }
  };

  // 6. Filtered and Searched Rules
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      // Department match
      if (selectedDept !== 'All') {
        const d = rule.department.toLowerCase();
        const sel = selectedDept.toLowerCase();
        if (!d.includes(sel) && !sel.includes(d)) {
          return false;
        }
      }

      // Enforcement level match
      if (enforcementFilter !== 'ALL') {
        if (rule.enforcement_level !== enforcementFilter) {
          return false;
        }
      }

      // Query match (code, title, content, keywords)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = rule.rule_code.toLowerCase().includes(q);
        const matchesTitle = rule.title.toLowerCase().includes(q);
        const matchesContent = rule.content.toLowerCase().includes(q);
        const matchesKeywords = rule.trigger_keywords?.some(k => k.toLowerCase().includes(q));
        return matchesCode || matchesTitle || matchesContent || matchesKeywords;
      }

      return true;
    });
  }, [rules, selectedDept, enforcementFilter, searchQuery]);

  // Summary Metrics
  const mandatoryCount = rules.filter(r => r.enforcement_level === 'MANDATORY').length;
  const standardCount = rules.length - mandatoryCount;
  const uniqueDepartments = Array.from(new Set(rules.map(r => r.department)));

  return (
    <div className="min-h-screen bg-[#080D12] text-primary font-sans flex flex-col selection:bg-cyan/20">
      {/* ── Sticky Top Navigation ───────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#080D12]/95 backdrop-blur-md border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-primary/10 hover:border-cyan/40 text-muted hover:text-cyan text-xs font-mono transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-[#1E293B]" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan shadow-[0_0_12px_rgba(69,217,232,0.15)]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-primary">Organization Policies</h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
                    SOP Grounding
                  </span>
                </div>
                <p className="text-[11px] text-muted font-mono hidden md:block">
                  Vectorized knowledge base for scenario personalization & AI debriefs
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E141D] border border-[#1E293B] text-[11px] font-mono text-muted">
              <Cpu className="w-3.5 h-3.5 text-cyan" />
              <span>all-MiniLM-L6-v2 · 1536 dims</span>
            </div>

            {/* User Profile Pill */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-primary/10 hover:border-cyan/40 text-xs font-medium text-primary hover:text-cyan transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-cyan/20 text-cyan flex items-center justify-center text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ──────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 1. Header Overview & Stats Strip */}
        <section className="p-6 rounded-2xl bg-gradient-to-r from-[#0E141D] via-[#111A24] to-[#0E141D] border border-[#1E293B] shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Building className="w-4 h-4 text-cyan" />
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                  {user.company || 'TechCorp Global'} Security Manual
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-primary">
                Corporate Defense SOPs & Protocols
              </h2>
              <p className="text-xs text-muted max-w-2xl mt-1.5 leading-relaxed">
                These vectorized rules directly ground Member 1's attack generator and Member 2's evaluation engine.
                When learners make decisions, their choices are verified against these exact organizational directives.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-xl bg-[#080D12]/80 border border-[#1E293B] text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">Grounded Rules</span>
                <span className="text-2xl font-bold text-cyan mt-1 block">{rules.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080D12]/80 border border-[#1E293B] text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">Mandatory</span>
                <span className="text-2xl font-bold text-amber mt-1 block">{mandatoryCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#080D12]/80 border border-[#1E293B] text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">Departments</span>
                <span className="text-2xl font-bold text-primary mt-1 block">{uniqueDepartments.length || 1}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Ingestion & Upload Section */}
        <section className="p-6 rounded-2xl bg-[#0B0F14] border border-[#1E293B] shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue/10 border border-blue/30 flex items-center justify-center text-blue">
                <FileUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">Ingest New Organization Policy</h3>
                <p className="text-xs text-muted font-mono">
                  Embed documents into <code className="text-cyan">public.org_knowledge</code> using local SentenceTransformers
                </p>
              </div>
            </div>

            {/* Ingestion Mode Toggle Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-[#080D12] border border-[#1E293B] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-blue text-white shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Document Upload (PDF/TXT)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeTab === 'text'
                    ? 'bg-blue text-white shadow-sm'
                    : 'text-muted hover:text-primary'
                }`}
              >
                Direct Text Editor
              </button>
            </div>
          </div>

          <form onSubmit={handleIngestPolicy} className="space-y-6">
            {/* Metadata Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Target Organization
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={ingestCompany}
                    onChange={(e) => setIngestCompany(e.target.value)}
                    required
                    placeholder="e.g. NovaTech Solutions"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 text-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Department
                </label>
                <select
                  value={ingestDept}
                  onChange={(e) => setIngestDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 text-primary text-xs"
                >
                  <option value="Finance">Finance</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="IT & Security">IT & Security</option>
                  <option value="Executive Office">Executive Office</option>
                  <option value="General">General Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                  Role Title Applicability
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={ingestRole}
                    onChange={(e) => setIngestRole(e.target.value)}
                    required
                    placeholder="e.g. Finance Specialist"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 text-primary text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Ingestion Mode: File Upload */}
            {activeTab === 'upload' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-cyan/60 bg-cyan/5'
                    : 'border-[#1E293B] hover:border-primary/30 bg-[#080D12]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="max-w-md mx-auto flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-cyan flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-muted font-mono mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Ready to vectorize
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-2 text-[10px] text-coral hover:underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        Drag and drop your policy document here, or <span className="text-cyan underline">browse</span>
                      </p>
                      <p className="text-[11px] text-muted font-mono mt-1">
                        Supports PDF manuals, TXT guidelines, and Markdown SOPs (max 2 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ingestion Mode: Direct Text Editor */}
            {activeTab === 'text' && (
              <div className="space-y-3">
                {/* Preset Templates */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan" /> Quick Templates:
                  </span>
                  {TEMPLATE_PRESETS.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => {
                        setPolicyText(tpl.text);
                        setIngestDept(tpl.dept);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#0E141D] border border-[#1E293B] hover:border-cyan/40 text-[10px] font-mono text-muted hover:text-cyan transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={policyText}
                    onChange={(e) => setPolicyText(e.target.value)}
                    placeholder="Enter raw policy rules or protocol directives (e.g. FIN-SEC-01: Dual sign-off is required for transfers over $10,000)..."
                    className="w-full p-4 rounded-xl bg-[#080D12] border border-[#1E293B] focus:border-cyan/60 text-primary text-xs font-mono leading-relaxed placeholder:text-muted/40"
                  />
                  <span className="absolute right-3 bottom-3 text-[10px] font-mono text-muted/60">
                    {policyText.length.toLocaleString()} / 100,000 chars
                  </span>
                </div>
              </div>
            )}

            {/* Status Alert Banner */}
            {ingestStatus.type === 'success' && (
              <div className="p-3.5 rounded-xl bg-teal/15 border border-teal/30 text-teal text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{ingestStatus.message}</span>
              </div>
            )}

            {ingestStatus.type === 'error' && (
              <div className="p-3.5 rounded-xl bg-coral/15 border border-coral/30 text-coral text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ingestStatus.message}</span>
              </div>
            )}

            {/* Ingestion Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted font-mono">
                Extracted rules are parsed into atomic semantic vectors automatically.
              </span>

              <button
                type="submit"
                disabled={isIngesting}
                className="px-6 py-2.5 rounded-xl bg-blue hover:bg-blue/90 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(79,124,255,0.25)] transition-all"
              >
                {isIngesting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Vectorizing Rules...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Ingest & Vectorize Policy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* 3. Filterable Rules Catalog */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan" />
                <span>Active Policy Directives</span>
                <span className="text-xs font-mono font-normal text-muted">
                  ({filteredRules.length} of {rules.length})
                </span>
              </h3>
              <p className="text-xs text-muted font-mono mt-0.5">
                Inspect, search, and manage rules governing AI scenario simulations
              </p>
            </div>

            {/* Search Bar & Refresh */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search code, title, keywords..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0F14] border border-[#1E293B] focus:border-cyan/60 text-primary text-xs placeholder:text-muted/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-muted hover:text-primary"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                onClick={fetchPolicies}
                title="Refresh policy catalog"
                className="p-2 rounded-xl bg-[#0B0F14] border border-[#1E293B] hover:border-primary/30 text-muted hover:text-primary transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan' : ''}`} />
              </button>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-muted uppercase tracking-wider mr-1">
              Department:
            </span>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                  selectedDept === dept
                    ? 'bg-cyan/15 text-cyan border border-cyan/40 font-bold'
                    : 'bg-[#0B0F14] text-muted hover:text-primary border border-[#1E293B]'
                }`}
              >
                {dept}
              </button>
            ))}

            <div className="h-4 w-px bg-[#1E293B] mx-2 hidden sm:block" />

            <button
              onClick={() =>
                setEnforcementFilter(prev => (prev === 'ALL' ? 'MANDATORY' : prev === 'MANDATORY' ? 'STANDARD' : 'ALL'))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                enforcementFilter === 'MANDATORY'
                  ? 'bg-amber/15 text-amber border-amber/40 font-bold'
                  : enforcementFilter === 'STANDARD'
                  ? 'bg-blue/15 text-blue border-blue/40 font-bold'
                  : 'bg-[#0B0F14] text-muted hover:text-primary border-[#1E293B]'
              }`}
            >
              Level: {enforcementFilter}
            </button>
          </div>

          {/* Rules Grid */}
          {isLoading && rules.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0B0F14] border border-[#1E293B] text-center">
              <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted font-mono">Retrieving grounded security rules...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0B0F14] border border-[#1E293B] text-center">
              <FileText className="w-8 h-8 text-muted mx-auto mb-3 opacity-60" />
              <p className="text-sm font-semibold text-primary">No matching policy rules found</p>
              <p className="text-xs text-muted font-mono mt-1">
                Try adjusting your search query or department filters, or ingest a new document above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.map((rule) => {
                const isExpanded = expandedRuleCode === rule.rule_code;
                const isMandatory = rule.enforcement_level === 'MANDATORY';

                return (
                  <div
                    key={rule.rule_code}
                    className="p-5 rounded-2xl bg-[#0B0F14] border border-[#1E293B] hover:border-cyan/30 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#111A24] border border-[#1E293B] text-cyan">
                            {rule.rule_code}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isMandatory
                                ? 'bg-amber/10 text-amber border-amber/25'
                                : 'bg-cyan/10 text-cyan border-cyan/25'
                            }`}
                          >
                            {rule.enforcement_level}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted">
                            {rule.department}
                          </span>
                          {/* Delete action */}
                          <button
                            onClick={() => handleDeleteRule(rule.rule_code)}
                            disabled={deletingRuleCode === rule.rule_code}
                            title="Remove policy rule"
                            className="p-1 text-muted/50 hover:text-coral transition-colors rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rule Title */}
                      <h4 className="text-sm font-bold text-primary group-hover:text-cyan transition-colors">
                        {rule.title}
                      </h4>

                      {/* Summary or Full Text */}
                      <p className="text-xs text-muted mt-2 leading-relaxed font-sans">
                        {isExpanded ? rule.full_text || rule.content : rule.summary || rule.content.slice(0, 150)}
                      </p>

                      {/* Trigger Keywords Chips */}
                      {rule.trigger_keywords && rule.trigger_keywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                          {rule.trigger_keywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#080D12] text-muted border border-[#1E293B]"
                            >
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Expand Toggle */}
                    <div className="pt-4 mt-4 border-t border-[#1E293B]/70 flex items-center justify-between text-[11px] font-mono text-muted">
                      <span className="truncate max-w-[200px]" title={rule.source}>
                        {rule.source || 'NovaTech Compliance Manual'}
                      </span>

                      <button
                        onClick={() => setExpandedRuleCode(isExpanded ? null : rule.rule_code)}
                        className="text-cyan hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>{isExpanded ? 'Collapse' : 'Expand full rule'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ── User Profile Drawer / Modal ─────────────────────────────────── */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(updated) => {
          setUser(prev => ({ ...prev, ...updated }));
          if (updated.company) setIngestCompany(updated.company);
          if (updated.role) setIngestRole(updated.role);
          if (updated.department) setIngestDept(updated.department.split('&')[0].trim() || 'Finance');
        }}
        onLogout={() => {
          localStorage.removeItem('cyberguard_token');
          localStorage.removeItem('cyberguard_user');
          router.push('/login');
        }}
      />
    </div>
  );
}
