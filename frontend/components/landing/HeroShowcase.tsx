"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Eye, Mail, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';

const slides = [
  {
    label: 'Spot Threats',
    title: ['Spot red flags.', 'Make the right call.', 'Protect your team.'],
    description: 'Learn to recognize phishing, scam emails, and suspicious requests before any harm is done.',
  },
  {
    label: 'Take Action',
    title: ['Pause the pressure.', 'Check the facts.', 'Take safe action.'],
    description: 'Urgent requests try to rush you. Take a moment to verify details and choose the safest response.',
  },
  {
    label: 'Get Feedback',
    title: ['See how you did.', 'Learn key takeaways.', 'Build your confidence.'],
    description: 'Clear AI coaching explains the reasoning behind your choice and gives you practical tips for next time.',
  },
] as const;

function SignalVisual() {
  return <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
    <div className="landing-decision-card relative w-[84%] max-w-[440px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111821]/95 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-7">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#A5B8FF]" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Threat Inspection</span>
        </div>
        <span className="rounded-md border border-blue/20 bg-blue/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#A5B8FF]">Active Scanner</span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-white/[0.07] bg-[#0D131A] p-3.5">
          <div className="flex items-center justify-between font-mono text-[9px] text-muted">
            <span>SUSPICIOUS SENDER</span>
            <span className="text-[#A5B8FF]">Flagged</span>
          </div>
          <p className="mt-1 font-mono text-xs font-medium text-primary">support@verify-security-update.com</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/[0.07] bg-[#0D131A] p-3">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Risk Level</span>
            <p className="mt-1 text-sm font-semibold text-[#A5B8FF]">High Risk</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#0D131A] p-3">
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted">Confidence</span>
            <p className="mt-1 text-sm font-semibold text-primary">94% Match</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue/[0.18] bg-blue/[0.06] p-3.5">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#A5B8FF]">
            <Eye className="h-3.5 w-3.5" /> Red Flags Highlighted
          </div>
          <ul className="mt-2 space-y-1 text-xs text-[#B9C5D0]">
            <li className="flex items-center gap-1.5"><span className="text-[#A5B8FF]">●</span> Mismatched domain host</li>
            <li className="flex items-center gap-1.5"><span className="text-[#A5B8FF]">●</span> High-urgency deadline language</li>
          </ul>
        </div>
      </div>
    </div>
  </div>;
}

function DecisionVisual() {
  return <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
    <div className="landing-decision-card absolute left-[2%] top-[14%] w-[74%] max-w-[410px] rounded-2xl border border-white/[0.1] bg-[#111821]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:left-[10%] sm:p-6">
      <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] pb-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted"><span>Incoming Email</span><Mail className="h-4 w-4 text-[#A5B8FF]" /></div>
      <p className="text-[11px] text-muted">Payroll operations · 09:41</p>
      <h3 className="mt-3 max-w-[300px] text-[clamp(1.1rem,2.5vw,1.65rem)] font-medium leading-tight tracking-tight">Please verify your account before 5 PM.</h3>
      <p className="mt-4 text-xs leading-relaxed text-muted">A familiar request. An unfamiliar destination.</p>
    </div>
    <div className="landing-decision-card-delayed absolute bottom-[14%] right-[1%] w-[68%] max-w-[320px] rounded-2xl border border-blue/[0.23] bg-[#0E1722]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.56)] backdrop-blur-xl sm:right-[7%]">
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-[#A5B8FF]"><span>Threat detected</span><ShieldCheck className="h-4 w-4" /></div>
      <div className="mt-5 h-px bg-white/[0.07]" /><p className="mt-5 text-lg font-medium tracking-tight">Lookalike sender domain</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">Confirm the request through a known contact before entering credentials.</p>
      <div className="mt-5 rounded-lg border border-blue/[0.2] bg-blue/[0.08] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#A5B8FF]">Verify with payroll ↗</div>
    </div>
  </div>;
}

function DebriefVisual() {
  return <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
    <div className="landing-score-card relative w-[84%] max-w-[460px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111821]/95 shadow-[0_26px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#0D131A] px-5 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted"><span>Feedback Summary</span><Sparkles className="h-4 w-4 text-[#A5B8FF]" /></div>
      <div className="p-6 sm:p-8"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#A5B8FF]">Safe Decision</p>
        <div className="mt-3 flex items-end gap-3"><span className="text-[clamp(4.6rem,12vw,7rem)] font-medium leading-none tracking-[-0.1em] text-primary">92</span><span className="mb-2 font-mono text-[11px] text-muted">/ 100</span></div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full w-[92%] rounded-full bg-blue/80" /></div>
        <p className="mt-6 max-w-[340px] text-sm leading-relaxed text-[#B9C5D0]">You checked the request through a trusted channel before sharing information.</p>
        <div className="mt-6 flex items-center gap-2 border-t border-white/[0.07] pt-4 font-mono text-[9px] uppercase tracking-[0.13em] text-muted"><ShieldCheck className="h-3.5 w-3.5 text-[#A5B8FF]" /> Key takeaway for next time</div>
      </div>
    </div>
  </div>;
}

export default function HeroShowcase({ actionHref, actionLabel }: { actionHref: string; actionLabel: string }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduceMotion) setPlaying(false);
  }, [reduceMotion]);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    if (!playing || !visible || reduceMotion) return;
    const timer = window.setTimeout(() => setActive(index => (index + 1) % slides.length), 4500);
    return () => window.clearTimeout(timer);
  }, [active, playing, visible, reduceMotion]);

  const showSlide = (index: number) => { setActive((index + slides.length) % slides.length); };
  const slide = slides[active];

  return <div className="relative z-10 w-full" role="region" aria-roledescription="carousel" aria-label="Midnight Intelligence introduction"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={reduceMotion ? false : { opacity: 0, x: 24, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={reduceMotion ? undefined : { opacity: 0, x: -24, filter: 'blur(6px)' }} transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto grid max-w-[1600px] items-center gap-4 px-5 pt-8 md:px-10 lg:h-[500px] lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:pt-4" role="group" aria-roledescription="slide" aria-label={`${active + 1} of ${slides.length}: ${slide.label}`}>
          <div className="relative z-10 flex h-full max-w-[690px] flex-col justify-center">
            <h1 id="hero-title" className="text-[clamp(3rem,5vw,5.8rem)] font-medium leading-[0.98] tracking-[-0.075em]">
              {slide.title.map((line, index) => <React.Fragment key={line}><span className={index === 0 ? 'text-primary' : index === 1 ? 'text-[#A7B1BD]' : 'text-[#727E8B]'}>{line}</span>{index < slide.title.length - 1 && <br />}</React.Fragment>)}
            </h1>
            <p className="mt-6 max-w-[430px] text-sm leading-[1.8] text-[#AAB5C2] sm:text-[15px]">{slide.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={actionHref} className="midnight-action group inline-flex items-center gap-2 rounded-lg px-5 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.1em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">{actionLabel}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
              <a href="#demo" className="midnight-quiet-action inline-flex items-center gap-2 rounded-lg px-5 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">Explore the demo<ArrowUpRight className="h-3.5 w-3.5" /></a>
            </div>
          </div>
          <div className="relative z-10 h-[360px] w-full min-w-0 sm:h-[420px] lg:h-[460px]">
            {active === 0 ? <SignalVisual /> : active === 1 ? <DecisionVisual /> : <DebriefVisual />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-start gap-4 px-5 pb-5 pt-3 md:px-10">
      <div className="flex items-center gap-2" role="group" aria-label="Choose a hero slide">
        {slides.map((item, index) => <button key={item.label} type="button" onClick={() => showSlide(index)} aria-label={`Show ${item.label.toLowerCase()} slide`} aria-current={active === index ? 'true' : undefined}
          className={`group flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue ${active === index ? 'border-blue/[0.28] bg-blue/[0.12] text-[#BED0FF]' : 'border-white/[0.07] bg-white/[0.025] text-muted hover:border-white/[0.16] hover:text-primary'}`}>
          <span className={`h-1 w-1 rounded-full ${active === index ? 'bg-blue' : 'bg-white/20'}`} />{item.label}</button>)}
      </div>
    </div>
  </div>;
}
