import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDecisionVerdict,
  getSkillLevel,
  calculateHistoricalDelta,
  isIndicatorRelevantForChannel,
  normalizeIndicators,
  getCoachTakeaway,
  formatReadableLabel,
  getChannelGuidance
} from '../lib/evaluation_helpers.ts';

// 1. VERDICT PRECEDENCE TESTS
test('Verdict Precedence: Authoritative is_safe: false produces COMPROMISED even with high action score', () => {
  const result = getDecisionVerdict({
    isSafe: false,
    actionScore: 85,
    reasoningScore: 90,
    userAction: 'Grant consent to keep corporate synchronization active',
    expectedAction: 'Deny access and report untrusted application',
    channel: 'cloud_oauth'
  });

  assert.equal(result.verdict, 'COMPROMISED');
  assert.equal(result.badgeLabel, 'COMPROMISED DECISION');
  assert.equal(result.badgeColor, 'coral');
  assert.match(result.headline, /granted consent/i);
});

test('Verdict Precedence: Unsafe action with strong reasoning stays COMPROMISED but acknowledges awareness', () => {
  const result = getDecisionVerdict({
    userAction: 'Grant consent to keep corporate synchronization active',
    expectedAction: 'Deny access and report the untrusted application to IT Security',
    actionScore: 25,
    reasoningScore: 85, // Strong reasoning score
    channel: 'cloud_oauth'
  });

  assert.equal(result.verdict, 'COMPROMISED');
  assert.equal(result.badgeLabel, 'COMPROMISED DECISION');
  assert.match(result.summary, /noticed risk indicators, but your selected action exposed the organization/i);
});

test('Verdict Precedence: High action score and expected action match produces SECURE', () => {
  const result = getDecisionVerdict({
    isSafe: true,
    userAction: 'Deny access and report the untrusted application to IT Security',
    expectedAction: 'Deny access and report the untrusted application to IT Security',
    actionScore: 95,
    reasoningScore: 80,
    channel: 'cloud_oauth'
  });

  assert.equal(result.verdict, 'SECURE');
  assert.equal(result.badgeLabel, 'SECURE DECISION');
  assert.equal(result.badgeColor, 'teal');
  assert.match(result.headline, /denied unverified third-party access/i);
});

test('Verdict Precedence: Safe action with low reasoning produces PARTIALLY SECURE', () => {
  const result = getDecisionVerdict({
    userAction: 'Deny access and report the untrusted application to IT Security',
    expectedAction: 'Deny access and report the untrusted application to IT Security',
    actionScore: 85,
    reasoningScore: 35, // Low reasoning
    channel: 'cloud_oauth'
  });

  assert.equal(result.verdict, 'PARTIALLY_SECURE');
  assert.equal(result.badgeLabel, 'PARTIALLY SECURE');
  assert.equal(result.badgeColor, 'amber');
});

test('Verdict Precedence: Action score fallback handles ambiguous choices', () => {
  const compromised = getDecisionVerdict({
    userAction: 'Proceed with requested operation',
    expectedAction: 'Refuse operation',
    actionScore: 30,
    reasoningScore: 40,
    channel: 'voice_phone'
  });
  assert.equal(compromised.verdict, 'COMPROMISED');

  const partial = getDecisionVerdict({
    userAction: 'Ask for callback number',
    expectedAction: 'Verify through official internal directory',
    actionScore: 65,
    reasoningScore: 60,
    channel: 'voice_phone'
  });
  assert.equal(partial.verdict, 'PARTIALLY_SECURE');
});

// 2. SKILL LEVEL THRESHOLDS TESTS
test('getSkillLevel maps documented NIST thresholds accurately', () => {
  assert.equal(getSkillLevel(100), 'EXEMPLARY');
  assert.equal(getSkillLevel(85), 'EXEMPLARY');
  assert.equal(getSkillLevel(84), 'PROFICIENT');
  assert.equal(getSkillLevel(70), 'PROFICIENT');
  assert.equal(getSkillLevel(69), 'DEVELOPING');
  assert.equal(getSkillLevel(50), 'DEVELOPING');
  assert.equal(getSkillLevel(49), 'NEEDS IMPROVEMENT');
  assert.equal(getSkillLevel(0), 'NEEDS IMPROVEMENT');
});

// 3. HISTORICAL DELTA CALCULATION TESTS
test('calculateHistoricalDelta excludes current scenario and calculates delta against immediate prior result', () => {
  const pastJourney = [
    { scenario_id: 'sc-1', final_score: 55 },
    { scenario_id: 'sc-2', final_score: 70 },
    { scenario_id: 'sc-current', final_score: 82 } // should be excluded
  ];

  const deltaResult = calculateHistoricalDelta(82, 'sc-current', pastJourney);
  assert.ok(deltaResult);
  assert.equal(deltaResult.delta, 12); // 82 - 70
  assert.equal(deltaResult.isPositive, true);
  assert.equal(deltaResult.formatted, '+12 pts');
});

test('calculateHistoricalDelta handles negative progress', () => {
  const pastJourney = [
    { scenario_id: 'sc-1', final_score: 80 }
  ];

  const deltaResult = calculateHistoricalDelta(64, 'sc-new', pastJourney);
  assert.ok(deltaResult);
  assert.equal(deltaResult.delta, -16); // 64 - 80
  assert.equal(deltaResult.isPositive, false);
  assert.equal(deltaResult.formatted, '-16 pts');
});

