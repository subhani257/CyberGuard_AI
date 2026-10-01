import test from 'node:test';
import assert from 'node:assert/strict';

import { getHumanReviewCopy, getHumanReviewStatus } from '../lib/review_status.ts';

test('human review status is hidden when no review is required', () => {
  assert.equal(getHumanReviewStatus(false, null), null);
  assert.equal(getHumanReviewStatus(undefined, undefined), null);
});

test('pending review is shown while the backend flag is active', () => {
  const status = getHumanReviewStatus(true, null);
  assert.equal(status, 'pending');
  assert.match(getHumanReviewCopy(status).message, /provisional/i);
});

test('admin verdict takes precedence over a stale pending flag', () => {
  assert.equal(getHumanReviewStatus(true, 'confirmed'), 'confirmed');
  assert.equal(getHumanReviewStatus(true, 'overridden'), 'updated');
});

test('review copy clearly distinguishes confirmed and changed results', () => {
  assert.equal(getHumanReviewCopy('confirmed').label, 'Review confirmed');
  assert.equal(getHumanReviewCopy('updated').label, 'Result updated after review');
});
