"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type ScenarioState = 'INTRO' | 'OBSERVE' | 'DECIDE' | 'REASONING';

export default function CinematicScenario() {
  const router = useRouter();
  const [currentState, setCurrentState] = useState<ScenarioState>('INTRO');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Smooth fade transitions
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.2, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.8, ease: "easeIn" } }
  };

  const textVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } }
  };

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
    // Add a tiny delay before moving to reasoning so the selection feels intentional
    setTimeout(() => setCurrentState('REASONING'), 600);
  };

  const submitReasoning = () => {
    if (!reasoning.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      // Pass the choice via query param to the evaluation page (mocking state transfer)
      router.push(`/evaluation?choice=${encodeURIComponent(selectedChoice || '')}`);
    }, 800);
  };

  return (
    <AnimatePresence mode="wait">
      
      {/* 1. INTRO STATE - Cinematic Pause */}
      {currentState === 'INTRO' && (
        <motion.main 
          key="intro"
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="min-h-screen bg-background text-primary flex flex-col items-center justify-center font-sans selection:bg-blue/20 relative"
        >
          <div className="absolute top-8 w-full px-12 flex justify-between items-center opacity-40">
            <span className="font-medium text-sm tracking-widest uppercase text-cyan">◉ CyberGuard AI</span>
            <Link href="/dashboard" className="text-xl font-light hover:opacity-100 transition-opacity">×</Link>
          </div>

          <div className="text-center max-w-2xl px-6">
            <motion.p variants={textVariants} initial="initial" animate="animate" className="text-xs font-semibold tracking-widest uppercase text-muted mb-12">
              SITUATION 04
            </motion.p>
            
            <motion.h1 
              variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.4, duration: 1.2 }}
              className="text-4xl md:text-5xl lg:text-[64px] font-semibold tracking-tighter leading-[1.05] mb-12"
            >
              Not everything urgent <br/> deserves an immediate response.
            </motion.h1>

            <motion.p 
              variants={textVariants} initial="initial" animate="animate" transition={{ delay: 1.5, duration: 1 }}
              className="text-lg text-muted font-medium tracking-tight mb-20"
            >
              Take a moment. Look carefully.
            </motion.p>

            <motion.div 
              variants={textVariants} initial="initial" animate="animate" transition={{ delay: 2.5, duration: 1 }}
            >
              <button 
                onClick={() => setCurrentState('OBSERVE')}
                className="text-lg font-medium text-muted hover:text-blue transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                I'm ready <span className="font-light">→</span>
              </button>
            </motion.div>
          </div>
        </motion.main>
      )}


      {/* 2. OBSERVE STATE - The Email */}
      {currentState === 'OBSERVE' && (
        <motion.main 
          key="observe"
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="min-h-screen bg-scenario-amber text-primary flex flex-col font-sans selection:bg-amber/20 relative"
        >
          <div className="absolute top-8 w-full px-12 flex justify-between items-center opacity-60 z-10">
            <span className="font-medium text-sm tracking-widest uppercase text-cyan">◉ CyberGuard AI</span>
            <span className="text-sm font-medium tracking-widest text-muted">04 / 06</span>
            <Link href="/dashboard" className="text-xl font-light hover:text-white transition-opacity">×</Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-6 pt-24 pb-32">
            <motion.p variants={textVariants} initial="initial" animate="animate" className="text-xs font-semibold tracking-widest uppercase text-muted mb-6">
              INCOMING MESSAGE
            </motion.p>
            <motion.h2 variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.2 }} className="text-3xl font-semibold tracking-tight mb-16 text-primary">
              An email just arrived.
            </motion.h2>

            <motion.div 
              variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.8, duration: 1.2 }}
              className="w-full bg-surface rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-primary/5 overflow-hidden text-left"
            >
              {/* Email Header */}
              <div className="border-b border-primary/5 px-8 py-6 bg-surface/50 space-y-4">
                <div className="flex gap-4">
                  <span className="text-sm text-muted w-16 shrink-0">From</span>
                  <div>
                    <p className="text-base font-semibold text-primary">David Perera</p>
                    <p className="text-sm text-muted">Finance Director &lt;d.perera@novatech-corp.net&gt;</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-muted w-16 shrink-0">Subject</span>
                  <p className="text-base font-medium text-primary">Payment required today</p>
                </div>
              </div>
              
              {/* Email Body */}
              <div className="px-8 py-10 text-base leading-relaxed text-primary/80 font-medium bg-background/50">
                <p className="mb-6">Hi Nimal,</p>
                <p className="mb-6">I need you to process the attached payment before 3:00 PM today.</p>
                <p>I'm currently in a meeting and can't take calls.</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3, duration: 1 }}
            className="fixed bottom-0 w-full bg-gradient-to-t from-scenario-amber via-scenario-amber to-transparent pt-20 pb-12 px-6 flex flex-col items-center"
          >
            <p className="text-xl font-semibold tracking-tight mb-6 text-primary">Take a closer look.</p>
            <button 
              onClick={() => setCurrentState('DECIDE')}
              className="bg-blue hover:bg-blue/90 text-white font-medium text-base px-8 py-3.5 rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-[0_0_20px_rgba(79,124,255,0.2)]"
            >
              Continue <span className="opacity-70 font-light">→</span>
            </button>
          </motion.div>
        </motion.main>
      )}


      {/* 3. DECIDE STATE - What would you do? */}
      {currentState === 'DECIDE' && (
        <motion.main 
          key="decide"
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="min-h-screen bg-scenario-amber text-primary flex flex-col items-center justify-center font-sans selection:bg-amber/20 relative"
        >
          <div className="absolute top-8 w-full px-12 flex justify-between items-center opacity-60">
            <span className="font-medium text-sm tracking-widest uppercase text-cyan">◉ CyberGuard AI</span>
            <span className="text-sm font-medium tracking-widest text-muted">04 / 06</span>
            <Link href="/dashboard" className="text-xl font-light hover:text-white transition-opacity">×</Link>
          </div>

          <div className="w-full max-w-xl px-6">
            <motion.h2 
              variants={textVariants} initial="initial" animate="animate"
              className="text-4xl font-semibold tracking-tight mb-16 text-center text-primary"
            >
              What would you do next?
            </motion.h2>

            <motion.div 
              variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {[
                "Approve the request",
                "Ask the sender to confirm",
                "Verify through another channel",
                "Report the message"
              ].map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(choice)}
                  className={`w-full group flex items-center gap-6 p-4 rounded-xl transition-all duration-300
                    ${selectedChoice === choice ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                >
                  <span className={`text-2xl font-light transition-colors duration-300 ${selectedChoice === choice ? 'text-amber' : 'text-primary/30 group-hover:text-amber'}`}>
                    {selectedChoice === choice ? '●' : '○'}
                  </span>
                  <span className={`text-xl font-medium tracking-tight transition-colors ${selectedChoice === choice ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>
                    {choice}
                  </span>
                </button>
              ))}
            </motion.div>
          </div>
        </motion.main>
      )}


      {/* 4. REASONING STATE - Why? */}
      {currentState === 'REASONING' && (
        <motion.main 
          key="reasoning"
          variants={pageVariants} initial="initial" animate="animate" exit="exit"
          className="min-h-screen bg-scenario-amber text-primary flex flex-col items-center justify-center font-sans selection:bg-amber/20 relative"
        >
          <div className="w-full max-w-2xl px-6 text-center">
            
            <motion.p variants={textVariants} initial="initial" animate="animate" className="text-xs font-semibold tracking-widest uppercase text-muted mb-8">
              YOUR DECISION
            </motion.p>
            
            <motion.h3 variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.2 }} className="text-2xl font-semibold tracking-tight mb-20 text-amber">
              {selectedChoice}
            </motion.h3>

            <motion.h2 variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.6 }} className="text-4xl font-semibold tracking-tight mb-16 text-primary">
              Why?
            </motion.h2>

            <motion.p variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.8 }} className="text-lg text-muted font-medium mb-8">
              Tell us what made you choose this.
            </motion.p>

            <motion.div variants={textVariants} initial="initial" animate="animate" transition={{ delay: 1 }} className="relative w-full mb-12">
              <div className="absolute top-0 w-full h-px bg-primary/10"></div>
              <textarea 
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="I noticed that..."
                className="w-full bg-transparent border-none outline-none resize-none py-8 text-xl font-medium text-primary placeholder:text-primary/20 text-center focus:ring-0"
                rows={4}
                autoFocus
              />
              <div className="absolute bottom-0 w-full h-px bg-primary/10"></div>
            </motion.div>

            <motion.div variants={textVariants} initial="initial" animate="animate" transition={{ delay: 1.2 }}>
              <button 
                onClick={submitReasoning}
                disabled={!reasoning.trim() || isSubmitting}
                className="text-lg font-medium text-muted hover:text-blue transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {isSubmitting ? 'Analyzing...' : <>Continue <span className="font-light">→</span></>}
              </button>
            </motion.div>
          </div>
        </motion.main>
      )}

    </AnimatePresence>
  );
}
