import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearAuthSession,
  decodeJwtClaims,
  isAccessTokenValid,
  readAuthSession,
  saveAuthSession,
} from '../lib/auth_session.ts';

function createToken(claims) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.test-signature`;
}

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  };
}

test('decodeJwtClaims supports base64url JWT payloads', () => {
  const token = createToken({ sub: 'user-1', exp: 2_000 });
  assert.deepEqual(decodeJwtClaims(token), { sub: 'user-1', exp: 2_000 });
});

test('isAccessTokenValid rejects missing, malformed, expired, and near-expiry tokens', () => {
  assert.equal(isAccessTokenValid(null, 1_000), false);
  assert.equal(isAccessTokenValid('not-a-jwt', 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ exp: 999 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ exp: 1_020 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ exp: 1_031 }), 1_000), true);
});

test('isAccessTokenValid rejects tokens issued too far in the future', () => {
  assert.equal(isAccessTokenValid(createToken({ iat: 1_031, exp: 2_000 }), 1_000), false);
});

test('stored auth session requires both a valid token and a valid user', () => {
  const validToken = createToken({ sub: 'user-1', exp: 2_000 });
  const complete = createStorage({
    cyberguard_token: validToken,
    cyberguard_user: JSON.stringify({ id: 'user-1', email: 'user@example.com' }),
  });
  assert.equal(readAuthSession(complete, 1_000)?.user.email, 'user@example.com');

  const missingToken = createStorage({ cyberguard_user: JSON.stringify({ id: 'user-1' }) });
  assert.equal(readAuthSession(missingToken, 1_000), null);
});

test('saveAuthSession refuses expired tokens and clearAuthSession removes auth state', () => {
  const storage = createStorage({ cyberguard_current_decision: 'pending' });
  assert.throws(
    () => saveAuthSession(storage, createToken({ exp: 1 }), { id: 'user-1' }),
    /invalid or expired/i,
  );

  const validToken = createToken({ exp: Math.floor(Date.now() / 1000) + 3_600 });
  saveAuthSession(storage, validToken, { id: 'user-1' });
  clearAuthSession(storage);
  assert.deepEqual(storage.snapshot(), {});
});
