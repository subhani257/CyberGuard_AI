export type VerdictType = 'COMPROMISED' | 'PARTIALLY_SECURE' | 'SECURE';

export type SkillLevel = 'EXEMPLARY' | 'PROFICIENT' | 'DEVELOPING' | 'NEEDS IMPROVEMENT';

export interface VerdictInput {
  actionOutcome?: 'SECURE' | 'COMPROMISED' | 'PARTIALLY_SECURE' | null;
  isSafe?: boolean | null;
  userAction: string;
  expectedAction: string;
  actionScore?: number | null;
  reasoningScore?: number | null;
  channel?: string | null;
}

export interface VerdictResult {
  verdict: VerdictType;
  badgeLabel: string;
  headline: string;
  summary: string;
  badgeColor: 'coral' | 'amber' | 'teal';
}

export interface NormalizedIndicator {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence?: number;
  channel: string;
  isRecognized?: boolean;
}

export interface MetricCardData {
  label: string;
  value: string | number;
  maxValue?: number;
  interpretation: string;
  consequence?: string;
  color: 'coral' | 'amber' | 'teal' | 'blue' | 'cyan';
  progressPercent: number;
}

export interface DecisionGapData {
  userAction: string;
  expectedAction: string;
  isUserActionSafe: boolean;
  policyRuleText?: string | null;
  policyCode?: string | null;
}

export interface ReasoningReviewData {
  userReasoning: string;
  classificationCategory: string;
  classificationLabel: string;
  confidence?: number;
  strengths: string[];
  weaknesses: string[];
  explanation?: string;
}

export interface CoachTakeawayData {
  lesson: string;
  practiceFocus: string;
  source: 'COACH_AGENT' | 'EVALUATION_AGENT' | 'GENERAL_GUIDANCE';
  fullAnalysis?: string;
  confidence?: number;
}
