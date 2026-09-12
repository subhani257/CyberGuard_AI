"use client";
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { EvaluationHeader } from './evaluation/EvaluationHeader';
import { EvaluationMetricCard } from './evaluation/EvaluationMetricCard';
import { ThreatIndicatorList } from './evaluation/ThreatIndicatorList';
import { DecisionGapCard } from './evaluation/DecisionGapCard';
import { ReasoningReview } from './evaluation/ReasoningReview';
import { CoachTakeaway } from './evaluation/CoachTakeaway';
import { 
  getDecisionVerdict, 
  getSkillLevel, 
  normalizeIndicators, 
  getCoachTakeaway, 
  formatReadableLabel 
} from '@/lib/evaluation_helpers';
import type { 
  DecisionGapData, 
  ReasoningReviewData 
} from './evaluation/types';

export interface EvaluationResultsProps {
  evaluation: {
    action_score: number;
    reasoning_score: number;
    final_score: number;
    is_safe?: boolean;
    threat_indicators: Array<{
      type: string;
      confidence?: number;
      description: string;
      channel?: string;
    }>;
    reasoning_category: string;
    expected_behavior: string;
    llm_evaluation?: {
      confidence?: number;
      explanation?: string;
      strengths?: string[];
      weaknesses?: string[];
      improvement?: string;
    };
  };
  userAction: string;
  userReasoning: string;
  channel?: string;
  responseTimeSeconds?: number | null;
  historicalDelta?: { delta: number; isPositive: boolean; formatted: string } | null;
  backendCoaching?: any;
  policyRuleText?: string | null;
  onOpenHub?: () => void;
}

