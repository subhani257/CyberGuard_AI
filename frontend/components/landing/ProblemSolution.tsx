"use client";
import React from 'react';
import { motion, Variants } from 'framer-motion';

const rows = [
  {
    side: 'before',
    label: 'The old approach',
    items: [
      'Annual click-through compliance videos',
      'Generic phishing templates — obvious, easy to spot',
      'Binary scoring: Did you click? Yes or No.',
      'No context about your actual role or company',
      'Employees memorise the answers. Behaviour never changes.',
    ],
  },
  {
    side: 'after',
    label: 'Midnight Intelligence',
    items: [
      'AI scenarios built from your real organisational workflows',
      'Threats that sound exactly like your actual colleagues',
      'Reasoning-aware evaluation — we analyse the why',
      'Organisation context via RAG — your sector, your job',
      'Adaptive difficulty that targets your actual cognitive gaps',
    ],
  },
];

const stats = [
  { value: '95%', label: 'of breaches trace back to a human decision' },
  { value: '40%', label: 'average improvement in phishing response scores' },
  { value: '6 wk', label: 'to measurable behavioural change' },
];

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function ProblemSolution() {
  return (
    <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">

      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(141,152,165,0.4)' }}>
          Why Midnight Intelligence
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <h2 className="text-[36px] md:text-[52px] font-semibold tracking-tight mb-4 text-center">
        Training that actually changes behaviour.
      </h2>
      <p className="text-[16px] text-center max-w-lg mx-auto mb-16 leading-relaxed"
        style={{ color: 'rgba(141,152,165,0.7)' }}>
        The legacy approach is compliance theatre. We built something that changes what happens in the real moment.
      </p>

      {/* Comparison grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((row) => {
          const isBefore = row.side === 'before';
          return (
            <motion.div
              key={row.side}
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="rounded-2xl p-8"
              style={{
                background: isBefore ? 'rgba(255,255,255,0.018)' : 'rgba(79,124,255,0.04)',
                border: isBefore ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(79,124,255,0.15)',
              }}
            >
              <div className="flex items-center gap-3 mb-7">
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono"
                  style={{
                    background: isBefore ? 'rgba(255,255,255,0.05)' : 'rgba(79,124,255,0.12)',
                    color: isBefore ? 'rgba(141,152,165,0.5)' : 'rgba(165,184,255,0.7)',
                  }}>
                  {isBefore ? '×' : '✓'}
                </span>
                <div>
                  <p className="text-[10px] font-mono tracking-[0.2em] uppercase"
                    style={{ color: isBefore ? 'rgba(141,152,165,0.4)' : 'rgba(79,124,255,0.6)' }}>
                    {row.label}
                  </p>
                </div>
              </div>

              <ul className="space-y-3.5">
                {row.items.map((item, i) => (
                  <motion.li key={i} variants={itemVariants}
                    className="flex items-start gap-3 text-[13px] leading-relaxed"
                    style={{ color: isBefore ? 'rgba(141,152,165,0.55)' : 'rgba(232,237,242,0.75)' }}
                  >
                    <span className="mt-0.5 flex-shrink-0 text-[10px]"
                      style={{ color: isBefore ? 'rgba(141,152,165,0.25)' : 'rgba(79,124,255,0.45)' }}>
                      {isBefore ? '—' : '→'}
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Stat row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 grid sm:grid-cols-3 gap-4"
      >
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[36px] font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #c8d0dc, #e8edf2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              {s.value}
            </p>
            <p className="text-[12px] mt-2 max-w-[160px] mx-auto leading-snug"
              style={{ color: 'rgba(141,152,165,0.55)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
