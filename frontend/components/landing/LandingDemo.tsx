"use client";

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Mail, MessageSquare, Pause, Play, QrCode, RotateCcw, ShieldAlert, Smartphone } from 'lucide-react';

type Phase = 'incoming' | 'clue' | 'decision' | 'result';
type Choice = 'safe' | 'risky' | null;

const scenarios = [
  {
    channel: 'Email', Icon: Mail, source: 'Payroll operations', address: 'payroll@northstar-verify.example',
    subject: 'Action needed: confirm your pay details',
    body: 'We are updating the payroll system today. Open the secure form before 5 PM to avoid a delay in your next payment.',
    clue: 'Lookalike sender domain', clueDetail: 'The sender uses an external verification domain instead of the usual company address.',
    safe: 'Verify with payroll', risky: 'Open the form', safeScore: 92, riskyScore: 28,
    safeTip: 'You checked the request through a trusted channel before sharing information.',
    riskyTip: 'Pause before opening payroll links. Contact the team through a known address or directory.'
  },
  {
    channel: 'Chat', Icon: MessageSquare, source: 'IT Help Desk', address: 'Direct message · outside your team',
    subject: 'Quick access check',
    body: 'I need you to sign in to the link below so your account stays active. Please do this before the next meeting.',
    clue: 'Unsolicited sign-in link', clueDetail: 'A direct message asks for account access outside the normal support process.',
    safe: 'Check with IT', risky: 'Follow the link', safeScore: 88, riskyScore: 24,
    safeTip: 'You used the established support channel to confirm the request.',
    riskyTip: 'Treat unexpected sign-in links in chat as suspicious, even when the sender sounds familiar.'
  },
  {
    channel: 'MFA', Icon: Smartphone, source: 'Authenticator', address: 'New sign-in request',
    subject: 'Approve sign-in?',
    body: 'A sign-in request appeared on your phone. You did not start a login, but the approval prompts keep arriving.',
    clue: 'Unrequested approval', clueDetail: 'Repeated prompts can be an attempt to wear down your attention.',
    safe: 'Deny and report', risky: 'Approve prompt', safeScore: 96, riskyScore: 18,
    safeTip: 'You denied an unrequested prompt and alerted the right team.',
    riskyTip: 'Never approve an MFA request you did not initiate. Deny it and report the activity.'
  },
  {
    channel: 'QR', Icon: QrCode, source: 'Facilities notice', address: 'Poster near the entrance',
    subject: 'Badge revalidation',
    body: 'A printed notice asks you to scan a QR code and sign in to keep building access active this week.',
    clue: 'Unknown QR destination', clueDetail: 'The destination is hidden until you inspect the code or confirm the notice.',
    safe: 'Confirm the notice', risky: 'Scan and sign in', safeScore: 90, riskyScore: 31,
    safeTip: 'You confirmed the request before entering credentials at an unknown destination.',
    riskyTip: 'Verify unexpected QR sign-in requests with facilities before entering credentials.'
  }
] as const;

const phaseNames: Record<Phase, string> = {
  incoming: 'Incoming request', clue: 'Security flag', decision: 'Your decision', result: 'Feedback ready'
};

