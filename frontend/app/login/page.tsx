"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('nimal@novatech.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Direct call to Member 3 FastAPI auth route
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Authentication failed. Please verify credentials.');
      }

      const data = await res.json();
      
      // Store token and user profile securely in localStorage
      localStorage.setItem('cyberguard_token', data.access_token);
      localStorage.setItem('cyberguard_user', JSON.stringify(data.user));

      // Role-based routing
      if (data.user.access_role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      // Fallback demo authentication for offline testing / presentation
      if (password === 'password123') {
        const demoUser = {
          id: '11111111-1111-1111-1111-111111111111',
          email,
          full_name: email.split('@')[0].toUpperCase(),
          role: 'Finance Manager',
          access_role: email.includes('admin') ? 'admin' : 'learner',
          is_active: true
        };
        localStorage.setItem('cyberguard_token', 'demo_jwt_token_simulated');
        localStorage.setItem('cyberguard_user', JSON.stringify(demoUser));
        
        if (demoUser.access_role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }
      setErrorMessage(err.message || 'Unable to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans overflow-hidden selection:bg-blue/20 relative flex flex-col justify-center items-center px-6">
      
      {/* Subtle Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue/10 rounded-full blur-[140px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <nav className="w-full max-w-[1200px] absolute top-0 pt-8 pb-4 px-6 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
          <span className="font-semibold text-lg tracking-tight">CyberGuard AI</span>
        </Link>
        <span className="text-xs uppercase tracking-widest text-muted font-medium">
          Member 3 Security Gateway
        </span>
      </nav>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-surface rounded-[2rem] p-8 md:p-10 border border-primary/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative z-10"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue/10 border border-blue/20 text-cyan mb-4">
            <span className="text-xl">🔒</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary mb-2">
            Sign in to CyberGuard
          </h1>
          <p className="text-xs text-muted">
            Authenticated session required for adaptive simulations
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

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-2">
              Corporate Email
            </label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@novatech.com"
              className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wider uppercase text-muted mb-2">
              Password
            </label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-background border border-primary/10 text-primary text-sm focus:outline-none focus:border-cyan/60 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-blue text-white font-medium text-sm tracking-wide hover:bg-cyan hover:text-black transition-all duration-200 shadow-lg shadow-blue/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Identity...</span>
            ) : (
              <>
                <span>Access Training Platform</span>
                <span className="text-lg leading-none">→</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Bar */}
        <div className="mt-8 pt-6 border-t border-primary/5">
          <p className="text-[10px] uppercase tracking-widest text-muted font-bold text-center mb-3">
            Quick Test Identities
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setDemoAccount('nimal@novatech.com')}
              className="text-xs px-2.5 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 text-muted hover:text-primary transition-colors"
            >
              Learner (Nimal)
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('admin@novatech.com')}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber/10 hover:bg-amber/20 text-amber transition-colors"
            >
              Admin (CISO)
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('trainer@novatech.com')}
              className="text-xs px-2.5 py-1 rounded-lg bg-cyan/10 hover:bg-cyan/20 text-cyan transition-colors"
            >
              Trainer
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
