"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { EvaluationResults } from '@/components/EvaluationResults';

export default function EvaluationPage() {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border border-blue-500 border-t-blue-500 animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-slate-600">Loading evaluation results...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading evaluation: {error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Evaluation Results</h1>
          <Link 
            href="/dashboard" 
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        <EvaluationResults 
          evaluation={evaluation}
          userAction="I will verify the sender identity through alternate channel"
          userReasoning="This email looks suspicious because the domain is slightly different from our company official domain"
        />
      </div>
    </main>
  );
}
