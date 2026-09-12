import type {
  VerdictType,
  SkillLevel,
  VerdictInput,
  VerdictResult,
  NormalizedIndicator,
  CoachTakeawayData
} from '../components/evaluation/types.ts';

/**
 * 1. AUTHORITATIVE VERDICT CALCULATION
 * Strict Precedence:
 * 1. Authoritative backend isSafe outcome
 * 2. Expected-action comparison
 * 3. Action score threshold as legacy fallback
 * INVARIANT: Reasoning score NEVER converts an unsafe action into a secure verdict.
 */
export function getDecisionVerdict(input: VerdictInput): VerdictResult {
  const {
    actionOutcome,
    isSafe,
    userAction = '',
    expectedAction = '',
    actionScore = null,
    reasoningScore = null,
    channel = 'cloud_oauth'
  } = input;

  const userActionLower = (userAction || '').toLowerCase();
  const expectedActionLower = (expectedAction || '').toLowerCase();

  // Known dangerous action keywords
  const unsafeKeywords = [
    'grant consent', 'grant', 'allow', 'approve', 'approve request',
    'click', 'transfer', 'wire', 'accept', 'download', 'execute',
    'provide credential', 'log in', 'insert'
  ];
  const hasUnsafeKeyword = unsafeKeywords.some(kw => userActionLower.includes(kw));

  // Known safe action keywords
  const safeKeywords = [
    'deny', 'report', 'verify', 'confirm', 'reject', 'ignore', 'delete',
    'out-of-band', 'alternate channel', 'block', 'escalate'
  ];
  const hasSafeKeyword = safeKeywords.some(kw => userActionLower.includes(kw));

  let verdict: VerdictType;

  // 1. Authoritative backend is_safe check
  if (isSafe === false || actionOutcome === 'COMPROMISED') {
    verdict = 'COMPROMISED';
  } else if (isSafe === true || actionOutcome === 'SECURE') {
    // Safety check: if user action explicitly contains unsafe action keywords and no safe keywords,
    // or actionScore is critically low, do not allow false SECURE
    if (hasUnsafeKeyword && !hasSafeKeyword) {
      verdict = 'COMPROMISED';
    } else if (actionScore !== null && actionScore < 50) {
      verdict = 'COMPROMISED';
    } else if (reasoningScore !== null && reasoningScore < 50) {
      verdict = 'PARTIALLY_SECURE';
    } else {
      verdict = 'SECURE';
    }
  } else {
    // 2. Expected action comparison
    if (expectedAction && userActionLower === expectedActionLower) {
      verdict = reasoningScore !== null && reasoningScore < 50 ? 'PARTIALLY_SECURE' : 'SECURE';
    } else if (hasUnsafeKeyword && !hasSafeKeyword) {
      verdict = 'COMPROMISED';
    } else if (hasSafeKeyword) {
      verdict = (actionScore !== null && actionScore < 60) ? 'PARTIALLY_SECURE' : 'SECURE';
    } else if (actionScore !== null) {
      // 3. Action score threshold legacy fallback
      if (actionScore >= 75) {
        verdict = (reasoningScore !== null && reasoningScore < 50) ? 'PARTIALLY_SECURE' : 'SECURE';
      } else if (actionScore < 50) {
        verdict = 'COMPROMISED';
      } else {
        verdict = 'PARTIALLY_SECURE';
      }
    } else {
      verdict = 'PARTIALLY_SECURE';
    }
  }

  // Generate dynamic channel-aware headline and explanation
  return formatVerdictContent(verdict, userAction, channel, reasoningScore);
}

