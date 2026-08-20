"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  // Animation timings based on the spec
  const navVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const headlineVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  const supportTextVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, delay: 0.6, ease: "easeOut" } }
  };

  const ctaVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, delay: 0.8, ease: "easeOut" } }
  };

  const signalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1, delay: 1, ease: "easeInOut" } }
  };

  return (
    <main className="min-h-screen bg-background text-primary font-sans overflow-hidden selection:bg-blue/20 relative">
      
      {/* Subtle Glows */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue/10 rounded-[100%] blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-cyan/5 rounded-[100%] blur-[100px] pointer-events-none -z-10"></div>

      {/* Navigation */}
      <motion.nav 
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="w-full absolute top-0 z-50"
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
            <span className="font-semibold text-lg tracking-tight">CyberGuard AI</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-primary transition-colors tracking-wide">
            Sign in
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 md:px-12 max-w-[1440px] mx-auto">
        
        <div className="flex flex-col items-center text-center">
          
          {/* Subtle line above headline */}
          <motion.div 
             initial={{ scaleX: 0, opacity: 0 }}
             animate={{ scaleX: 1, opacity: 1 }}
             transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
             className="w-16 h-[2px] bg-gradient-to-r from-blue to-cyan mb-8"
          ></motion.div>

          {/* Headline */}
          <motion.h1 
            variants={headlineVariants}
            initial="hidden"
            animate="visible"
            className="text-[48px] md:text-[80px] lg:text-[104px] font-semibold tracking-tighter leading-[1.0] mb-8 text-primary"
          >
            Real situations. <br />
            Better decisions.
          </motion.h1>

          {/* Supporting Text */}
          <motion.p 
            variants={supportTextVariants}
            initial="hidden"
            animate="visible"
            className="text-lg md:text-2xl font-medium text-muted max-w-2xl mx-auto mb-16 tracking-tight leading-relaxed"
          >
            Practice making the right cybersecurity decision before the real moment arrives.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            variants={ctaVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-8 relative"
          >
            {/* Tiny amber accent dot */}
            <div className="absolute -top-4 -right-12 w-2 h-2 bg-amber rounded-full blur-[1px] animate-pulse"></div>

            <Link 
              href="/dashboard" 
              className="bg-blue hover:bg-blue/90 text-white font-medium text-lg px-8 py-4 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-[0_0_30px_rgba(79,124,255,0.2)]"
            >
              Enter your first situation <span className="opacity-70 font-light">→</span>
            </Link>
            
            <button className="text-muted hover:text-primary font-medium text-sm transition-opacity tracking-wide">
              See how it works ↓
            </button>
          </motion.div>

        </div>
      </section>

    </main>
  );
}