export const EvaluationResults: React.FC<EvaluationResultsProps> = ({
  evaluation,
  userAction,
  userReasoning,
  channel = 'cloud_oauth',
  responseTimeSeconds = null,
  historicalDelta = null,
  backendCoaching = null,
  policyRuleText = null
}) => {
  const {
    action_score,
    reasoning_score,
    final_score,
    is_safe,
    threat_indicators,
    reasoning_category,
    expected_behavior,
    llm_evaluation
  } = evaluation;

  // 1. Authoritative Verdict Resolution
  const verdictResult = getDecisionVerdict({
    isSafe: is_safe,
    userAction,
    expectedAction: expected_behavior,
    actionScore: action_score,
    reasoningScore: reasoning_score,
    channel
  });

  // 2. Skill Level
  const skillLevel = getSkillLevel(final_score);

  // 3. Channel-Specific Indicator Normalization (Rejects mismatched channel signals)
  const normalizedIndicators = normalizeIndicators(threat_indicators, channel);

  // 4. Decision Gap Preparation
  const isUserActionSafe = verdictResult.verdict === 'SECURE';
  const decisionGapData: DecisionGapData = {
    userAction,
    expectedAction: expected_behavior,
    isUserActionSafe,
    policyRuleText
  };

  // 5. Reasoning Review Data
  const readableCategory = formatReadableLabel(reasoning_category);
  const strengths = Array.isArray(llm_evaluation?.strengths) && llm_evaluation.strengths.length > 0
    ? llm_evaluation.strengths
    : [readableCategory, "Decision submitted for evaluation"];
  const weaknesses = Array.isArray(llm_evaluation?.weaknesses) && llm_evaluation.weaknesses.length > 0
    ? llm_evaluation.weaknesses
    : (verdictResult.verdict === 'COMPROMISED' ? ["Action exposed corporate assets"] : []);

  const reasoningReviewData: ReasoningReviewData = {
    userReasoning,
    classificationCategory: reasoning_category,
    classificationLabel: readableCategory,
    confidence: llm_evaluation?.confidence,
    strengths,
    weaknesses,
    explanation: llm_evaluation?.explanation
  };

  // 6. Coach Takeaway Data (Hierarchical resolution)
  const coachTakeawayData = getCoachTakeaway(backendCoaching, llm_evaluation, channel);

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.08 } 
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="w-full max-w-[1440px] mx-auto space-y-6 font-sans"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── TOP HEADER: Eyebrow, Verdict Badge, Dynamic Title, Overall Score Gauge */}
      <motion.div variants={itemVariants}>
        <EvaluationHeader
          verdictResult={verdictResult}
          score={final_score}
          skillLevel={skillLevel}
          historicalDelta={historicalDelta}
        />
      </motion.div>

      {/* ── METRIC CARDS ROW: Action Score, Reasoning Score, Response Time / Confidence */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Action Score */}
        <EvaluationMetricCard
          label="ACTION SCORE"
          value={action_score}
          maxValue="/100"
          interpretation={
            action_score >= 75 ? "Defensive Verification" :
            action_score >= 50 ? "Partial Mitigation" : "Risky Response"
          }
          consequence={
            action_score >= 75 ? "Prevented unauthorized access tokens" :
            action_score >= 50 ? "Avoided direct execution but left residual risk" : "Led to organizational credential exposure"
          }
          color={action_score >= 75 ? "teal" : action_score >= 50 ? "amber" : "coral"}
          progressPercent={action_score}
        />

        {/* Metric 2: Reasoning Score */}
        <EvaluationMetricCard
          label="REASONING SCORE"
          value={reasoning_score}
          maxValue="/100"
          interpretation={
            reasoning_score >= 75 ? "Strong Awareness" :
            reasoning_score >= 50 ? "Moderate Inspection" : "Superficial Check"
          }
          consequence={`Classified as ${readableCategory}`}
          color={reasoning_score >= 75 ? "teal" : reasoning_score >= 50 ? "blue" : "amber"}
          progressPercent={reasoning_score}
        />

        {/* Metric 3: Response Time (Monotonic telemetry) or Evaluation Confidence */}
        {responseTimeSeconds !== null && responseTimeSeconds > 0 ? (
          <EvaluationMetricCard
            label="RESPONSE TIME"
            value={`${responseTimeSeconds}s`}
            maxValue="Target <60s"
            interpretation={
              responseTimeSeconds < 45 ? "Prompt Analysis" :
              responseTimeSeconds < 90 ? "Careful Inspection" : "Extended Review"
            }
            consequence="Measured from scenario presentation to submission"
            color="cyan"
            progressPercent={Math.min(100, Math.round((responseTimeSeconds / 60) * 100))}
            badge="Telemetry"
          />
        ) : (
          <EvaluationMetricCard
            label="EVALUATION CONFIDENCE"
            value={`${llm_evaluation?.confidence || 88}%`}
            maxValue="Certainty"
            interpretation={
              (llm_evaluation?.confidence || 88) >= 80 ? "High Certainty" : "Moderate Certainty"
            }
            consequence="AI model analytical confidence in assessment"
            color="blue"
            progressPercent={llm_evaluation?.confidence || 88}
            badge="Model Metric"
          />
        )}
      </motion.div>

      {/* ── MIDDLE SECTION: Threat Indicators (Signals) & Decision Gap */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Security Signals in this Scenario (7 cols) */}
        <div className="lg:col-span-7">
          <ThreatIndicatorList
            indicators={normalizedIndicators}
            channel={channel}
            hasMissedFlag={false}
          />
        </div>

        {/* Right Column: Decision Gap (5 cols) */}
        <div className="lg:col-span-5">
          <DecisionGapCard data={decisionGapData} />
        </div>
      </motion.div>

      {/* ── LOWER SECTION: Reasoning Review & Coach Takeaway */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Reasoning Review (7 cols) */}
        <div className="lg:col-span-7">
          <ReasoningReview data={reasoningReviewData} />
        </div>

        {/* Right Column: Coach Takeaway (5 cols) */}
        <div className="lg:col-span-5">
          <CoachTakeaway data={coachTakeawayData} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EvaluationResults;
