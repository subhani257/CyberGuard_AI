"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const frameworks = [
  { label: 'NIST SP 800-50', sub: 'Security Awareness Framework' },
  { label: 'NCSC Guidance', sub: 'UK National Cyber Security Centre' },
  { label: 'ISO 27001', sub: 'Information Security Aligned' },
  { label: 'GDPR Ready', sub: 'Data Privacy Compliant' },
  { label: 'FBI BEC Advisory', sub: 'Business Email Compromise' },
  { label: 'SOC 2 Type II', sub: 'Trust Services Criteria' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 60;
          const duration = 1600;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (step >= steps) {
              setCount(target);
              clearInterval(timer);
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const stats = [
  { value: 500, suffix: '+', label: 'Organisations Protected' },
  { value: 50000, suffix: '+', label: 'Scenarios Completed' },
  { value: 92, suffix: '%', label: 'Avg. Improvement Score' },
  { value: 14, suffix: '-day', label: 'Free Trial · No Card' },
];

export default function TrustBadges() {
  return (
    <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto">

      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: 'rgba(141,152,165,0.4)' }}>
          Built on trusted standards
        </span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      <h2 className="text-[36px] md:text-[48px] font-semibold tracking-tight mb-4 text-center">
        Security you can audit.<br />Frameworks you can cite.
      </h2>
      <p className="text-[16px] text-center max-w-lg mx-auto mb-16 leading-relaxed"
        style={{ color: 'rgba(141,152,165,0.7)' }}>
        Every piece of coaching Midnight Intelligence delivers is grounded in globally recognised cybersecurity frameworks.
      </p>

      {/* Animated stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="rounded-xl p-7 text-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.065)',
            }}
          >
            <p className="text-[38px] font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #c8d0dc 0%, #e8edf2 50%, #b0bcc8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </p>
            <p className="text-[12px] font-mono mt-2" style={{ color: 'rgba(141,152,165,0.45)' }}>
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Framework badges */}
      <div className="flex flex-wrap justify-center gap-3">
        {frameworks.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="px-5 py-3 rounded-xl flex flex-col items-center"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span className="text-[12px] font-semibold text-primary tracking-wide">{f.label}</span>
            <span className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(141,152,165,0.4)' }}>{f.sub}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
