"use client";
import React from 'react';
import { motion } from 'framer-motion';

const orgs = [
  'FinSecure Banking Group',
  'MediCore Health Systems',
  'LegalShield Partners',
  'NovaTech Solutions',
  'Apex Risk Consulting',
  'ClearPath Managed IT',
  'Univ. of Technology',
  'DataVault Corporation',
  'Meridian Capital',
  'Solaris Law Group',
];

const doubled = [...orgs, ...orgs];

export default function LogosStrip() {
  return (
    <section className="py-14 overflow-hidden relative">

      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-28 pointer-events-none z-10"
        style={{ background: 'linear-gradient(90deg, #0B0F14, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-28 pointer-events-none z-10"
        style={{ background: 'linear-gradient(-90deg, #0B0F14, transparent)' }} />

      <p className="text-center text-[10px] font-mono tracking-[0.25em] uppercase mb-8"
        style={{ color: 'rgba(141,152,165,0.35)' }}>
        Trusted by security teams across industries
      </p>

      <div className="flex">
        <motion.div
          className="flex gap-0 items-center"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 32, ease: 'linear', repeat: Infinity }}
        >
          {doubled.map((name, i) => (
            <React.Fragment key={i}>
              <span
                className="text-[12px] font-mono whitespace-nowrap flex-shrink-0 transition-colors duration-300"
                style={{ color: 'rgba(141,152,165,0.45)', letterSpacing: '0.04em' }}
              >
                {name}
              </span>
              <span className="mx-8 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
