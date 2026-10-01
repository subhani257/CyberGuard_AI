import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isInputElement,
  shouldIgnoreKeyboardEvent,
  hasUnsavedProgress,
  getSectorStatus,
  formatReadiness
} from '../lib/scenario_helpers.ts';

import {
  SECTORS,
  SECTOR_MAP,
  getSectorConfig
} from '../lib/sectors.ts';

test('SECTORS configuration contains all 7 required threat sectors', () => {
  assert.equal(SECTORS.length, 7);
  const channels = SECTORS.map(s => s.channel);
  assert.deepEqual(channels, [
    'voice_phone',
    'email',
    'slack_teams',
    'qr_code',
    'cloud_oauth',
    'sms_push',
    'physical_media'
  ]);
});

test('getSectorConfig resolves known and fallback channels correctly', () => {
  const oauth = getSectorConfig('cloud_oauth');
  assert.equal(oauth.label, 'Cloud & OAuth');
  assert.equal(oauth.channel, 'cloud_oauth');

  const voice = getSectorConfig('voice_phone');
  assert.equal(voice.label, 'Voice & Vishing');
  assert.equal(voice.recommendedSituation, 'Voice Intercept');

  // Unknown channel falls back safely
  const fallback = getSectorConfig('unknown_channel_xyz');
  assert.ok(fallback);
  assert.equal(fallback.channel, 'cloud_oauth');
});

test('isInputElement identifies form and editable controls', () => {
  assert.equal(isInputElement(null), false);
  assert.equal(isInputElement({}), false);
  assert.equal(isInputElement({ tagName: 'DIV' }), false);
  assert.equal(isInputElement({ tagName: 'INPUT' }), true);
  assert.equal(isInputElement({ tagName: 'TEXTAREA' }), true);
  assert.equal(isInputElement({ tagName: 'SELECT' }), true);
  assert.equal(isInputElement({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(
    isInputElement({ tagName: 'DIV', getAttribute: (attr) => (attr === 'contenteditable' ? 'true' : null) }),
    true
  );
});

test('shouldIgnoreKeyboardEvent enforces strict guards', () => {
  // Normal clean keypress should NOT be ignored
  assert.equal(shouldIgnoreKeyboardEvent({ target: { tagName: 'BUTTON' } }), false);

  // Repeating event must be ignored
  assert.equal(shouldIgnoreKeyboardEvent({ repeat: true }), true);

  // Modifier keys must be ignored
  assert.equal(shouldIgnoreKeyboardEvent({ ctrlKey: true }), true);
  assert.equal(shouldIgnoreKeyboardEvent({ metaKey: true }), true);
  assert.equal(shouldIgnoreKeyboardEvent({ altKey: true }), true);

  // IME composition must be ignored
  assert.equal(shouldIgnoreKeyboardEvent({ isComposing: true }), true);

  // Input / Textarea focus must be ignored
  assert.equal(shouldIgnoreKeyboardEvent({ target: { tagName: 'INPUT' } }), true);
  assert.equal(shouldIgnoreKeyboardEvent({ target: { tagName: 'TEXTAREA' } }), true);
  assert.equal(shouldIgnoreKeyboardEvent({ target: { tagName: 'DIV', isContentEditable: true } }), true);
});

test('hasUnsavedProgress accurately detects active decision progress', () => {
  // INTRO and OBSERVE states are safe
  assert.equal(hasUnsavedProgress('INTRO', null, ''), false);
  assert.equal(hasUnsavedProgress('OBSERVE', null, ''), false);

  // DECIDE without choice selected is safe
  assert.equal(hasUnsavedProgress('DECIDE', null, ''), false);

  // DECIDE with a choice selected MUST be protected
  assert.equal(hasUnsavedProgress('DECIDE', 'Deny access and report', ''), true);

  // REASONING state MUST be protected
  assert.equal(hasUnsavedProgress('REASONING', 'Deny access and report', ''), true);
  assert.equal(hasUnsavedProgress('REASONING', 'Deny access and report', 'I checked the unverified publisher'), true);
});

test('getSectorStatus calculates status badges with semantic priority', () => {
  // ACTIVE always wins if channel matches activeChannel
  assert.equal(getSectorStatus('cloud_oauth', 'cloud_oauth', false, 95), 'ACTIVE');
  assert.equal(getSectorStatus('voice_phone', 'voice_phone', true, 20), 'ACTIVE');

  // PRIORITY wins for inactive priority sectors
  assert.equal(getSectorStatus('voice_phone', 'cloud_oauth', true, 40), 'PRIORITY');

  // MASTERED for score >= 80
  assert.equal(getSectorStatus('email', 'cloud_oauth', false, 85), 'MASTERED');

  // WEAK for score < 40 and > 0
  assert.equal(getSectorStatus('slack_teams', 'cloud_oauth', false, 35), 'WEAK');

  // NEW for score == 0
  assert.equal(getSectorStatus('physical_media', 'cloud_oauth', false, 0), 'NEW');
});

test('formatReadiness bounds readiness score within 0 to 100', () => {
  assert.equal(formatReadiness(74), 74);
  assert.equal(formatReadiness(82.6), 83);
  assert.equal(formatReadiness(150), 100);
  assert.equal(formatReadiness(-10), 0);
  assert.equal(formatReadiness(null), 74);
  assert.equal(formatReadiness(undefined), 74);
  assert.equal(formatReadiness(NaN), 74);
});
