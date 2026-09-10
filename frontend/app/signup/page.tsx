"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          company: company || "Custom Organization",
          role: "Employee",
          access_role: "learner"
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed. Please try again.');
      }

      const data = await res.json();
      localStorage.setItem('cyberguard_token', data.access_token);
      localStorage.setItem('cyberguard_user', JSON.stringify(data.user));

      // Redirect directly to organization policy onboarding
      router.push('/onboarding');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to authentication service.');
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

  return (
    <main className="min-h-screen bg-background text-primary font-sans overflow-hidden selection:bg-blue/20 relative flex flex-col justify-center items-center px-6 py-12">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <nav className="w-full max-w-[1200px] absolute top-0 pt-8 pb-4 px-6 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
          <span className="font-semibold text-lg tracking-tight">CyberGuard AI</span>
        </Link>
        <Link href="/login" className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors font-medium">
          Sign In →
        </Link>
      </nav>

      {/* Signup Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="w-full max-w-md bg-surface rounded-[2rem] p-8 md:p-10 border border-primary/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue/10 border border-blue/20 text-cyan mb-4">
            <span className="text-xl">✨</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary mb-1">
            Create your account
          </h1>
          <p className="text-xs text-muted">
            Personalize training simulations for your team & company
          </p>
        </div>

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Google Signup Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full py-3 px-4 mb-5 rounded-xl bg-background border border-primary/15 text-primary text-sm font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-3 shadow-sm group"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span className="group-hover:text-cyan transition-colors">Sign up with Google</span>
        </button>

        <div className="relative mb-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-primary/10"></div>
          </div>
          <span className="relative px-3 bg-surface text-[11px] uppercase tracking-widest text-muted">Or with email</span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
              Full Name
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
              Company / Organization
            </label>
            <input 
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Apex Financial Group"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
              Work Email
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@apexfinancial.com"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-1.5">
              Password
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-blue text-white font-medium text-sm tracking-wide hover:bg-cyan hover:text-black transition-all duration-200 shadow-lg shadow-blue/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <span>Setting up account...</span>
            ) : (
              <>
                <span>Continue to Onboarding</span>
                <span className="text-lg leading-none">→</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">
          Already registered?{' '}
          <Link href="/login" className="text-cyan font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
