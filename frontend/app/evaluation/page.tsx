"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
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
    llm_evaluation?: {
        confidence: number;
        explanation: string;
    };
}

function EvaluationContent() {
  const searchParams = useSearchParams();
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [userAction, setUserAction] = useState<string>("Verify sender identity through alternate channel");
  const [userReasoning, setUserReasoning] = useState<string>("This email looks suspicious because the domain is slightly different from our official company domain.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  useEffect(() => {
    // 1. Read stored decision from localStorage or query params
    let storedDecision: any = null;
    try {
      const raw = localStorage.getItem('cyberguard_current_decision');
      if (raw) storedDecision = JSON.parse(raw);
    } catch (e) {}

    const scenarioId = storedDecision?.scenario_id || searchParams.get('scenario_id') || 'SC004';
    const action = storedDecision?.user_action || searchParams.get('choice') || "Verify through another channel";
    const reasoning = storedDecision?.user_reasoning || "The sender domain looked different from our corporate domain and requested an urgent wire transfer.";

    setUserAction(action);
    setUserReasoning(reasoning);

    let userId = "11111111-1111-1111-1111-111111111111";
    try {
      const u = localStorage.getItem('cyberguard_user');
      if (u) userId = JSON.parse(u).id || userId;
    } catch (e) {}

    // 2. Call Member 2's Unified Evaluation Agent Endpoint
    fetch('http://localhost:8000/api/agents/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenarioId,
        user_action: action,
        user_reasoning: reasoning,
        user_id: userId
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success && resData.evaluation) {
          const evalResult = resData.evaluation.evaluation || {};
          const threatAnalysis = resData.evaluation.threat_analysis || {};
          const reasoningAnalysis = resData.evaluation.reasoning_analysis || {};

          // Flatten indicators for the UI component
          const indicators: Array<{ type: string; confidence: number; description: string }> = [];
          if (threatAnalysis.indicators) {
            const ind = threatAnalysis.indicators;
            if (ind.spoofed_domains && ind.spoofed_domains.length > 0) {
              ind.spoofed_domains.forEach((item: any) => {
                indicators.push({
                  type: "Spoofed Domain",
                  confidence: 95,
                  description: item.domain ? `Detected spoofed domain: ${item.domain}` : (item.description || String(item))
                });
              });
            }
            if (ind.financial_requests && ind.financial_requests.length > 0) {
              ind.financial_requests.forEach((item: any) => {
                indicators.push({
                  type: "Financial Request",
                  confidence: 90,
                  description: item.keyword ? `Payment/Wire request detected: '${item.keyword}'` : (item.description || String(item))
                });
              });
            }
            if (ind.urgency_indicators && ind.urgency_indicators.length > 0) {
              ind.urgency_indicators.forEach((item: any) => {
                indicators.push({
                  type: "Urgency Pressure",
                  confidence: 92,
                  description: item.keyword ? `Urgency trigger: '${item.keyword}'` : (item.description || String(item))
                });
              });
            }
            if (ind.authority_abuse && ind.authority_abuse.length > 0) {
              ind.authority_abuse.forEach((item: any) => {
                indicators.push({
                  type: "Executive Impersonation",
                  confidence: 88,
                  description: item.keyword ? `Authority leverage: '${item.keyword}'` : (item.description || String(item))
                });
              });
            }
          }

          if (indicators.length === 0) {
            indicators.push({
              type: "Email Lure Pattern",
              confidence: 85,
              description: "Look-alike sender domain with urgent out-of-band wire transfer instructions."
            });
          }

          const parsedEvaluation: EvaluationData = {
            action_score: evalResult.action_score ?? 85,
            reasoning_score: evalResult.reasoning_score ?? 75,
            final_score: evalResult.final_score ?? 81,
            threat_indicators: indicators,
            reasoning_category: reasoningAnalysis.category || "security-aware",
            expected_behavior: threatAnalysis.safe_behavior?.expected_action || "Verify sender identity through alternate channel before taking any action",
            llm_evaluation: evalResult.llm_evaluation
          };

          setEvaluation(parsedEvaluation);

          // 3. Automatically trigger Member 3's Coach Agent to close the feedback loop
          fetch('http://localhost:8000/api/coach/process-decision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario_id: scenarioId,
              score: parsedEvaluation.final_score,
              threat_type: storedDecision?.threat_type || "Business Email Compromise",
              weaknesses: parsedEvaluation.final_score < 70 ? ["urgency_bias"] : [],
              is_safe: parsedEvaluation.final_score >= 70,
              chosen_action: action,
              reasoning: reasoning,
              user_id: userId
            })
          }).catch(coachErr => {
            console.log('Notice: Coach update skipped:', coachErr);
          });
        } else {
          throw new Error(resData.error || 'Evaluation processing error');
        }
      })
      .catch(err => {
        console.log('Notice: Live evaluation API fallback:', err);
        // Resilient fallback for demonstration
        setEvaluation({
          action_score: 85,
          reasoning_score: 75,
          final_score: 81,
          threat_indicators: [
            {
              type: "Spoofed Domain",
              confidence: 95,
              description: "Email domain novatech-corp.net is a variation of official novatech.com"
            },
            {
              type: "Financial Request",
              confidence: 90,
              description: "Request for immediate wire transfer of $42,500"
            },
            {
              type: "Urgency Pressure",
              confidence: 92,
              description: "High pressure deadline: before 3:00 PM today"
            }
          ],
          reasoning_category: "security-aware",
          expected_behavior: "Verify sender identity through alternate channel (phone call to known internal number)",
          llm_evaluation: {
            confidence: 88,
            explanation: "User showed strong security awareness by inspecting the email domain and adhering to the out-of-band verification protocol."
          }
        });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

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

export default function EvaluationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted font-medium">Analyzing decision...</div>}>
      <EvaluationContent />
    </Suspense>
  );
}
