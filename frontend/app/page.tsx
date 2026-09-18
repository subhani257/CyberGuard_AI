"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import LogosStrip from '@/components/landing/LogosStrip';
import ProblemSolution from '@/components/landing/ProblemSolution';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeatureHighlights from '@/components/landing/FeatureHighlights';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import TrustBadges from '@/components/landing/TrustBadges';

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<{ full_name?: string; name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cyberguard_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u && (u.id || u.email)) setCurrentUser(u);
        } catch (_) {}
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('cyberguard_token');
    localStorage.removeItem('cyberguard_user');
    setCurrentUser(null);
  };

  const navVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans selection:bg-white/10 relative overflow-x-hidden">

      {/* ── Ambient background — single deep glow, no cartoon colors ── */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        {/* Primary deep indigo pool */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(79,124,255,0.06) 0%, transparent 70%)' }} />
        {/* Secondary very faint bottom right */}
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(79,124,255,0.03) 0%, transparent 65%)' }} />
      </div>

      {/* ── Y2K fine grid across entire page ── */}
      <div className="pointer-events-none fixed inset-0 -z-10 grid-overlay opacity-100" />

      {/* ══════════════════════════════════════
          NAVIGATION
      ══════════════════════════════════════ */}
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="w-full fixed top-0 z-50"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(11,15,20,0.80)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between">

          {/* Brand mark */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-lg leading-none opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: '#4F7CFF' }}>◉</span>
            <span className="font-semibold tracking-tight text-primary">Midnight Intelligence</span>
            <span className="hidden md:inline-block text-[10px] font-mono text-white/25 ml-1 tracking-widest uppercase">v2.0</span>
          </Link>

          {/* Anchor links */}
          <div className="hidden md:flex items-center gap-8">
            {['How it works', 'Features', 'Reviews', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-[13px] text-muted hover:text-primary transition-colors duration-200 tracking-wide"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Auth */}
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-block text-[11px] font-mono text-white/30 tracking-wide">
                {currentUser.full_name || currentUser.name || currentUser.email}
              </span>
              <Link
                href="/dashboard"
                className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all duration-200"
                style={{ background: 'rgba(79,124,255,0.12)', border: '1px solid rgba(79,124,255,0.2)', color: '#a5b8ff' }}
              >
                Dashboard →
              </Link>
              <button
                onClick={handleSignOut}
                className="text-[11px] font-mono text-white/30 hover:text-white/60 transition-colors"
              >
                sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[13px] text-muted hover:text-primary transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-[12px] font-medium px-4 py-2 rounded-lg text-white transition-all duration-200 hover:opacity-90"
                style={{ background: '#4F7CFF' }}
              >
                Start Free
              </Link>
            </div>
          )}
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 md:px-12 max-w-[1440px] mx-auto pt-16">

        {/* System label */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-3 mb-10"
        >
          <span className="h-px w-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <span className="text-[11px] font-mono tracking-[0.22em] uppercase"
            style={{ color: 'rgba(141,152,165,0.7)' }}>
            Midnight Intelligence · Security Training Platform
          </span>
          <span className="h-px w-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </motion.div>

        {/* Headline — chrome metallic */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-[52px] md:text-[84px] lg:text-[108px] font-semibold tracking-tighter leading-[0.95] text-center mb-8"
        >
          <span className="chrome-text">Real situations.</span>
          <br />
          <span className="text-primary opacity-80">Better decisions.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[17px] md:text-[20px] text-center max-w-xl mx-auto mb-3 leading-relaxed"
          style={{ color: 'rgba(141,152,165,0.85)' }}
        >
          Practice making the right cybersecurity decision before the real moment arrives.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="text-[12px] font-mono text-center mb-12"
          style={{ color: 'rgba(141,152,165,0.35)', letterSpacing: '0.08em' }}
        >
          Every breach has a human moment. We train that moment.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href={currentUser ? '/dashboard' : '/signup'}
            className="px-7 py-3.5 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90 hover:translate-y-[-1px]"
            style={{
              background: '#4F7CFF',
              boxShadow: '0 0 40px rgba(79,124,255,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            {currentUser ? 'Open Dashboard' : 'Start Free — No Card Required'} →
          </Link>

          <a
            href="#how-it-works"
            className="text-[13px] transition-colors duration-200"
            style={{ color: 'rgba(141,152,165,0.6)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E8EDF2')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(141,152,165,0.6)')}
          >
            See how it works ↓
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-wrap justify-center gap-6 mt-10"
        >
          {['14-day free trial', 'No credit card required', 'Cancel anytime', 'NIST-aligned coaching'].map((item, i) => (
            <span key={i} className="text-[11px] font-mono flex items-center gap-2"
              style={{ color: 'rgba(141,152,165,0.38)', letterSpacing: '0.05em' }}>
              <span style={{ color: 'rgba(79,124,255,0.5)' }}>—</span>
              {item}
            </span>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-10 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="absolute w-full"
              style={{ height: '40%', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))' }}
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>
      </section>

      {/* Separator */}
      <div className="separator mx-auto max-w-[1440px]" />

      {/* All sections */}
      <LogosStrip />
      <div className="separator" />
      <ProblemSolution />
      <div className="separator" />
      <HowItWorksSection />
      <div className="separator" />
      <FeatureHighlights />
      <div className="separator" />
      <TestimonialsSection />
      <div className="separator" />
      <PricingSection />
      <div className="separator" />
      <TrustBadges />

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="py-28 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="max-w-3xl mx-auto text-center rounded-2xl p-16 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 0 120px rgba(79,124,255,0.07)',
          }}
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(79,124,255,0.06) 0%, transparent 65%)' }} />

          <p className="text-[11px] font-mono tracking-[0.22em] uppercase mb-5"
            style={{ color: 'rgba(141,152,165,0.45)' }}>
            One real scenario could be all it takes
          </p>

          <h2 className="text-[36px] md:text-[52px] font-semibold tracking-tight leading-tight mb-6">
            Train your team before<br />
            <span style={{
              background: 'linear-gradient(135deg, #c8d0dc, #e8edf2, #9aa6b4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              a real attacker does.
            </span>
          </h2>

          <p className="text-[16px] max-w-md mx-auto mb-10 leading-relaxed"
            style={{ color: 'rgba(141,152,165,0.7)' }}>
            Every moment of hesitation in a live attack costs thousands.
            Midnight Intelligence turns hesitation into coached instinct.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-xl text-[14px] font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{
                background: '#4F7CFF',
                boxShadow: '0 0 40px rgba(79,124,255,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              Start Free Trial →
            </Link>
            <a
              href="mailto:hello@midnightintelligence.ai"
              className="px-7 py-3.5 rounded-xl text-[13px] transition-all duration-200"
              style={{
                color: 'rgba(141,152,165,0.7)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E8EDF2';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(141,152,165,0.7)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              Talk to Sales ↗
            </a>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex items-center gap-2.5">
            <span style={{ color: '#4F7CFF', opacity: 0.5 }}>◉</span>
            <span className="font-semibold text-[14px] tracking-tight">Midnight Intelligence</span>
            <span className="text-[10px] font-mono ml-2" style={{ color: 'rgba(141,152,165,0.3)' }}>by CyberGuard AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-7">
            {[
              { label: 'Privacy', href: '/policies' },
              { label: 'Terms', href: '/policies' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'GitHub', href: 'https://github.com' },
            ].map((l) => (
              <a key={l.label} href={l.href}
                className="text-[12px] font-mono transition-colors duration-200"
                style={{ color: 'rgba(141,152,165,0.4)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E8EDF2')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(141,152,165,0.4)')}
              >
                {l.label}
              </a>
            ))}
          </div>

          <p className="text-[11px] font-mono" style={{ color: 'rgba(141,152,165,0.25)' }}>
            © 2026 Midnight Intelligence
          </p>
        </div>
      </footer>

    </main>
  );
}
