"use client";
import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    index: '01',
    title: 'Set your context',
    description:
      'Upload your organisation\'s workflows, communication templates, and role definitions. The Scenario Agent builds a model of your company\'s environment — its language, its processes, its communication patterns.',
    detail: 'Supports policy docs, org charts, workflow PDFs',
  },
  {
    index: '02',
    title: 'Face the scenario',
    description:
      'A realistic threat is presented — an email, a chat request, an urgent call to action. It sounds like your actual CEO. It references your actual weekly meeting. There are no generic templates here.',
    detail: 'Email · Instant messaging · Voice · Document vectors',
  },
  {
    index: '03',
    title: 'Get coached by AI',
    description:
      'Explain your reasoning in plain language. The Evaluation Agent analyses not just what you chose, but the cognitive process behind it. The Coach Agent returns evidence-grounded feedback from NIST, NCSC, and FBI advisories.',
    detail: 'Aligned with NIST SP 800-50 · NCSC · FBI BEC guidance',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">

      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(141,152,165,0.4)' }}>
          The process
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <h2 className="text-[36px] md:text-[52px] font-semibold tracking-tight mb-4 text-center">
        How it works.
      </h2>
      <p className="text-[16px] text-center max-w-lg mx-auto mb-16 leading-relaxed"
        style={{ color: 'rgba(141,152,165,0.7)' }}>
        Three steps from first login to measurable security improvement.
      </p>

      {/* Steps */}
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-8 relative group"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Large background index number */}
            <span
              className="absolute top-4 right-6 text-[80px] font-semibold leading-none select-none pointer-events-none"
              style={{
                color: 'rgba(255,255,255,0.03)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {step.index}
            </span>

            {/* Step number — visible */}
            <p className="text-[11px] font-mono tracking-[0.2em] uppercase mb-5"
              style={{ color: 'rgba(79,124,255,0.5)' }}>
              Step {step.index}
            </p>

            <h3 className="text-[20px] font-semibold tracking-tight mb-4 text-primary">
              {step.title}
            </h3>

            <p className="text-[13px] leading-relaxed mb-7"
              style={{ color: 'rgba(141,152,165,0.65)' }}>
              {step.description}
            </p>

            {/* Detail tag */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-px" style={{ background: 'rgba(79,124,255,0.35)' }} />
              <span className="text-[11px] font-mono" style={{ color: 'rgba(141,152,165,0.4)' }}>
                {step.detail}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Connector hint below cards */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="hidden md:flex items-center justify-center gap-3 mt-8"
      >
        <span className="text-[11px] font-mono" style={{ color: 'rgba(141,152,165,0.25)' }}>Context</span>
        <div className="flex-1 max-w-[100px] h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[11px] font-mono" style={{ color: 'rgba(141,152,165,0.25)' }}>Scenario</span>
        <div className="flex-1 max-w-[100px] h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[11px] font-mono" style={{ color: 'rgba(141,152,165,0.25)' }}>Coaching</span>
      </motion.div>
    </section>
  );
}
