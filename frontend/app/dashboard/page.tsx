"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  return (
    <main className="min-h-screen h-screen overflow-hidden bg-background text-primary font-sans selection:bg-blue/20 flex flex-col">
      
      {/* Navigation */}
      <nav className="w-full z-50 pt-8 pb-4 shrink-0">
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
            <span className="font-semibold tracking-tight text-lg">CyberGuard AI</span>
          </Link>
          <button className="flex items-center gap-3 text-sm font-medium text-muted hover:text-primary transition-colors tracking-wide">
            Nimal <span className="text-xl font-light leading-none mb-0.5 text-blue">○</span>
          </button>
        </div>
      </nav>

      {/* Main Single-Screen Grid */}
      <motion.div 
        initial="hidden" animate="visible" variants={staggerContainer}
        className="flex-1 max-w-[1600px] w-full mx-auto px-8 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center"
      >
        
        {/* LEFT COLUMN: Narrative & Next Situation (Col span 5) */}
        <motion.div variants={fadeUp} className="lg:col-span-5 flex flex-col justify-center h-full pr-8">
          <p className="text-sm tracking-widest uppercase text-muted font-semibold mb-6 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue opacity-50"></span> Good afternoon, Nimal
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.2] mb-16 opacity-90 max-w-md">
            You're getting better at noticing when urgency is being used against you.
          </h1>

          {/* The Situation Frame */}
          <div className="relative bg-surface rounded-[2.5rem] p-10 md:p-12 border border-primary/5 overflow-hidden group shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
            
            {/* Subtle amber accent line */}
            <div className="absolute top-0 left-0 w-1 h-full bg-amber/80"></div>
            
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber opacity-80 animate-pulse"></span>
              Your next situation
            </p>
            
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-4 relative z-10 text-primary">
              A payment request <br/> that cannot wait.
            </h2>
            
            <div className="flex items-center gap-2 mb-12 relative z-10">
              <span className="text-xs font-semibold px-3 py-1.5 bg-primary/5 text-muted rounded-full">Finance</span>
              <span className="text-xs font-semibold px-3 py-1.5 bg-primary/5 text-muted rounded-full">3 min</span>
            </div>
            
            <Link 
              href="/scenario" 
              className="inline-flex items-center gap-3 text-blue hover:text-cyan font-semibold text-sm uppercase tracking-widest transition-all group-hover:translate-x-1"
            >
              Enter situation <span className="text-xl font-light">→</span>
            </Link>
          </div>
        </motion.div>

        {/* CENTER COLUMN: Your Decision Journey (Col span 4) */}
        <motion.div variants={fadeUp} className="lg:col-span-4 flex flex-col justify-center h-full relative border-l border-primary/10 pl-12 lg:pl-16">
          <h3 className="absolute top-0 text-[10px] font-bold tracking-widest uppercase text-muted">
            Decision Journey
          </h3>
          
          <div className="w-full flex flex-col mt-12 relative">
            
            {/* The continuous thread line with animated signal pulse */}
            <div className="absolute left-[7px] top-6 bottom-12 w-[2px] bg-primary/10 overflow-hidden">
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: "200%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="h-1/3 w-full bg-gradient-to-b from-transparent via-cyan to-transparent shadow-[0_0_10px_rgba(92,200,215,1)]"
              ></motion.div>
            </div>
            
            {/* Journey Step 1 (Past - Blue/Learning) */}
            <div className="flex gap-8 items-start mb-12 relative group">
              <div className="relative z-10 mt-1 bg-background w-4 h-4 flex items-center justify-center rounded-full border-2 border-blue/30">
                 <div className="w-1.5 h-1.5 bg-blue rounded-full opacity-50"></div>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted mb-1 block">01 / Phishing</span>
                <h4 className="text-xl font-semibold tracking-tight text-primary">Learned to verify links</h4>
              </div>
            </div>

            {/* Journey Step 2 (Recent - Teal/Improving) */}
            <div className="flex gap-8 items-start mb-12 relative group">
               <div className="relative z-10 mt-1 bg-background w-4 h-4 flex items-center justify-center rounded-full border-2 border-teal">
                 <div className="w-1.5 h-1.5 bg-teal rounded-full shadow-[0_0_10px_rgba(79,175,157,0.5)]"></div>
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted mb-1 block">02 / Payment</span>
                <h4 className="text-xl font-semibold tracking-tight text-primary">Improved at slowing down</h4>
              </div>
            </div>

            {/* Journey Step 3 (Next - Amber/Attention) */}
            <div className="flex gap-8 items-start opacity-60 relative">
               <div className="relative z-10 mt-1 bg-background w-4 h-4 rounded-full border-2 border-amber/40 border-dashed">
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber mb-1 block">03 / Executive</span>
                <h4 className="text-xl font-semibold tracking-tight text-primary">Next to explore</h4>
              </div>
            </div>

          </div>
        </motion.div>

        {/* RIGHT COLUMN: Decision Readiness & Numbers (Col span 3) */}
        <motion.div variants={fadeUp} className="lg:col-span-3 flex flex-col justify-between h-full pl-8 py-4 relative">
          
          {/* Subtle Signal Waveform background */}
          <div className="absolute top-10 right-0 opacity-[0.03] pointer-events-none -z-10 text-cyan">
             <svg width="300" height="150" viewBox="0 0 300 150" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M0 75 H50 L80 20 L120 130 L160 50 L190 75 H300" />
             </svg>
          </div>

          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-muted mb-12">
              Readiness Score
            </h3>

            <div>
              <div className="text-[100px] font-semibold tracking-tighter leading-none mb-6 text-primary flex items-start">
                72<span className="text-3xl font-medium text-muted mt-3 ml-1">/100</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-muted max-w-[200px]">
                You're becoming more consistent at verifying unexpected requests.
              </p>
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-16 pt-12 border-t border-primary/10">
             <div>
               <div className="text-3xl font-semibold tracking-tighter mb-2 text-primary">08</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Situations</div>
             </div>
             <div>
               <div className="text-3xl font-semibold tracking-tighter mb-2 text-primary">03</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Clues identified</div>
             </div>
             <div>
               <div className="text-3xl font-semibold tracking-tighter mb-2 text-primary">02</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Patterns</div>
             </div>
             <div>
               <div className="text-3xl font-semibold tracking-tighter mb-2 text-primary">18</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted">Days learning</div>
             </div>
          </div>

        </motion.div>

      </motion.div>
    </main>
  );
}