test('calculateHistoricalDelta returns null cleanly when no prior comparable decision exists', () => {
  assert.equal(calculateHistoricalDelta(75, 'sc-1', []), null);
  assert.equal(calculateHistoricalDelta(75, 'sc-1', null), null);
  assert.equal(calculateHistoricalDelta(75, 'sc-1', [{ scenario_id: 'sc-1', final_score: 75 }]), null);
});

// 4. CHANNEL-AWARE THREAT INDICATOR NORMALIZER TESTS
test('normalizeIndicators validates and preserves channel-specific indicators', () => {
  const rawOauthIndicators = [
    {
      type: 'Unverified Third-Party Publisher',
      description: 'The application publisher domain is unverified in corporate directory.',
      confidence: 94
    },
    {
      type: 'Excessive Offline Scopes',
      description: 'Application requested offline read/write access to mailbox.',
      confidence: 0.91 // decimal confidence
    }
  ];

  const normalized = normalizeIndicators(rawOauthIndicators, 'cloud_oauth');
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].confidence, 94);
  assert.equal(normalized[1].confidence, 91);
});

test('normalizeIndicators strictly rejects cross-channel mismatched indicators', () => {
  const mismatchedIndicators = [
    {
      type: 'Email Domain Spoofing',
      description: 'Email domain novatech-corp.net is a spoofed variation of corporate domain.',
      confidence: 95
    },
    {
      type: 'Wire Transfer Invoice Lure',
      description: 'Request for immediate wire transfer invoice payment.',
      confidence: 90
    }
  ];

  // In an sms_push scenario, email domain spoofing must be rejected
  const normalizedSms = normalizeIndicators(mismatchedIndicators, 'sms_push');
  assert.equal(normalizedSms.length, 0);

  // In a cloud_oauth scenario, email wire transfer invoice must be rejected
  const normalizedOauth = normalizeIndicators(mismatchedIndicators, 'cloud_oauth');
  assert.equal(normalizedOauth.length, 0);
});

test('normalizeIndicators returns empty array without inventing fake signals when indicators missing', () => {
  assert.deepEqual(normalizeIndicators([], 'sms_push'), []);
  assert.deepEqual(normalizeIndicators(null, 'voice_phone'), []);
  assert.deepEqual(normalizeIndicators(undefined, 'cloud_oauth'), []);
});

test('normalizeIndicators leaves confidence undefined when backend did not supply it', () => {
  const raw = [
    {
      type: 'Unverified Publisher',
      description: 'Developer is unverified.'
      // no confidence field
    }
  ];
  const res = normalizeIndicators(raw, 'cloud_oauth');
  assert.equal(res.length, 1);
  assert.equal(res[0].confidence, undefined);
});

// 5. COACH TAKEAWAY HIERARCHY TESTS
test('getCoachTakeaway prioritizes Coach Agent remediation tip when available', () => {
  const takeaway = getCoachTakeaway(
    {
      remediation_tip: 'Always confirm out-of-band wire requests via verified phone directory.',
      recommended_topic: 'Wire Transfer Out-of-Band Verification'
    },
    {
      improvement: 'Inspect the domain carefully.'
    },
    'email'
  );

  assert.equal(takeaway.source, 'COACH_AGENT');
  assert.equal(takeaway.lesson, 'Always confirm out-of-band wire requests via verified phone directory.');
  assert.equal(takeaway.practiceFocus, 'Wire Transfer Out-of-Band Verification');
});

test('getCoachTakeaway falls back to LLM evaluation when coach tip absent', () => {
  const takeaway = getCoachTakeaway(
    null,
    {
      improvement: 'Never grant offline consent tokens to unverified enterprise apps.',
      explanation: 'Detailed technical analysis of the OAuth grant request.'
    },
    'cloud_oauth'
  );

  assert.equal(takeaway.source, 'EVALUATION_AGENT');
  assert.equal(takeaway.lesson, 'Never grant offline consent tokens to unverified enterprise apps.');
  assert.equal(takeaway.fullAnalysis, 'Detailed technical analysis of the OAuth grant request.');
});

test('getCoachTakeaway uses general channel guidance labeled clearly when both absent', () => {
  const takeaway = getCoachTakeaway(null, null, 'sms_push');

  assert.equal(takeaway.source, 'GENERAL_GUIDANCE');
  assert.match(takeaway.lesson, /unexpected mfa prompts must always be denied/i);
  assert.equal(takeaway.practiceFocus, 'MFA Fatigue Defense');
});

// 6. MACHINE LABEL FORMATTER TESTS
test('formatReadableLabel cleans snake_case into title-case strings', () => {
  assert.equal(formatReadableLabel('security_aware'), 'Security Aware');
  assert.equal(formatReadableLabel('trust_based'), 'Trust Based');
  assert.equal(formatReadableLabel('urgency_bias'), 'Urgency Bias');
  assert.equal(formatReadableLabel(''), 'Security Signal');
  assert.equal(formatReadableLabel(null), 'Security Signal');
});
