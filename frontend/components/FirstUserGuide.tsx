"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ScrollText, Target, Shield, Lightbulb, X, ArrowRight, ArrowLeft } from 'lucide-react';

interface FirstUserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  companyName?: string;
}

const TOUR_STEPS = [
  {
    step: 1,
    badge: "Welcome to Midnight Intelligence",
    title: "Personalized Security Grounding",
    icon: <Building2 className="w-7 h-7 text-primary" />,
    description: "Unlike static, generic phishing tests, Midnight Intelligence crafts adaptive spear-phishing scenarios specifically grounded in your actual organization, department, and role responsibilities.",
    tip: "Tip: Your current role and company profile are used by our AI agents to simulate authentic attack vectors tailored to your daily workflows."
  },
  {
    step: 2,
    badge: "RAG Knowledge Engine",
    title: "Intelligent Policy Ingestion",
    icon: <ScrollText className="w-7 h-7 text-primary" />,
    description: "Clients can upload security policies in any format—messy PDFs, numbered legal SOPs, bullet points, or email wikis. Our Two-Tier Extractor isolates atomic compliance rules and embeds them locally with free Hugging Face AI.",
    tip: "Tip: When you make decisions during simulations, our evaluation agents cite your company's exact policy rules (e.g., dual-approval thresholds or phone callbacks)."
  },
  {
    step: 3,
    badge: "Privacy & Simulation",
    title: "Targeted Simulations & Local PII Shield",
    icon: <Target className="w-7 h-7 text-primary" />,
    description: "When generating attack scenarios, our spaCy Named Entity Recognition (NER) pipeline automatically sanitizes sensitive names, emails, and financial amounts to guarantee enterprise privacy compliance.",
    tip: "Tip: Look out for urgency cues, subtle domain spoofing, and executive bypass attempts embedded in incoming simulated communications."
  },
  {
    step: 4,
    badge: "Behavioral Analytics",
    title: "Readiness Scoring & Coaching",
    icon: <Shield className="w-7 h-7 text-primary" />,
    description: "After each simulation, receive an immediate behavioral debrief dissecting cognitive biases (urgency, authority, social proof) and track your longitudinal defense readiness score on this dashboard.",
    tip: "Tip: Aim to keep your Readiness Score above 80/100 across all core security competencies."
  }
];

export const FirstUserGuide: React.FC<FirstUserGuideProps> = ({
  isOpen,
  onClose,
  userRole = "Finance Manager",
  companyName = "Your Organization"
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('cyberguard_tour_completed', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-surface border border-primary/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden font-sans"
        >
          {/* Subtle Top Glowing Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue via-cyan to-blue opacity-70"></div>

          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-cyan/10 text-cyan">
                {current.badge}
              </span>
              <span className="text-xs text-muted font-medium">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>

            <button
              onClick={handleComplete}
              className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-primary transition-colors tracking-wide px-2 py-1 rounded-md hover:bg-primary/5"
            >
              Skip Tour <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main Card Content */}
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-3xl mb-5 shadow-inner">
              {current.icon}
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-primary mb-3">
              {current.title}
            </h2>

            <p className="text-sm text-muted leading-relaxed mb-6 font-medium">
              {current.description}
            </p>

            {/* Pro Tip Box */}
            <div className="p-4 rounded-2xl bg-background/60 border border-primary/5 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary/80 leading-relaxed">
                {current.tip}
              </p>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-between pt-6 border-t border-primary/10">
            <div className="flex items-center gap-2">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-8 bg-cyan'
                      : 'w-2 bg-primary/20 hover:bg-primary/40'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-cyan hover:bg-cyan/90 text-background font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(92,200,215,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>Get Started <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                  <>Next Step <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
