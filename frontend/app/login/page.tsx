"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import AuthShell, { GoogleMark } from '@/components/auth/AuthShell';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Authentication failed. Please verify credentials.');
      }

      const data = await response.json();
      localStorage.setItem('cyberguard_token', data.access_token);
      localStorage.setItem('cyberguard_user', JSON.stringify(data.user));
      router.push(data.user.access_role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to connect to the authentication service. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktivturksaummardilyu.supabase.co';
    const redirectTo = `${window.location.origin}/dashboard`;
    window.location.href = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  return <AuthShell mode="signin">
    {errorMessage && <div role="alert" className="mb-5 rounded-lg border border-[#D96868]/25 bg-[#D96868]/[0.08] px-3 py-2.5 text-xs leading-relaxed text-[#F2A1A1]">{errorMessage}</div>}

    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted">Work email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" className="auth-input" />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter your password" className="auth-input" />
      </div>
      <button type="submit" disabled={loading} className="midnight-action mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue disabled:cursor-wait disabled:opacity-50">
        {loading ? 'Verifying identity...' : <>Sign in <ArrowRight className="h-3.5 w-3.5" /></>}
      </button>

      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">Demo Accounts:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setEmail('admin@novatech.com'); setPassword('password123'); }}
            className="font-mono text-[10px] px-2.5 py-1 rounded bg-blue/10 border border-blue/25 text-blue hover:bg-blue/20 transition-all"
          >
            SecOps Admin
          </button>
          <button
            type="button"
            onClick={() => { setEmail('nimal@novatech.com'); setPassword('password123'); }}
            className="font-mono text-[10px] px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-muted hover:text-primary transition-all"
          >
            Learner
          </button>
        </div>
      </div>
    </form>


    <div className="my-6 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted/70"><span className="h-px flex-1 bg-white/[0.07]" />Or continue with<span className="h-px flex-1 bg-white/[0.07]" /></div>
    <button type="button" onClick={handleGoogleLogin} disabled={loading} className="midnight-quiet-action flex min-h-11 w-full items-center justify-center gap-2.5 rounded-lg px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue disabled:cursor-wait disabled:opacity-50">
      <GoogleMark /> Continue with Google
    </button>
    <p className="mt-7 text-center text-xs text-muted">New to Midnight Intelligence? <Link href="/signup" className="font-medium text-[#A5B8FF] hover:text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">Create an account</Link></p>
  </AuthShell>;
}
