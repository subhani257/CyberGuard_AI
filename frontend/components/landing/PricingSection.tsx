"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type Tier = {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  target: string;
  badge: string | null;
  cta: string;
  ctaHref: string;
  primary: boolean;
  features: { text: string; included: boolean }[];
};

const tiers: Tier[] = [
  {
    name: 'Starter',
    monthlyPrice: 3,
    annualPrice: 2.4,
    target: 'Small teams · up to 50 users',
    badge: null,
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    primary: false,
    features: [
      { text: 'Core scenario library (50+ scenarios)', included: true },
      { text: 'Standard AI Coach feedback', included: true },
      { text: 'Monthly performance reports', included: true },
      { text: 'Email support', included: true },
      { text: 'Custom org context upload', included: false },
      { text: 'Adaptive difficulty engine', included: false },
      { text: 'Team analytics dashboard', included: false },
      { text: 'SSO / Active Directory', included: false },
    ],
  },
  {
    name: 'Professional',
    monthlyPrice: 6,
    annualPrice: 4.8,
    target: 'Growing SMEs · 50–250 users',
    badge: 'Most chosen',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    primary: true,
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'Custom Org Context (upload workflows)', included: true },
      { text: 'Adaptive difficulty engine', included: true },
      { text: 'Reasoning-aware evaluation', included: true },
      { text: 'Team analytics dashboard', included: true },
      { text: 'Priority support', included: true },
      { text: 'SSO / Active Directory', included: false },
      { text: 'Dedicated RAG knowledge bases', included: false },
    ],
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    target: 'Large organisations · 250+ users',
    badge: null,
    cta: 'Contact Sales',
    ctaHref: '/signup',
    primary: false,
    features: [
      { text: 'Everything in Professional', included: true },
      { text: 'SSO / Active Directory integration', included: true },
      { text: 'Dedicated RAG knowledge bases', included: true },
      { text: 'Custom compliance reporting', included: true },
      { text: 'Unlimited users', included: true },
      { text: 'SLA-backed uptime guarantee', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'On-premise deployment option', included: true },
    ],
  },
  {
    name: 'Academic',
    monthlyPrice: 0,
    annualPrice: 0,
    target: 'Students & universities',
    badge: null,
    cta: 'Get Free Access',
    ctaHref: '/signup',
    primary: false,
    features: [
      { text: '20 scenarios per month', included: true },
      { text: 'Standard Coach feedback', included: true },
      { text: 'Personal learning analytics', included: true },
      { text: 'Non-commercial use only', included: true },
      { text: 'Org context upload', included: false },
      { text: 'Team features', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
  },
];

function PriceDisplay({ tier, annual }: { tier: Tier; annual: boolean }) {
  if (tier.monthlyPrice === null) {
    return (
      <div>
        <span className="text-[30px] font-semibold text-primary">Custom</span>
        <p className="text-[12px] font-mono mt-1" style={{ color: 'rgba(141,152,165,0.45)' }}>Contact us for a quote</p>
      </div>
    );
  }
  if (tier.monthlyPrice === 0) {
    return (
      <div>
        <span className="text-[30px] font-semibold text-primary">Free</span>
        <p className="text-[12px] font-mono mt-1" style={{ color: 'rgba(141,152,165,0.45)' }}>No payment ever</p>
      </div>
    );
  }
  const price = annual ? tier.annualPrice! : tier.monthlyPrice;
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-[14px] font-mono" style={{ color: 'rgba(141,152,165,0.5)' }}>$</span>
        <motion.span
          key={annual ? 'a' : 'm'}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[30px] font-semibold text-primary"
        >
          {price?.toFixed(2)}
        </motion.span>
        <span className="text-[12px] font-mono" style={{ color: 'rgba(141,152,165,0.4)' }}>/user/mo</span>
      </div>
      {annual && (
        <p className="text-[11px] font-mono mt-1 line-through" style={{ color: 'rgba(141,152,165,0.3)' }}>
          ${tier.monthlyPrice}/user/mo
        </p>
      )}
    </div>
  );
}

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">

      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(141,152,165,0.4)' }}>
          Pricing
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <h2 className="text-[36px] md:text-[52px] font-semibold tracking-tight mb-4 text-center">
        Simple, transparent pricing.
      </h2>
      <p className="text-[16px] text-center max-w-md mx-auto mb-10 leading-relaxed"
        style={{ color: 'rgba(141,152,165,0.7)' }}>
        Start free. Scale as your team grows. No hidden fees, no surprises.
      </p>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className="text-[13px] font-mono transition-colors"
          style={{ color: !annual ? '#E8EDF2' : 'rgba(141,152,165,0.5)' }}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual((a) => !a)}
          className="relative w-11 h-6 rounded-full transition-colors duration-300"
          style={{ background: annual ? 'rgba(79,124,255,0.6)' : 'rgba(255,255,255,0.1)' }}
          aria-label="Toggle billing period"
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
            style={{ left: annual ? '1.5rem' : '0.25rem' }}
          />
        </button>
        <span className="text-[13px] font-mono transition-colors"
          style={{ color: annual ? '#E8EDF2' : 'rgba(141,152,165,0.5)' }}>
          Annual
        </span>
        {annual && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg"
            style={{
              background: 'rgba(79,124,255,0.08)',
              border: '1px solid rgba(79,124,255,0.18)',
              color: 'rgba(165,184,255,0.7)',
            }}
          >
            Save 20%
          </motion.span>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            className="rounded-2xl p-6 flex flex-col relative"
            style={{
              background: tier.primary ? 'rgba(79,124,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: tier.primary ? '1px solid rgba(79,124,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
              boxShadow: tier.primary ? '0 0 60px rgba(79,124,255,0.07)' : 'none',
            }}
          >
            {/* Badge */}
            {tier.badge && (
              <div className="mb-4">
                <span className="text-[10px] font-mono tracking-[0.15em] uppercase px-2.5 py-1 rounded-md"
                  style={{
                    background: 'rgba(79,124,255,0.1)',
                    border: '1px solid rgba(79,124,255,0.2)',
                    color: 'rgba(165,184,255,0.7)',
                  }}>
                  {tier.badge}
                </span>
              </div>
            )}

            <h3 className="text-[16px] font-semibold text-primary mb-1">{tier.name}</h3>
            <p className="text-[11px] font-mono mb-6" style={{ color: 'rgba(141,152,165,0.45)' }}>{tier.target}</p>

            <div className="mb-6">
              <PriceDisplay tier={tier} annual={annual} />
            </div>

            {/* CTA */}
            <Link
              href={tier.ctaHref}
              className="block text-center py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 mb-7"
              style={tier.primary
                ? { background: '#4F7CFF', color: '#fff', boxShadow: '0 0 24px rgba(79,124,255,0.18)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(232,237,242,0.7)' }
              }
            >
              {tier.cta}
            </Link>

            {/* Divider */}
            <div className="h-px mb-6" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* Features list */}
            <ul className="space-y-2.5 mt-auto">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-start gap-2.5 text-[12px]"
                  style={{ color: f.included ? 'rgba(141,152,165,0.65)' : 'rgba(141,152,165,0.22)' }}>
                  <span className="flex-shrink-0 mt-0.5 text-[10px]"
                    style={{ color: f.included ? 'rgba(79,124,255,0.5)' : 'rgba(255,255,255,0.12)' }}>
                    {f.included ? '—' : '·'}
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-[11px] font-mono mt-8"
        style={{ color: 'rgba(141,152,165,0.3)', letterSpacing: '0.05em' }}>
        All plans include a 14-day free trial · No credit card required · Cancel anytime
      </p>
    </section>
  );
}
