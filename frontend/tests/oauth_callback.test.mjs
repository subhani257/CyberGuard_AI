import test from 'node:test';
import assert from 'node:assert/strict';

import {
  beginSingleInitialization,
  parseOAuthCallback,
} from '../lib/oauth_callback.ts';

function createToken(claims) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.test-signature`;
}

const now = 1_000;

test('beginSingleInitialization permits exactly one Strict Mode effect run', () => {
  const flag = { current: false };
  assert.equal(beginSingleInitialization(flag), true);
  assert.equal(flag.current, true);
  assert.equal(beginSingleInitialization(flag), false);
});

test('parseOAuthCallback returns none when no callback values are present', () => {
  assert.deepEqual(parseOAuthCallback('', '', false, now), { kind: 'none' });
  assert.deepEqual(parseOAuthCallback('', '?tab=arena', true, now), { kind: 'none' });
});

test('parseOAuthCallback validates and normalizes a Supabase fragment', () => {
  const token = createToken({
    sub: 'google-user-1',
    email: 'Person@Example.com',
    exp: 2_000,
    user_metadata: {
      full_name: '  Alex Turner  ',
      role: 'Finance Manager',
      company: 'NovaTech',
      avatar_url: 'https://example.com/avatar.png',
    },
    app_metadata: { access_role: 'admin' },
  });
  const result = parseOAuthCallback(`#access_token=${encodeURIComponent(token)}`, '', false, now);
  assert.equal(result.kind, 'token');
  assert.equal(result.accessToken, token);
  assert.deepEqual(result.user, {
    id: 'google-user-1',
    email: 'person@example.com',
    full_name: 'Alex Turner',
    role: 'Finance Manager',
    company: 'NovaTech',
    access_role: 'learner',
    avatar_url: 'https://example.com/avatar.png',
  });
});

test('parseOAuthCallback supports onboarding query fallback but dashboard does not', () => {
  const token = createToken({ sub: 'user-1', email: 'user@example.com', exp: 2_000 });
  assert.equal(parseOAuthCallback('', `?token=${encodeURIComponent(token)}`, false, now).kind, 'none');
  assert.equal(parseOAuthCallback('', `?token=${encodeURIComponent(token)}`, true, now).kind, 'token');
});

test('parseOAuthCallback gives provider errors priority and decodes their message', () => {
  const result = parseOAuthCallback('#error=access_denied&error_description=User%20cancelled', '', false, now);
  assert.deepEqual(result, { kind: 'error', message: 'User cancelled' });
});

test('parseOAuthCallback rejects conflicting, expired, and incomplete tokens', () => {
  const validA = createToken({ sub: 'a', email: 'a@example.com', exp: 2_000 });
  const validB = createToken({ sub: 'b', email: 'b@example.com', exp: 2_000 });
  assert.match(
    parseOAuthCallback(`#access_token=${validA}&access_token=${validB}`, '', false, now).message,
    /conflicting/i,
  );
  assert.match(
    parseOAuthCallback(`#access_token=${createToken({ sub: 'a', email: 'a@example.com', exp: 999 })}`, '', false, now).message,
    /invalid or expired/i,
  );
  assert.match(
    parseOAuthCallback(`#access_token=${createToken({ sub: 'a', exp: 2_000 })}`, '', false, now).message,
    /valid identity or email/i,
  );
});

test('fragment callback wins over query fallback to avoid ambiguous token sources', () => {
  const fragmentToken = createToken({ sub: 'fragment', email: 'fragment@example.com', exp: 2_000 });
  const queryToken = createToken({ sub: 'query', email: 'query@example.com', exp: 2_000 });
  const result = parseOAuthCallback(
    `#access_token=${fragmentToken}`,
    `?access_token=${queryToken}`,
    true,
    now,
  );
  assert.equal(result.kind, 'token');
  assert.equal(result.user.id, 'fragment');
});
