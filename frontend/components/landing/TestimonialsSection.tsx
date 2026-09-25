"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    quote:
      "We replaced our legacy compliance platform last quarter. Our team's phishing response score improved 40% in six weeks. The scenarios are indistinguishable from real emails — our CFO flagged one as suspicious before it had finished loading. That level of realism has never existed before.",
    name: 'Alex Rodrigues',
    role: 'IT Manager',
    org: 'FinSecure Banking Group',
    initials: 'AR',
  },
  {
    quote:
      'The reasoning evaluation is what closed the deal for me. I can now see not just who clicked the link — but why they clicked it. That is where genuine behavioural change begins. Our security awareness scores are the highest in five years and our auditors commented on it unprompted.',
    name: 'Dr. Sarah Krishnamurthy',
    role: 'Chief Information Security Officer',
    org: 'MediCore Regional Health',
    initials: 'SK',
  },
  {
    quote:
      "This is what university coursework should feel like. I failed my first scenario and actually understood why — the coach walked me through the exact NIST guideline I had overlooked. Not a pop-up. Not a warning. A proper explanation. I passed my security certification two weeks later.",
    name: 'Priya Mendis',
    role: 'Cybersecurity Student',
    org: 'University of Moratuwa',
    initials: 'PM',
  },
  {
    quote:
      "As an MSP I need something I can deploy across 30 client companies without additional setup overhead per client. The organisation context feature means each company's training is genuinely custom — generated from their own workflows. This has become a core part of our service offering.",
    name: 'Marcus Webb',
    role: 'Managing Director',
    org: 'ClearPath Managed IT',
    initials: 'MW',
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  const t = testimonials[active];

  return (
    <section id="reviews" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">

      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(141,152,165,0.4)' }}>
          What security teams say
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <h2 className="text-[36px] md:text-[52px] font-semibold tracking-tight mb-16 text-center">
        Real results. Real teams.
      </h2>

      <div className="max-w-3xl mx-auto">

        {/* Main card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-10 md:p-12 mb-6"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Open quote mark — large, decorative */}
            <div className="text-[64px] leading-none font-serif mb-2 -mt-2 -ml-1"
              style={{ color: 'rgba(79,124,255,0.2)', lineHeight: 1 }}>"</div>

            <blockquote
              className="text-[17px] md:text-[20px] font-medium leading-relaxed mb-10"
              style={{ color: 'rgba(232,237,242,0.82)' }}
            >
              {t.quote}
            </blockquote>

            {/* Author row */}
            <div className="flex items-center gap-4">
              {/* Initials avatar — no color, pure glass */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-mono flex-shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(232,237,242,0.6)',
                }}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-primary">{t.name}</p>
                <p className="text-[12px] font-mono" style={{ color: 'rgba(141,152,165,0.5)' }}>
                  {t.role} · {t.org}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation row */}
        <div className="flex items-center justify-between">

          {/* Persona pills */}
          <div className="flex gap-2 flex-wrap">
            {testimonials.map((item, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-mono transition-all duration-200"
                style={{
                  background: i === active ? 'rgba(79,124,255,0.08)' : 'rgba(255,255,255,0.02)',
                  border: i === active ? '1px solid rgba(79,124,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  color: i === active ? 'rgba(165,184,255,0.8)' : 'rgba(141,152,165,0.4)',
                }}
              >
                <span className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{
                    background: i === active ? 'rgba(79,124,255,0.15)' : 'rgba(255,255,255,0.04)',
                    color: i === active ? 'rgba(165,184,255,0.9)' : 'rgba(141,152,165,0.45)',
                  }}>
                  {item.initials}
                </span>
                <span className="hidden sm:inline">{item.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Arrows */}
          <div className="flex gap-2">
            {[
              { label: '←', fn: () => setActive((p) => (p === 0 ? testimonials.length - 1 : p - 1)) },
              { label: '→', fn: () => setActive((p) => (p === testimonials.length - 1 ? 0 : p + 1)) },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.fn}
                className="w-9 h-9 rounded-xl text-[14px] transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(141,152,165,0.5)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#E8EDF2';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(141,152,165,0.5)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