function formatVerdictContent(
  verdict: VerdictType,
  userAction: string,
  channel?: string | null,
  reasoningScore?: number | null
): VerdictResult {
  const userActionLower = (userAction || '').toLowerCase();
  const strongReasoning = typeof reasoningScore === 'number' && reasoningScore >= 60;

  if (verdict === 'COMPROMISED') {
    let headline = 'You selected a compromised action.';
    if (userActionLower.includes('grant') || userActionLower.includes('consent') || channel === 'cloud_oauth') {
      headline = 'You granted consent to an untrusted application.';
    } else if (userActionLower.includes('approve') || channel === 'sms_push') {
      headline = 'You approved a suspicious MFA authentication prompt.';
    } else if (userActionLower.includes('transfer') || userActionLower.includes('wire') || channel === 'email') {
      headline = 'You authorized an unverified wire transfer request.';
    } else if (channel === 'voice_phone') {
      headline = 'You complied with an unauthorized voice intercept caller.';
    } else if (channel === 'slack_teams') {
      headline = 'You opened an untrusted link from an external workspace chat.';
    } else if (channel === 'qr_code') {
      headline = 'You scanned an unverified physical workplace QR notice.';
    } else if (channel === 'physical_media') {
      headline = 'You connected an untrusted removable USB drive.';
    }

    const summary = strongReasoning
      ? 'Your reasoning noticed risk indicators, but your selected action exposed the organization.'
      : 'The threat signals were not identified, and your chosen action compromised organizational security.';

    return {
      verdict: 'COMPROMISED',
      badgeLabel: 'COMPROMISED DECISION',
      headline,
      summary,
      badgeColor: 'coral'
    };
  }

  if (verdict === 'PARTIALLY_SECURE') {
    let headline = 'You took partial defensive action with remaining exposure.';
    if (channel === 'cloud_oauth') {
      headline = 'You questioned the OAuth request but left partial permission tokens active.';
    } else if (channel === 'sms_push') {
      headline = 'You ignored the push notification instead of actively denying and reporting it.';
    } else if (channel === 'voice_phone') {
      headline = 'You challenged the caller but did not verify identity via corporate directory.';
    }

    const summary = 'Your decision reduced immediate harm, but did not complete the full required verification protocol.';

    return {
      verdict: 'PARTIALLY_SECURE',
      badgeLabel: 'PARTIALLY SECURE',
      headline,
      summary,
      badgeColor: 'amber'
    };
  }

  // SECURE
  let headline = 'You successfully defended against the threat.';
  if (channel === 'cloud_oauth') {
    headline = 'You denied unverified third-party access and reported the application.';
  } else if (channel === 'sms_push') {
    headline = 'You denied the unsolicited MFA push prompt and reported fatigue bombing.';
  } else if (channel === 'voice_phone') {
    headline = 'You refused executive pressure and verified identity through an alternate channel.';
  } else if (channel === 'email') {
    headline = 'You identified the spoofed sender domain and flagged the wire transfer lure.';
  } else if (channel === 'slack_teams') {
    headline = 'You blocked the external message and verified the request through IT security.';
  } else if (channel === 'qr_code') {
    headline = 'You avoided the physical QR redirect and reported the fraudulent notice.';
  } else if (channel === 'physical_media') {
    headline = 'You safely quarantined the untrusted USB device without mounting it.';
  }

  const summary = 'Your reasoning accurately identified the deception, and your action followed corporate security protocol.';

  return {
    verdict: 'SECURE',
    badgeLabel: 'SECURE DECISION',
    headline,
    summary,
    badgeColor: 'teal'
  };
}

/**
 * 2. SKILL LEVEL THRESHOLDS
 */
export function getSkillLevel(score: number): SkillLevel {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  if (boundedScore >= 85) return 'EXEMPLARY';
  if (boundedScore >= 70) return 'PROFICIENT';
  if (boundedScore >= 50) return 'DEVELOPING';
  return 'NEEDS IMPROVEMENT';
}

/**
 * 3. HISTORICAL DELTA CALCULATION
 * Compares strictly against previous completed decision, excluding current scenario.
 * Returns null if no prior valid score exists.
 */
