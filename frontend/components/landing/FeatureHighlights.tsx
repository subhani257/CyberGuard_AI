"use client";
import React from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    index: 'I',
    tag: 'Contextual Realism',
    title: 'Your scenarios.\nYour company language.',
    description:
      'Competitors send generic phishing simulations about delayed packages. Midnight Intelligence uses Organisational RAG — upload your workflows and our Scenario Agent generates threats that sound precisely like your actual CEO, referencing your actual processes. It becomes genuinely indistinguishable.',
    callout: 'Indistinguishable from the real thing.',
  },
  {
    index: 'II',
    tag: 'Reasoning-Aware Evaluation',
    title: 'We score the why,\nnot just the what.',
    description:
      'Every other platform asks: did you click the link? We ask: why did you click it? Users provide a brief text explanation. Our Evaluation Agent uses NLP to analyse the cognitive process behind the decision — because guessing the right answer doesn\'t mean the right instinct exists.',
    callout: 'No more memorising answers to pass.',
  },
  {
    index: 'III',
    tag: 'Evidence-Based Coaching',
    title: 'Feedback grounded\nin real frameworks.',
    description:
      'When you make a mistake, you don\'t receive a generic warning. Our Coach Agent cites NIST SP 800-50, NCSC guidance, and FBI BEC advisories — returning feedback that is credible, specific, and traceable to the exact framework principle you violated.',
    callout: 'Coaching backed by global security standards.',
  },
];

export default function FeatureHighlights() {
  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">

      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(141,152,165,0.4)' }}>
          What makes us different
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <h2 className="text-[36px] md:text-[52px] font-semibold tracking-tight mb-4 text-center">
        Three things no competitor does.
      </h2>
      <p className="text-[16px] text-center max-w-lg mx-auto mb-16 leading-relaxed"
        style={{ color: 'rgba(141,152,165,0.7)' }}>
        Built on a multi-agent AI architecture that trains the human moment, not just tests it.
      </p>

      <div className="space-y-4">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-8 md:p-10 grid md:grid-cols-[280px_1fr] gap-10 items-start"
            style={{
              background: 'rgba(255,255,255,0.022)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Left column */}
            <div>
              {/* Roman numeral — Y2K decorative element */}
              <span className="block text-[48px] font-light tracking-tighter mb-4 leading-none"
                style={{ color: 'rgba(255,255,255,0.07)', fontVariantNumeric: 'tabular-nums' }}>
                {f.index}
              </span>
              <p className="text-[10px] font-mono tracking-[0.22em] uppercase mb-3"
                style={{ color: 'rgba(79,124,255,0.55)' }}>
                {f.tag}
              </p>
              <h3 className="text-[22px] font-semibold tracking-tight leading-tight whitespace-pre-line text-primary">
                {f.title}
              </h3>
            </div>

            {/* Right column */}
            <div className="flex flex-col justify-between h-full gap-6">
              <p className="text-[14px] leading-relaxed"
                style={{ color: 'rgba(141,152,165,0.7)' }}>
                {f.description}
              </p>

              {/* Callout line */}
              <div className="flex items-center gap-4">
                <div className="h-px w-10" style={{ background: 'rgba(79,124,255,0.3)' }} />
                <span className="text-[12px] font-mono" style={{ color: 'rgba(165,184,255,0.6)' }}>
                  {f.callout}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
