import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

type AuthShellProps = {
  mode: 'signin' | 'signup';
  children: React.ReactNode;
};

const content = {
  signin: {
    index: '01',
    eyebrow: 'RETURN TO TRAINING',
    title: 'Good to have you back.',
    description: 'Pick up where you left off. Your next scenario is waiting in the decision lab.',
    switchLabel: 'Create account',
    switchHref: '/signup',
    panelTitle: 'Sign in',
    panelDescription: 'Enter your account details to continue.',
    steps: ['Read the situation', 'Make the call', 'See what mattered'],
  },
  signup: {
    index: '02',
    eyebrow: 'START YOUR TRAINING',
    title: 'Build better instincts.',
    description: 'Create your space, add your organization context, and start practicing decisions that matter.',
    switchLabel: 'Sign in',
    switchHref: '/login',
    panelTitle: 'Create account',
    panelDescription: 'A few details to set up your training space.',
    steps: ['Create your account', 'Add organization context', 'Start your first scenario'],
  },
} as const;

export default function AuthShell({ mode, children }: AuthShellProps) {
  const copy = content[mode];

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-background font-sans text-primary selection:bg-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_22%_30%,rgba(79,124,255,0.055),transparent_50%)]" aria-hidden="true" />
      <header className="relative z-10 border-b border-white/[0.05] bg-[#0B0F14]/85 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10" aria-label="Account navigation">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5 focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue" aria-label="Midnight Intelligence home">
            <span className="text-lg leading-none text-blue/70 transition-opacity group-hover:opacity-100" aria-hidden="true">◉</span>
            <span className="truncate text-[13px] font-semibold tracking-tight sm:text-sm">Midnight Intelligence</span>
          </Link>
          <Link href={copy.switchHref} className="midnight-quiet-action inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue sm:text-[11px]">
            {copy.switchLabel}<ArrowRight className="h-3 w-3" />
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto grid min-h-[calc(100svh-65px)] max-w-[1280px] items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-10 lg:py-14">
        <section className="max-w-[540px] lg:self-center" aria-labelledby="auth-intro-title">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{copy.eyebrow}</p>
          <h1 id="auth-intro-title" className="max-w-[520px] text-[clamp(2.55rem,4.6vw,4.8rem)] font-semibold leading-[1.03] tracking-[-0.055em]">{copy.title}</h1>

          <p className="mt-5 max-w-[440px] text-sm leading-[1.8] text-[#AAB5C2] sm:text-[15px]">{copy.description}</p>

          <div className="mt-12 hidden max-w-[470px] border-t border-white/[0.08] pt-6 lg:block">
            <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted"><ShieldCheck className="h-3.5 w-3.5 text-[#A5B8FF]" /> The training path</div>
            <div className="grid grid-cols-3 gap-3">
              {copy.steps.map((step, index) => (
                <div key={step} className="border-l border-white/[0.09] pl-3">
                  <span className="font-mono text-[10px] text-[#A5B8FF]">0{index + 1}</span>
                  <p className="mt-2 text-[11px] leading-snug text-[#B9C4CF]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full max-w-[480px] justify-self-center lg:justify-self-end" aria-labelledby="auth-form-title">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111821] shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#0D131A] px-6 py-4 sm:px-8">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Account access</span>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted"><Check className="h-3 w-3 text-[#A5B8FF]" /> Midnight Intelligence</span>
            </div>
            <div className="px-6 py-7 sm:px-8 sm:py-8">
              <div className="mb-7">
                <h2 id="auth-form-title" className="text-2xl font-semibold tracking-tight">{copy.panelTitle}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{copy.panelDescription}</p>
              </div>
              {children}
            </div>
          </div>
          <p className="mt-5 text-center font-mono text-[10px] text-muted/70">Practice with clarity. Decide with confidence.</p>
        </section>
      </div>
    </main>
  );
}

export function GoogleMark() {
  return <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>;
}
