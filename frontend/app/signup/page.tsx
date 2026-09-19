"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import AuthShell, { GoogleMark } from '@/components/auth/AuthShell';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('cyberguard_user');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      if (user && (user.id || user.email)) router.replace('/dashboard');
    } catch (_) {}
  }, [router]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          company: company || 'Custom Organization',
          role: 'Employee',
          access_role: 'learner',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed. Please try again.');
      }

      const data = await response.json();
      localStorage.setItem('cyberguard_token', data.access_token);
      localStorage.setItem('cyberguard_user', JSON.stringify(data.user));
      router.push('/onboarding');
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktivturksaummardilyu.supabase.co';
    const redirectTo = `${window.location.origin}/onboarding`;
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  return <AuthShell mode="signup">
    {errorMessage && <div role="alert" className="mb-5 rounded-lg border border-[#D96868]/25 bg-[#D96868]/[0.08] px-3 py-2.5 text-xs leading-relaxed text-[#F2A1A1]">{errorMessage}</div>}

    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted">Full name</label>
        <input id="signup-name" name="name" type="text" autoComplete="name" required value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Alex Turner" className="auth-input" />
      </div>
      <div>
        <label htmlFor="signup-company" className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted">Company / organization</label>
        <input id="signup-company" name="organization" type="text" autoComplete="organization" required value={company} onChange={event => setCompany(event.target.value)} placeholder="Your organization" className="auth-input" />
      </div>
      <div>
        <label htmlFor="signup-email" className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted">Work email</label>
        <input id="signup-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" className="auth-input" />
      </div>
      <div>
        <label htmlFor="signup-password" className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted">Password</label>
        <input id="signup-password" name="password" type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a password" className="auth-input" />
      </div>
      <button type="submit" disabled={loading} className="midnight-action mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue disabled:cursor-wait disabled:opacity-50">
        {loading ? 'Setting up account...' : <>Create account <ArrowRight className="h-3.5 w-3.5" /></>}
      </button>
    </form>

    <div className="my-6 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted/70"><span className="h-px flex-1 bg-white/[0.07]" />Or continue with<span className="h-px flex-1 bg-white/[0.07]" /></div>
    <button type="button" onClick={handleGoogleSignup} disabled={loading} className="midnight-quiet-action flex min-h-11 w-full items-center justify-center gap-2.5 rounded-lg px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue disabled:cursor-wait disabled:opacity-50">
      <GoogleMark /> Continue with Google
    </button>
    <p className="mt-7 text-center text-xs text-muted">Already have an account? <Link href="/login" className="font-medium text-[#A5B8FF] hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">Sign in</Link></p>
  </AuthShell>;
}