export function calculateHistoricalDelta(
  currentScore: number,
  currentScenarioId?: string | null,
  decisionJourney?: any[] | null
): { delta: number; isPositive: boolean; formatted: string } | null {
  if (!Array.isArray(decisionJourney) || decisionJourney.length === 0) {
    return null;
  }

  // Filter out the current scenario if it was already recorded
  const pastDecisions = decisionJourney.filter((item: any) => {
    if (!item || typeof item !== 'object') return false;
    if (currentScenarioId && (item.scenario_id === currentScenarioId || item.id === currentScenarioId)) {
      return false;
    }
    const s = item.final_score ?? item.score ?? item.evaluation?.final_score;
    return typeof s === 'number' && !isNaN(s);
  });

  if (pastDecisions.length === 0) {
    return null;
  }

  // Get most recent past decision
  const priorDecision = pastDecisions[pastDecisions.length - 1];
  const priorScore = priorDecision.final_score ?? priorDecision.score ?? priorDecision.evaluation?.final_score;

  if (typeof priorScore !== 'number' || isNaN(priorScore)) {
    return null;
  }

  const delta = Math.round(currentScore) - Math.round(priorScore);
  const isPositive = delta >= 0;
  const formatted = delta > 0 ? `+${delta} pts` : delta === 0 ? `0 pts` : `${delta} pts`;

  return { delta, isPositive, formatted };
}

/**
 * 4. CHANNEL-AWARE THREAT INDICATOR NORMALIZER
 * Validates indicator relevance for current channel; rejects cross-channel mismatch.
 * Preserves backend numeric confidence only when provided. Never fabricates evidence.
 */
const CHANNEL_INDICATOR_KEYWORDS: Record<string, string[]> = {
  cloud_oauth: ['oauth', 'scope', 'publisher', 'token', 'permission', 'consent', 'unverified', 'third-party', 'api', 'cloud', 'directory'],
  sms_push: ['mfa', 'push', 'authenticator', 'prompt', 'fatigue', 'bombing', 'login attempt', 'ip geolocation', 'phone', 'device'],
  voice_phone: ['voice', 'call', 'vishing', 'phone', 'wire', 'caller id', 'extension', 'verbal', 'telephony', 'urgent', 'spoofed number'],
  email: ['email', 'domain', 'spoof', 'wire transfer', 'sender', 'invoice', 'bec', 'executive', 'urgency', 'payment'],
  slack_teams: ['slack', 'teams', 'message', 'chat', 'link', 'token', 'coworker', 'direct message', 'workspace', 'url'],
  qr_code: ['qr', 'quishing', 'code', 'physical', 'flyer', 'notice', 'scanner', 'redirect', 'printer'],
  physical_media: ['usb', 'drive', 'flash', 'hardware', 'removable', 'peripheral', 'autorun', 'dropped', 'payload']
};

export function isIndicatorRelevantForChannel(indicatorType: string, description: string, channel: string): boolean {
  const allowedKeywords = CHANNEL_INDICATOR_KEYWORDS[channel];
  if (!allowedKeywords) return true;

  const combined = `${indicatorType} ${description}`.toLowerCase();

  // Strict cross-channel rejection rules
  if (channel === 'sms_push' || channel === 'cloud_oauth' || channel === 'physical_media') {
    // These channels should never show email domain spoofing or wire transfer lure unless explicitly matched
    if (combined.includes('email domain') || combined.includes('spoofed domain') || combined.includes('wire transfer invoice')) {
      return false;
    }
  }

  return allowedKeywords.some(kw => combined.includes(kw));
}

export function normalizeIndicators(
  rawIndicators: any[] | null | undefined,
  channel: string
): NormalizedIndicator[] {
  if (!Array.isArray(rawIndicators) || rawIndicators.length === 0) {
    return [];
  }

  const normalized: NormalizedIndicator[] = [];

  rawIndicators.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;

    const rawType = item.type || item.name || 'Security Signal';
    const rawDesc = item.description || item.reason || item.detail || '';
    
    // Validate channel relevance
    if (!isIndicatorRelevantForChannel(rawType, rawDesc, channel)) {
      return;
    }

    // Preserve real confidence if numeric
    let confidence: number | undefined = undefined;
    if (typeof item.confidence === 'number' && !isNaN(item.confidence)) {
      confidence = item.confidence > 1 ? Math.min(100, Math.round(item.confidence)) : Math.round(item.confidence * 100);
    }

    normalized.push({
      id: item.id || `ind-${index}-${channel}`,
      type: rawType,
      title: formatReadableLabel(rawType),
      description: rawDesc,
      confidence,
      channel,
      isRecognized: item.is_recognized ?? item.recognized ?? false
    });
  });

  return normalized;
}

/**
 * 5. CHANNEL GENERAL GUIDANCE (Educational metadata, clearly separated from evaluation evidence)
 */
