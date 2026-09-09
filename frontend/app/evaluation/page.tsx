"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EvaluationResults } from '@/components/EvaluationResults';

interface EvaluationData {
    action_score: number;
    reasoning_score: number;
    final_score: number;
    threat_indicators: Array<{
        type: string;
        confidence: number;
        description: string;
    }>;
    reasoning_category: string;
    expected_behavior: string;
    llm_evaluation: {
        confidence: number;
        explanation: string;
    };
}

export default function EvaluationPage() {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  // Mock evaluation data for testing
  useEffect(() => {
    setTimeout(() => {
      setEvaluation({
        action_score: 85,
        reasoning_score: 70,
        final_score: 79,
        threat_indicators: [
          {
            type: "Spoofed Domain",
            confidence: 95,
            description: "Email domain micros0ft.com is a slight variation of microsoft.com"
          },
          {
            type: "Financial Request",
            confidence: 88,
            description: "Request for immediate wire transfer of $50,000"
          },
          {
            type: "Urgency",
            confidence: 92,
            description: "Multiple urgency indicators: immediately, within the hour, urgent"
          }
        ],
        reasoning_category: "security-aware",
        expected_behavior: "Verify sender identity through alternate channel before taking any action",
        llm_evaluation: {
          confidence: 85,
          explanation: "User showed good security awareness by identifying the suspicious domain, but should have emphasized the need for verification through official channels rather than just noting the difference."
        }
      });
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-primary flex flex-col font-sans selection:bg-blue/20">
        <nav className="w-full z-50 pt-8 pb-4 shrink-0">
          <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
              <span className="font-semibold tracking-tight text-lg">CyberGuard AI</span>
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>
        
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center">
            <div className="w-8 h-8 rounded-full border border-cyan/30 border-t-cyan animate-spin mx-auto mb-6"></div>
            <p className="text-sm font-bold tracking-widest uppercase text-muted">Analyzing your decision</p>
          </motion.div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-primary flex flex-col font-sans selection:bg-blue/20">
        <nav className="w-full z-50 pt-8 pb-4 shrink-0">
          <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-2xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
              <span className="font-semibold tracking-tight text-lg">CyberGuard AI</span>
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-primary transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </nav>
        
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center">
            <p className="text-red-500 font-medium mb-4">Error loading evaluation</p>
            <Link href="/dashboard" className="text-cyan hover:text-primary font-semibold text-sm uppercase tracking-widest">
              Return to Dashboard
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-primary flex flex-col font-sans selection:bg-blue/20">
      
      {/* Navigation */}
      <nav className="w-full z-50 pt-8 pb-4 shrink-0">
        <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl leading-none font-light text-cyan opacity-80 group-hover:opacity-100 transition-opacity">◉</span>
            <span className="font-semibold tracking-tight text-lg">CyberGuard AI</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-primary transition-colors tracking-wide">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <motion.div 
        initial="hidden" animate="visible" variants={fadeUp}
        className="flex-1 max-w-[1600px] w-full mx-auto px-8 md:px-12 py-8"
      >
        {evaluation && (
          <EvaluationResults 
            evaluation={evaluation}
            userAction="I will verify the sender identity through alternate channel"
            userReasoning="This email looks suspicious because the domain is slightly different from our company official domain"
          />
        )}
      </motion.div>
    </main>
  );
}
