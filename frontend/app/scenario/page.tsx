"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';

type ScenarioState = 'INTRO' | 'OBSERVE' | 'DECIDE' | 'REASONING';

interface ScenarioContent {
  situation_title?: string;
  situation_tagline?: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  body?: string;
  choices?: string[];
  threat_type?: string;
  difficulty?: string;
}

function ScenarioFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentState, setCurrentState] = useState<ScenarioState>('INTRO');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scenarioId, setScenarioId] = useState<string>('SC004');
  const [scenario, setScenario] = useState<ScenarioContent>({
    situation_title: "A payment request that cannot wait.",
    situation_tagline: "Not everything urgent deserves an immediate response.",
    sender_name: "David Perera",
    sender_email: "d.perera@novatech-corp.net",
    subject: "Payment required today",
    body: "Hi Nimal,\n\nI need you to process the attached payment before 3:00 PM today.\n\nI'm currently in a meeting and can't take calls.\n\nRegards,\nDavid Perera",
    choices: [
      "Approve the request",
      "Ask the sender to confirm",
      "Verify through another channel",
      "Report the message"
    ],
    threat_type: "Business Email Compromise (BEC)",
    difficulty: "medium"
  });

  // Fetch live scenario from Member 1's Scenario Agent endpoint
  useEffect(() => {
    let userRole = "Finance Manager";
    let difficulty = searchParams.get('difficulty') || "medium";
    let userId = "11111111-1111-1111-1111-111111111111";
    let company = "NovaTech";

    const storedUser = localStorage.getItem('cyberguard_user');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role) userRole = u.role;
        if (u.id) userId = u.id;
        if (u.company) company = u.company;
      } catch (e) {}
    }

    fetch('http://localhost:8000/api/generate-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        role: userRole,
        difficulty: difficulty,
        company: company
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.scenario) {
          setScenarioId(data.scenario_id);
          setScenario(data.scenario);
        }
      })
      .catch(err => {
        console.log('Notice: Live scenario API offline, using cached situation:', err);
      });
  }, [searchParams]);

  // Smooth fade transitions
  const pageVariants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 1.2, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.8, ease: "easeIn" } }
  };

  const textVariants: Variants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const handleChoice = (choice: string) => {
    setSelectedChoice(choice);
    // Add a tiny delay before moving to reasoning so the selection feels intentional
    setTimeout(() => setCurrentState('REASONING'), 600);
  };

  const submitReasoning = () => {
    if (!reasoning.trim() || !selectedChoice) return;
    setIsSubmitting(true);

    const decisionPayload = {
      scenario_id: scenarioId,
      scenario_text: `${scenario.subject || ''}: ${scenario.body || ''}`,
      sender_email: scenario.sender_email,
      threat_type: scenario.threat_type || 'Business Email Compromise',
      user_action: selectedChoice,
      user_reasoning: reasoning
    };

    // Store in localStorage for the Evaluation page to pick up
    localStorage.setItem('cyberguard_current_decision', JSON.stringify(decisionPayload));

    setTimeout(() => {
      router.push(`/evaluation?scenario_id=${encodeURIComponent(scenarioId)}&choice=${encodeURIComponent(selectedChoice)}`);
    }, 600);
  };

  const bodyParagraphs = (scenario.body || "").split('\n').filter(p => p.trim().length > 0);

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
              SITUATION CHALLENGE
            </motion.p>
            
            <motion.h1 
              variants={textVariants} initial="initial" animate="animate" transition={{ delay: 0.4, duration: 1.2 }}
              className="text-4xl md:text-5xl lg:text-[64px] font-semibold tracking-tighter leading-[1.05] mb-12"
            >
              {scenario.situation_tagline || "Not everything urgent deserves an immediate response."}
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
            <span className="text-sm font-medium tracking-widest text-muted">{scenario.difficulty?.toUpperCase()} LEVEL</span>
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
                    <p className="text-base font-semibold text-primary">{scenario.sender_name || "Executive"}</p>
                    <p className="text-sm text-muted">&lt;{scenario.sender_email || "security@novatech.com"}&gt;</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-sm text-muted w-16 shrink-0">Subject</span>
                  <p className="text-base font-medium text-primary">{scenario.subject || "Security Notification"}</p>
                </div>
              </div>
              
              {/* Email Body */}
              <div className="px-8 py-10 text-base leading-relaxed text-primary/80 font-medium bg-background/50 space-y-4">
                {bodyParagraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 1 }}
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
            <span className="text-sm font-medium tracking-widest text-muted">{scenario.difficulty?.toUpperCase()} LEVEL</span>
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
              {(scenario.choices || []).map((choice, i) => (
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
                {isSubmitting ? 'Submitting to Evaluation Agent...' : <>Continue to Evaluation <span className="font-light">→</span></>}
              </button>
            </motion.div>
          </div>
        </motion.main>
      )}

    </AnimatePresence>
  );
}

export default function CinematicScenario() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted font-medium">Loading scenario...</div>}>
      <ScenarioFlow />
    </Suspense>
  );
}