export default function LandingDemo() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>('incoming');
  const [choice, setChoice] = useState<Choice>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const scenario = scenarios[active];
  const Icon = scenario.Icon;

  useEffect(() => {
    if (!reduceMotion) return;
    setPlaying(false);
    setPhase('decision');
  }, [reduceMotion]);

  useEffect(() => {
    if (!playing || hovered || focused || reduceMotion) return;
    const delay = phase === 'incoming' ? 1500 : phase === 'clue' ? 1900 : phase === 'decision' ? 2500 : 4000;
    const timer = window.setTimeout(() => {
      if (phase === 'incoming') setPhase('clue');
      else if (phase === 'clue') setPhase('decision');
      else if (phase === 'decision') {
        setChoice('safe');
        setPhase('result');
      } else {
        setActive(index => (index + 1) % scenarios.length);
        setChoice(null);
        setPhase('incoming');
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, phase, playing, hovered, focused, reduceMotion]);

  const chooseScenario = (index: number) => {
    setActive(index);
    setChoice(null);
    setPhase('decision');
    setPlaying(false);
  };
  const chooseAction = (nextChoice: Exclude<Choice, null>) => {
    setChoice(nextChoice);
    setPhase('result');
    setPlaying(false);
  };
  const replay = () => {
    setChoice(null);
    setPhase(reduceMotion ? 'decision' : 'incoming');
    setPlaying(!reduceMotion);
  };

  const isSafe = choice !== 'risky';
  const score = isSafe ? scenario.safeScore : scenario.riskyScore;

  return <div id="demo" className="relative scroll-mt-24" aria-label="Interactive cybersecurity decision demo"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
    <div className="landing-orbit pointer-events-none absolute -inset-5 rounded-[2rem]" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-surface shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] bg-[#0D131A] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5"><span className="text-[15px] leading-none text-blue" aria-hidden="true">◉</span><span className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Midnight Decision Lab</span></div>
        <span className="shrink-0 rounded-md border border-blue/20 bg-blue/[0.08] px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#A5B8FF]">Interactive demo</span>
      </div>

      <div className="grid grid-cols-4 gap-px bg-white/[0.06]" role="group" aria-label="Choose a demo scenario">
        {scenarios.map((item, index) => {
          const ChannelIcon = item.Icon;
          return <button key={item.channel} type="button" onClick={() => chooseScenario(index)} aria-pressed={active === index}
            className={`flex items-center justify-center gap-1.5 bg-[#111821] px-1 py-3 font-mono text-[10px] font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue ${active === index ? 'bg-blue/[0.10] text-[#A5B8FF]' : 'text-muted hover:bg-white/[0.04] hover:text-primary'}`}>
            <ChannelIcon className="h-3.5 w-3.5 shrink-0" /><span>{item.channel}</span>
          </button>;
        })}
      </div>

      <div className="grid min-h-[432px] md:grid-cols-[1.35fr_0.65fr]">
        <div className="relative flex min-w-0 flex-col p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A5B8FF]">Scenario {String(active + 1).padStart(2, '0')}</span><span className="flex items-center gap-1.5 font-mono text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-blue" />{phaseNames[phase]}</span></div>

          <AnimatePresence mode="wait">
            {phase !== 'result' ? <motion.div key={`message-${active}`} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="relative flex flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-white/[0.07] pb-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue/20 bg-blue/[0.08]"><Icon className="h-4 w-4 text-[#A5B8FF]" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{scenario.source}</p><p className="truncate font-mono text-[10px] text-muted">{scenario.address}</p></div></div>
              <div className="relative flex-1 py-5"><h3 className="max-w-md text-lg font-semibold leading-snug tracking-tight">{scenario.subject}</h3><p className="mt-4 max-w-md text-[13px] leading-relaxed text-[#AAB5C2]">{scenario.body}</p>{(phase === 'incoming' || phase === 'clue') && !reduceMotion && <div className="landing-scanline pointer-events-none absolute inset-x-0 h-px bg-blue/30" aria-hidden="true" />}</div>
              <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => chooseAction('safe')} className="landing-action rounded-lg px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">{scenario.safe}</button><button type="button" onClick={() => chooseAction('risky')} className="landing-quiet-action rounded-lg px-3 py-2.5 font-mono text-[10px] uppercase tracking-wide transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue">{scenario.risky}</button></div>
            </motion.div> : <motion.div key={`result-${active}-${choice}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.25 }} className="flex flex-1 flex-col justify-center" role="status" aria-live="polite">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Performance evaluation</span><div className="mt-3 flex items-end gap-3"><span className={`text-[88px] font-semibold leading-none tracking-[-0.08em] ${isSafe ? 'text-[#34D399]' : 'text-[#F87171]'}`}>{score}</span><span className="mb-2 font-mono text-[11px] text-muted">/ 100</span></div><div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: reduceMotion ? 0 : 0.65 }} className={`h-full rounded-full ${isSafe ? 'bg-[#34D399]' : 'bg-[#F87171]'}`} /></div><p className={`mt-5 font-mono text-[11px] font-bold uppercase tracking-wider ${isSafe ? 'text-[#34D399]' : 'text-[#F87171]'}`}>{isSafe ? 'Secure decision' : 'Risky decision'}</p><p className="mt-2 max-w-sm text-xs leading-relaxed text-[#AAB5C2]">{isSafe ? scenario.safeTip : scenario.riskyTip}</p>
              <button type="button" onClick={replay} className="mt-5 inline-flex items-center gap-1.5 self-start text-[11px] font-semibold text-[#A5B8FF] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue"><RotateCcw className="h-3.5 w-3.5" />Replay scenario</button>
            </motion.div>}
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-between border-t border-white/[0.07] bg-[#0D141C] p-5 md:border-l md:border-t-0">
          <div><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Threat analysis</span><ShieldAlert className={`h-4 w-4 ${phase === 'incoming' ? 'text-muted' : 'text-[#FBBF24]'}`} /></div><div className="mt-4 h-px bg-white/[0.07]" />
            <div className="mt-6"><span className="font-mono text-[9px] uppercase tracking-widest text-muted">{phase === 'result' ? 'Coaching note' : phase === 'incoming' ? 'Scanning request' : 'Flagged indicator'}</span><p className="mt-2 text-sm font-semibold leading-snug">{phase === 'incoming' ? 'Look beyond the surface.' : phase === 'result' ? (isSafe ? 'Good instinct.' : 'Take a second look.') : scenario.clue}</p><p className="mt-3 text-xs leading-relaxed text-muted">{phase === 'incoming' ? 'Pay attention to the sender, the request, and the pressure to act.' : phase === 'result' ? (isSafe ? scenario.safeTip : scenario.riskyTip) : scenario.clueDetail}</p></div>
          </div>
          <div className="mt-7"><div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-muted"><span>Analysis step</span><span>Step 0{phase === 'incoming' ? 1 : phase === 'clue' ? 2 : phase === 'decision' ? 3 : 4} of 04</span></div><div className="mt-2 grid grid-cols-4 gap-1">{(['incoming', 'clue', 'decision', 'result'] as Phase[]).map((step, index) => <span key={step} className={`h-1 rounded-full ${index <= (phase === 'incoming' ? 0 : phase === 'clue' ? 1 : phase === 'decision' ? 2 : 3) ? 'bg-blue' : 'bg-white/10'}`} />)}</div></div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/[0.07] bg-[#0D131A] px-4 py-3 sm:px-5"><span className="hidden items-center gap-1.5 font-mono text-[10px] text-muted sm:inline-flex"><Check className="h-3 w-3 text-[#34D399]" />Try either answer</span><span className="font-mono text-[10px] text-muted sm:hidden">Try either answer</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPlaying(value => !value)} disabled={Boolean(reduceMotion)} aria-label={reduceMotion ? 'Animation disabled by reduced motion preference' : playing ? 'Pause demo animation' : 'Play demo animation'} className="landing-quiet-action inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-60">{playing && !reduceMotion ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}{reduceMotion ? 'Motion off' : playing ? 'Pause' : 'Play'}</button><button type="button" onClick={() => chooseScenario((active + 1) % scenarios.length)} aria-label="Next demo scenario" className="landing-quiet-action rounded-lg p-1.5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue"><ArrowRight className="h-3.5 w-3.5" /></button></div></div>
    </div>
  </div>;
}
