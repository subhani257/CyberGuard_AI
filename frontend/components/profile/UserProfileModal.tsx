"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Building, Briefcase, Mail, Check, AlertCircle, 
  LogOut, X, Sparkles, Award, Target, ChevronRight, Lock
} from 'lucide-react';

export interface UserProfileData {
  id: string;
  name: string;
  email?: string;
  role: string;
  company?: string;
  department?: string;
  access_role?: string;
  readiness_score?: number;
  avatar_url?: string;
}

export const CORPORATE_AVATAR_PRESETS = [
  { id: 'exec-1', label: 'Executive 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
  { id: 'exec-2', label: 'Executive 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'exec-3', label: 'Executive 3', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' },
  { id: 'exec-4', label: 'Executive 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileData;
  readinessScore?: number;
  completedDecisions?: number;
  priorityChannel?: string;
  onUpdateUser?: (updatedUser: Partial<UserProfileData>) => void;
  onLogout?: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  readinessScore = 74,
  completedDecisions = 0,
  priorityChannel = 'cloud_oauth',
  onUpdateUser,
  onLogout
}: UserProfileModalProps) {
  const [fullName, setFullName] = useState(user.name || '');
  const [role, setRole] = useState(user.role || 'Employee');
  const [company, setCompany] = useState(user.company || 'TechCorp Global');
  const [department, setDepartment] = useState(user.department || 'Finance & Accounting');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state with props when modal opens or user prop changes
  useEffect(() => {
    if (isOpen) {
      setFullName(user.name || '');
      setRole(user.role || 'Employee');
      setCompany(user.company || 'TechCorp Global');
      setDepartment(user.department || 'Finance & Accounting');
      setAvatarUrl(user.avatar_url || '');
      setSaveStatus('idle');
      setErrorMessage('');
      setShowLogoutConfirm(false);
    }
  }, [isOpen, user]);

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('cyberguard_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          full_name: fullName.trim(),
          role: role.trim(),
          company: company.trim(),
          department: department.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to update profile');
      }

      // Refresh stored token if new claims were returned
      if (data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('cyberguard_token', data.access_token);
      }

      // Update local storage user profile
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cyberguard_user');
        let existingUser = {};
        try {
          if (stored) existingUser = JSON.parse(stored);
        } catch (_) {}
        const merged = {
          ...existingUser,
          name: fullName.trim(),
          full_name: fullName.trim(),
          role: role.trim(),
          company: company.trim(),
          department: department.trim(),
          avatar_url: avatarUrl.trim()
        };
        localStorage.setItem('cyberguard_user', JSON.stringify(merged));
      }

      // Notify parent component
      if (onUpdateUser) {
        onUpdateUser({
          name: fullName.trim(),
          role: role.trim(),
          company: company.trim(),
          department: department.trim(),
          avatar_url: avatarUrl.trim()
        });
      }

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1200);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const executeLogout = () => {
    if (onLogout) {
      onLogout();
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('cyberguard_token');
      localStorage.removeItem('cyberguard_user');
      window.location.href = '/login';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            key="profile-card"
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="relative w-full max-w-xl bg-[#0A0E14] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col my-auto max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="shrink-0 px-6 py-5 border-b border-[#1E293B] bg-[#080D12] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-cyan/20 to-blue/20 border border-cyan/30 flex items-center justify-center text-cyan font-bold text-sm tracking-wider shadow-[0_0_15px_rgba(69,217,232,0.15)] shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <h2 id="profile-modal-title" className="text-sm font-bold text-primary tracking-tight">
                    Learner Security Profile
                  </h2>
                  <p className="text-xs text-muted font-mono">
                    Identity, role grounding & organization context
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close profile modal"
                className="w-8 h-8 rounded-lg bg-surface/60 border border-primary/10 hover:border-primary/30 text-muted hover:text-primary flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Defense Telemetry Strip */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0E141D] border border-[#1E293B]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan" /> Readiness
                  </span>
                  <span className="text-lg font-bold text-primary mt-0.5">
                    {readinessScore}<span className="text-xs font-normal text-muted">/100</span>
                  </span>
                </div>
                <div className="flex flex-col border-l border-[#1E293B] pl-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                    <Target className="w-3 h-3 text-blue" /> Decisions
                  </span>
                  <span className="text-lg font-bold text-primary mt-0.5">
                    {completedDecisions}
                  </span>
                </div>
                <div className="flex flex-col border-l border-[#1E293B] pl-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber" /> Access Role
                  </span>
                  <span className="text-xs font-bold text-cyan mt-1 uppercase tracking-wide">
                    {user.access_role || 'Learner'}
                  </span>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form id="profile-form" onSubmit={handleSave} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Turner"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 focus:ring-1 focus:ring-cyan/50 text-primary text-xs transition-colors placeholder:text-muted/50"
                    />
                  </div>
                </div>

                {/* Executive Avatar / Profile Picture */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Executive Profile Picture
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-cyan/40 bg-surface/80 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(69,217,232,0.12)]">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono text-muted">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="Paste image URL (e.g. Google photo or portrait)"
                        className="w-full px-3 py-2 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 focus:ring-1 focus:ring-cyan/50 text-primary text-xs transition-colors placeholder:text-muted/40"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted/70">Or choose preset:</span>
                    <div className="flex items-center gap-1.5">
                      {CORPORATE_AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                            avatarUrl === preset.url ? 'border-cyan ring-1 ring-cyan/60 scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                          title={preset.label}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="text-[10px] font-mono text-muted/60 hover:text-coral transition-colors ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Role / Job Title & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Business Role / Title
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Finance Manager"
                        required
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 focus:ring-1 focus:ring-cyan/50 text-primary text-xs transition-colors placeholder:text-muted/50"
                      />
                    </div>
                    <span className="text-[10px] text-muted/70 mt-1 block">
                      Used to contextualize AI attack lures and targets.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Department
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                        <Building className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Finance & Treasury"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 focus:ring-1 focus:ring-cyan/50 text-primary text-xs transition-colors placeholder:text-muted/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                    Organization / Company
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. TechCorp Global"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0E141D] border border-[#1E293B] focus:border-cyan/60 focus:ring-1 focus:ring-cyan/50 text-primary text-xs transition-colors placeholder:text-muted/50"
                    />
                  </div>
                  <span className="text-[10px] text-muted/70 mt-1 block">
                    Policy rules in `/policies` are mapped to this organization.
                  </span>
                </div>

                {/* System Email (Read-Only) */}
                {user.email && (
                  <div>
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-muted mb-1.5">
                      Authentication Identity
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#080D12] border border-[#1E293B] text-muted text-xs cursor-not-allowed opacity-75"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted/60">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Banners */}
                {saveStatus === 'success' && (
                  <div className="p-3 rounded-xl bg-teal/15 border border-teal/30 text-teal text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Profile saved successfully! Dashboard updated in real-time.</span>
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="p-3 rounded-xl bg-coral/15 border border-coral/30 text-coral text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Pinned Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-[#1E293B] bg-[#080D12] flex items-center justify-between gap-3">
              {/* Logout button (Safe, Separate, with Confirmation) */}
              {!showLogoutConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-coral/80 hover:text-coral hover:bg-coral/10 border border-transparent hover:border-coral/20 transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted">Confirm sign out?</span>
                  <button
                    type="button"
                    onClick={executeLogout}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-coral hover:bg-coral/90 text-white transition-colors"
                  >
                    Yes, Log Out
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-2 py-1 rounded-lg text-xs text-muted hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-surface border border-primary/10 hover:border-primary/25 text-muted hover:text-primary text-xs font-mono transition-colors"
                >
                  Close
                </button>

                <button
                  type="submit"
                  form="profile-form"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue hover:bg-blue/90 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(79,124,255,0.25)] transition-all"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
