"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Cloud, HardDrive, Mail, MessageSquare, Phone, QrCode, Smartphone } from 'lucide-react';
import LandingDemo from '@/components/landing/LandingDemo';
import HeroShowcase from '@/components/landing/HeroShowcase';
import { SECTORS } from '@/lib/sectors';

const channelIcons = { Phone, Mail, MessageSquare, QrCode, Cloud, Smartphone, HardDrive };
const steps = [
  { number: '01', title: 'Read the situation', text: 'A realistic request arrives through a familiar channel. Notice key details and subtle red flags.', label: 'SCENARIO' },
  { number: '02', title: 'Make the call', text: 'Choose a response and explain your reasoning. Your decision and thinking both matter.', label: 'DECISION' },
  { number: '03', title: 'See what mattered', text: 'Get a clear score, key takeaways, and practical advice for next time.', label: 'DEBRIEF' },
];

export default function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [currentUser, setCurrentUser] = useState<{ full_name?: string; name?: string; email?: string } | null>(null);
  const [selectedSector, setSelectedSector] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('cyberguard_user');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      if (user && (user.id || user.email)) setCurrentUser(user);
    } catch (_) {}
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('cyberguard_token');
    localStorage.removeItem('cyberguard_user');
    setCurrentUser(null);
  };

  const actionHref = currentUser ? '/dashboard' : '/signup';
  const actionLabel = currentUser ? 'Open dashboard' : 'Start training';
  const activeSector = SECTORS[selectedSector];
  const ActiveIcon = channelIcons[activeSector.iconName];

  return <main className="min-h-screen bg-background font-sans text-primary selection:bg-blue/20">
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.055] bg-[#0B0F14]/90 backdrop-blur-xl shadow-lg transition-all">
      <nav className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-6 px-5 md:px-10" aria-label="Main navigation">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue" aria-label="Midnight Intelligence home">
          <span className="text-lg leading-none text-blue/80 transition-opacity group-hover:opacity-100" aria-hidden="true">◉</span>
          <span className="truncate text-[13px] font-semibold tracking-tight sm:text-sm">Midnight Intelligence</span>
        </Link>

        <div className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-wider text-muted md:flex">
          <a href="#top" className="transition-colors hover:text-primary">Home</a>
          <a href="#method" className="transition-colors hover:text-primary">How it works</a>
          <a href="#channels" className="transition-colors hover:text-primary">Threat channels</a>
          <a href="#demo" className="transition-colors hover:text-primary">Interactive demo</a>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {currentUser ? <>
            <button type="button" onClick={handleSignOut} className="midnight-quiet-action hidden rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-wide transition-all sm:block">Sign out</button>
            <Link href="/dashboard" className="midnight-action rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-wide transition-all sm:px-4">Dashboard <span className="hidden sm:inline">↗</span></Link>
          </> : <>
            <Link href="/login" className="midnight-quiet-action rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-wide transition-all">Sign in</Link>
            <Link href="/signup" className="midnight-action rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-wide transition-all sm:px-4">Get started</Link>
          </>}
        </div>
      </nav>
    </header>

    <section id="top" className="landing-stage relative isolate flex min-h-screen flex-col justify-between pt-[72px] border-b border-white/[0.06]" aria-labelledby="hero-title">
      <div className="landing-stage-particles pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="my-auto py-4">
        <HeroShowcase actionHref={actionHref} actionLabel={actionLabel} />
      </div>

      <div className="relative z-20 mx-auto pb-6 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/60">Scroll to explore ↓</span>
      </div>
    </section>

    <section className="relative mx-auto grid max-w-[1600px] items-center gap-12 px-5 py-24 md:px-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-16 lg:py-32" aria-labelledby="demo-title">
      <div className="lg:self-start lg:pt-7">
        <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A5B8FF]">Interactive Practice</p>
        <h2 id="demo-title" className="max-w-[470px] text-[clamp(2.5rem,4.3vw,4.7rem)] font-medium leading-[1.05] tracking-[-0.06em]">The safest move starts with quick thinking.</h2>
        <p className="mt-6 max-w-[380px] text-sm leading-[1.8] text-muted">Try a real-world decision. Review the context, make your choice, and see instant feedback on your response.</p>
        <div className="mt-9 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-muted"><span className="rounded-md border border-white/[0.08] px-2.5 py-1.5">04 Practice Scenarios</span><span className="rounded-md border border-white/[0.08] px-2.5 py-1.5">Real-time Feedback</span></div>
      </div>
      <LandingDemo />
    </section>

    <section id="method" className="scroll-mt-10 border-y border-white/[0.06] bg-[#0D131A]" aria-labelledby="method-title">
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 lg:py-24">
        <div className="mb-11 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A5B8FF]">Simple 3-Step Process</p><h2 id="method-title" className="max-w-[720px] text-3xl font-medium tracking-tight sm:text-5xl">Learn through realistic practice.</h2></div><p className="max-w-sm text-sm leading-relaxed text-muted">Each scenario gives you realistic situations and practical feedback to build your security instincts.</p></div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.07] md:grid-cols-3">
          {steps.map((step, index) => <motion.article key={step.number} initial={reduceMotion ? false : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: index * 0.08 }} className="min-h-[205px] bg-[#111821] p-6 sm:p-7">
            <div className="mb-9 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-[#A5B8FF]"><span>Step {step.number} · {step.label}</span><span className="h-1.5 w-1.5 rounded-full bg-blue/65" /></div>
            <h3 className="text-lg font-medium tracking-tight">{step.title}</h3><p className="mt-3 max-w-sm text-xs leading-relaxed text-muted">{step.text}</p>
          </motion.article>)}
        </div>
      </div>
    </section>

    <section id="channels" className="mx-auto max-w-[1600px] scroll-mt-10 px-5 py-20 md:px-10 lg:py-24" aria-labelledby="channels-title">
      <div className="mb-9 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A5B8FF]">Multi-Channel Training</p><h2 id="channels-title" className="max-w-[680px] text-3xl font-medium leading-tight tracking-tight sm:text-5xl">Threats come in many forms.<br />Be ready across every channel.</h2></div><p className="max-w-sm text-sm leading-relaxed text-muted">Select a channel below to see what each training module covers.</p></div>
      <div className="grid overflow-hidden rounded-2xl border border-white/[0.08] bg-surface lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-2">
          {SECTORS.map((sector, index) => {
            const Icon = channelIcons[sector.iconName];
            return <button key={sector.channel} type="button" onClick={() => setSelectedSector(index)} aria-pressed={selectedSector === index} className={`flex min-h-[86px] items-center gap-3 bg-[#111821] px-4 text-left text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue ${selectedSector === index ? 'bg-blue/[0.10] text-[#A5B8FF]' : 'text-muted hover:bg-white/[0.04] hover:text-primary'}`}><Icon className={`h-4 w-4 shrink-0 ${selectedSector === index ? 'text-[#A5B8FF]' : 'text-muted'}`} /><span>{sector.label}</span></button>;
          })}
        </div>
        <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden border-t border-white/[0.08] p-7 sm:p-10 lg:border-l lg:border-t-0">
          <div className="pointer-events-none absolute -right-12 -top-12 text-[250px] font-thin leading-none text-blue/[0.055]" aria-hidden="true">◉</div>
          <AnimatePresence mode="wait"><motion.div key={activeSector.channel} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="relative">
            <div className="mb-7 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A5B8FF]">Selected training module</span><span className="font-mono text-[10px] text-muted">Module {String(selectedSector + 1).padStart(2, '0')} of 07</span></div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-blue/25 bg-blue/10"><ActiveIcon className="h-6 w-6 text-[#A5B8FF]" /></div>
            <h3 className="text-2xl font-medium tracking-tight">{activeSector.label}</h3><p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{activeSector.description}</p>
          </motion.div></AnimatePresence>
          <a href="#demo" className="relative mt-8 inline-flex items-center gap-2 self-start text-xs font-medium text-[#A5B8FF] transition-colors hover:text-white">Try a sample decision <ArrowUpRight className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </section>

    <section className="px-5 pb-20 md:px-10 lg:pb-24"><div className="relative mx-auto flex max-w-[1520px] flex-col justify-between gap-8 overflow-hidden rounded-2xl border border-blue/20 bg-[#111821] p-8 sm:p-10 lg:flex-row lg:items-center lg:p-12"><div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(79,124,255,0.08),transparent_70%)]" aria-hidden="true" /><div className="relative"><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A5B8FF]">Ready to get started?</p><h2 className="max-w-[720px] text-3xl font-medium tracking-tight sm:text-4xl">Start practicing today. Build lasting security skills.</h2><p className="mt-3 text-sm text-muted">A safer organization starts with a single decision.</p></div><Link href={actionHref} className="midnight-action relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">{actionLabel}<ArrowRight className="h-4 w-4" /></Link></div></section>

    <footer className="border-t border-white/[0.06] bg-[#0B0F14]"><div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-10"><div className="flex items-center gap-2.5"><span className="text-blue/80">◉</span><span className="text-xs font-semibold">Midnight Intelligence</span></div><p className="font-mono text-[10px] text-muted">Practical cybersecurity training for real-world decisions.</p><div className="flex gap-5 text-[11px] text-muted"><Link href="/policies" className="hover:text-primary">Policies</Link><Link href={currentUser ? '/dashboard' : '/login'} className="hover:text-primary">{currentUser ? 'Dashboard' : 'Sign in'}</Link><a href="#top" className="hover:text-primary">Back to top ↑</a></div></div></footer>
  </main>;
}