const CHANNEL_GENERAL_GUIDANCE: Record<string, { practiceFocus: string; generalGuidance: string }> = {
  cloud_oauth: {
    practiceFocus: 'Third-Party Scope Verification',
    generalGuidance: 'Never grant offline access or mailbox read permissions to unverified third-party integrations. Verify application publishers directly with IT administrators.'
  },
  sms_push: {
    practiceFocus: 'MFA Fatigue Defense',
    generalGuidance: 'Unexpected MFA prompts must always be denied. Repeated prompt bombardment is an active attack—report the incident to IT Security immediately.'
  },
  voice_phone: {
    practiceFocus: 'Dual-Control Call Verification',
    generalGuidance: 'Inbound callers claiming urgent executive authority must be verified via a known internal corporate directory number before any sensitive action is taken.'
  },
  email: {
    practiceFocus: 'Domain & Wire Transfer Validation',
    generalGuidance: 'Always inspect the exact email domain characters. Out-of-band wire transfer requests require secondary verbal verification via verified phone numbers.'
  },
  slack_teams: {
    practiceFocus: 'Workspace Infiltration Defense',
    generalGuidance: 'External guest handles and unexpected collaboration links should be treated with suspicion. Never enter corporate credentials on external authorization pages.'
  },
  qr_code: {
    practiceFocus: 'Physical Environmental Security',
    generalGuidance: 'Printed workplace notices containing QR codes bypass digital filters. Never scan unverified physical flyers that demand immediate credential or MFA reset.'
  },
  physical_media: {
    practiceFocus: 'Removable Media Quarantine',
    generalGuidance: 'Untrusted USB flash drives found in corporate premises should never be inserted into workstations. Turn unverified hardware over to physical security.'
  }
};

export function getChannelGuidance(channel: string): { practiceFocus: string; generalGuidance: string } {
  return CHANNEL_GENERAL_GUIDANCE[channel] || {
    practiceFocus: 'Security Verification Protocol',
    generalGuidance: 'Always verify unexpected authorization requests through verified secondary channels before taking action.'
  };
}

/**
 * 6. COACH TAKEAWAY RESOLUTION HIERARCHY
 * Priority: (1) Backend Coach Agent, (2) Backend Evaluation LLM, (3) Static General Channel Guidance
 */
export function getCoachTakeaway(
  backendCoaching?: any,
  llmEvaluation?: any,
  channel: string = 'cloud_oauth'
): CoachTakeawayData {
  const channelGuidance = getChannelGuidance(channel);

  // 1. Backend Coach Agent Takeaway
  if (backendCoaching && typeof backendCoaching === 'object') {
    const tip = backendCoaching.remediation_tip || backendCoaching.feedback;
    if (tip && typeof tip === 'string' && tip.trim().length > 10) {
      return {
        lesson: tip.trim(),
        practiceFocus: backendCoaching.recommended_topic || channelGuidance.practiceFocus,
        source: 'COACH_AGENT',
        fullAnalysis: backendCoaching.reason_for_path || backendCoaching.feedback,
        confidence: undefined
      };
    }
  }

  // 2. Backend Evaluation LLM Takeaway
  if (llmEvaluation && typeof llmEvaluation === 'object') {
    const improvement = llmEvaluation.improvement || llmEvaluation.explanation;
    if (improvement && typeof improvement === 'string' && improvement.trim().length > 10) {
      return {
        lesson: llmEvaluation.improvement || improvement.slice(0, 160),
        practiceFocus: channelGuidance.practiceFocus,
        source: 'EVALUATION_AGENT',
        fullAnalysis: llmEvaluation.explanation,
        confidence: typeof llmEvaluation.confidence === 'number' ? llmEvaluation.confidence : undefined
      };
    }
  }

  // 3. Static General Guidance
  return {
    lesson: channelGuidance.generalGuidance,
    practiceFocus: channelGuidance.practiceFocus,
    source: 'GENERAL_GUIDANCE',
    fullAnalysis: undefined,
    confidence: undefined
  };
}

/**
 * 7. MACHINE LABEL FORMATTER
 */
export function formatReadableLabel(rawLabel?: string | null): string {
  if (!rawLabel) return 'Security Signal';
  return rawLabel
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
