"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function EvaluationPage() {
  const [step, setStep] = useState(0);

  // Auto-progress the first step
  useEffect(() => {
    const timer = setTimeout(() => setStep(1), 2000);
    return () => clearTimeout(timer);
  }, []);

  const textVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <main className="min-h-screen bg-background text-primary flex flex-col font-sans selection:bg-blue/20 relative overflow-x-hidden">
      
      {/* Top Bar */}
      <div className="absolute top-8 w-full px-12 flex justify-between items-center opacity-60 z-50">
        <span className="font-medium text-sm tracking-widest uppercase text-cyan">◉ CyberGuard AI</span>
        <span className="text-sm font-medium tracking-widest text-muted">DECISION REVIEW</span>
        <Link href="/dashboard" className="text-xl font-light hover:text-white transition-opacity">×</Link>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full px-6 pt-32 pb-32">
        
        {/* Step 0: Analyzing */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center mt-32"
            >
              <div className="w-8 h-8 rounded-full border border-cyan/30 border-t-cyan animate-spin mb-8"></div>
              <p className="text-sm font-bold tracking-widest uppercase text-muted">Analyzing your reasoning</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1+: The Review Build-up */}
        {step >= 1 && (
          <motion.div 
            initial="initial" animate="animate" variants={textVariants}
            className="w-full flex flex-col space-y-24 mt-12"
          >
            
            {/* Section 1: What they noticed */}
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight mb-12 text-primary">
                Let's look at what you noticed.
              </h2>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold tracking-widest uppercase text-muted mb-4">Authority</span>
                  <div className="w-12 h-12 rounded-full border border-blue bg-blue/10 flex items-center justify-center text-blue shadow-[0_0_15px_rgba(79,124,255,0.2)]">●</div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold tracking-widest uppercase text-muted mb-4">Urgency</span>
                  <div className="w-12 h-12 rounded-full border border-amber bg-amber/10 flex items-center justify-center text-amber shadow-[0_0_15px_rgba(214,167,86,0.2)]">●</div>
                </div>

                <div className="flex flex-col items-center opacity-40">
                  <span className="text-xs font-bold tracking-widest uppercase text-muted mb-4">Verification</span>
                  <div className="w-12 h-12 rounded-full border border-muted/50 bg-surface flex items-center justify-center text-muted">○</div>
                </div>

              </div>

              {step === 1 && (
                <motion.button 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  onClick={() => setStep(2)}
                  className="mt-16 text-sm font-semibold tracking-widest uppercase text-cyan hover:text-white transition-colors"
                >
                  Continue ↓
                </motion.button>
              )}
            </div>

            {/* Section 2: The Good */}
            {step >= 2 && (
              <motion.div initial="initial" animate="animate" variants={textVariants} className="text-center relative">
                <div className="absolute top-[-48px] left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/0 via-teal/50 to-teal/0"></div>
                <p className="text-sm font-bold tracking-widest uppercase text-teal mb-6">Good judgment</p>
                <h3 className="text-3xl font-semibold tracking-tight text-primary mb-4">
                  You made one important thing right.
                </h3>
                <p className="text-xl text-muted font-medium">
                  You didn't rely on the request alone.
                </p>
                
                {step === 2 && (
                  <motion.button 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    onClick={() => setStep(3)}
                    className="mt-16 text-sm font-semibold tracking-widest uppercase text-cyan hover:text-white transition-colors"
                  >
                    Continue ↓
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Section 3: The Miss */}
            {step >= 3 && (
              <motion.div initial="initial" animate="animate" variants={textVariants} className="text-center relative">
                <div className="absolute top-[-48px] left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/0 via-amber/50 to-amber/0"></div>
                <p className="text-sm font-bold tracking-widest uppercase text-amber mb-6">Missed Signal</p>
                <h3 className="text-3xl font-semibold tracking-tight text-primary mb-4">
                  But there was another clue.
                </h3>
                <p className="text-xl text-muted font-medium max-w-lg mx-auto leading-relaxed">
                  The sender was explicitly asking you to bypass the normal verification process.
                </p>

                {step === 3 && (
                  <motion.button 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    onClick={() => setStep(4)}
                    className="mt-16 text-sm font-semibold tracking-widest uppercase text-cyan hover:text-white transition-colors"
                  >
                    Continue ↓
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Section 4: The Pattern */}
            {step >= 4 && (
              <motion.div initial="initial" animate="animate" variants={textVariants} className="text-center relative pt-12">
                
                <h1 className="text-5xl font-semibold tracking-tighter text-primary mb-16">
                  That's the pattern.
                </h1>

                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center gap-3 bg-blue hover:bg-blue/90 text-white font-medium text-base px-10 py-4 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(79,124,255,0.2)]"
                >
                  Return to Dashboard <span className="font-light opacity-70">→</span>
                </Link>
              </motion.div>
            )}

          </motion.div>
        )}

      </div>
    </main>
  );
}
