import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearAuthSession,
  decodeJwtClaims,
  isAccessTokenValid,
  readAuthSession,
  saveAuthSession,
} from '../lib/auth_session.ts';

function createToken(claims, header = { alg: 'HS256', typ: 'JWT' }) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode(header)}.${encode(claims)}.test-signature`;
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

test('decodeJwtClaims supports base64url JWT payloads and rejects non-object payloads', () => {
  const token = createToken({ sub: 'user-1', exp: 2_000 });
  assert.deepEqual(decodeJwtClaims(token), { sub: 'user-1', exp: 2_000 });
  assert.equal(decodeJwtClaims(createToken({ sub: '用户', exp: 2_000 }))?.sub, '用户');
  assert.equal(decodeJwtClaims('header.payload'), null);
  assert.equal(decodeJwtClaims(`${Buffer.from('{}').toString('base64url')}.${Buffer.from('[]').toString('base64url')}.sig`), null);
  assert.equal(decodeJwtClaims('a.%%%invalid%%%.c'), null);
});

test('isAccessTokenValid rejects missing, malformed, expired, near-expiry, and identity-less tokens', () => {
  assert.equal(isAccessTokenValid(null, 1_000), false);
  assert.equal(isAccessTokenValid('not-a-jwt', 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 2_000 }, { alg: 'none' }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 999 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 1_020 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 1_030 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 1_031 }), 1_000), true);
  assert.equal(isAccessTokenValid(createToken({ exp: 2_000 }), 1_000), false);
});

test('isAccessTokenValid enforces numeric exp, iat, nbf, and safe clock arguments', () => {
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', iat: 1_031, exp: 2_000 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', nbf: 1_031, exp: 2_000 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', iat: 'now', exp: 2_000 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', nbf: 'later', exp: 2_000 }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: '2000' }), 1_000), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 2_000 }), Number.NaN), false);
  assert.equal(isAccessTokenValid(createToken({ sub: 'user-1', exp: 2_000 }), 1_000, -1), false);
  assert.equal(isAccessTokenValid(createToken({ email: 'user@example.com', nbf: 1_030, exp: 2_000 }), 1_000), true);
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

  const malformedUser = createStorage({ cyberguard_token: validToken, cyberguard_user: '{bad json' });
  assert.equal(readAuthSession(malformedUser, 1_000), null);

  const arrayUser = createStorage({ cyberguard_token: validToken, cyberguard_user: '[]' });
  assert.equal(readAuthSession(arrayUser, 1_000), null);

  const mismatchedUser = createStorage({
    cyberguard_token: validToken,
    cyberguard_user: JSON.stringify({ id: 'another-user' }),
  });
  assert.equal(readAuthSession(mismatchedUser, 1_000), null);
});

test('saveAuthSession validates the token, user, and matching identity', () => {
  const storage = createStorage();
  assert.throws(
    () => saveAuthSession(storage, createToken({ sub: 'user-1', exp: 1 }), { id: 'user-1' }),
    /invalid or expired/i,
  );

  const validToken = createToken({
    sub: 'user-1',
    email: 'user@example.com',
    exp: Math.floor(Date.now() / 1000) + 3_600,
  });
  assert.throws(() => saveAuthSession(storage, validToken, {}), /invalid user profile/i);
  assert.throws(() => saveAuthSession(storage, validToken, { id: 'user-2' }), /does not match/i);
  assert.throws(() => saveAuthSession(storage, validToken, { id: 'user-1', email: 'other@example.com' }), /does not match/i);

  saveAuthSession(storage, validToken, { id: 'user-1', email: 'USER@example.com' });
  assert.equal(readAuthSession(storage)?.user.id, 'user-1');
});

test('saveAuthSession rolls back partial writes when browser storage fails', () => {
  const values = new Map([['cyberguard_current_decision', 'pending']]);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      if (key === 'cyberguard_token') throw new Error('quota exceeded');
      values.set(key, value);
    },
    removeItem: key => values.delete(key),
  };
  const token = createToken({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3_600 });
  assert.throws(() => saveAuthSession(storage, token, { id: 'user-1' }), /could not be saved/i);
  assert.deepEqual(Object.fromEntries(values), {});
});

test('readAuthSession tolerates unavailable browser storage', () => {
  const storage = {
    getItem: () => { throw new Error('storage disabled'); },
    setItem: () => {},
    removeItem: () => {},
  };
  assert.equal(readAuthSession(storage), null);
});

test('clearAuthSession removes auth state but preserves onboarding preferences', () => {
  const storage = createStorage({
    cyberguard_token: 'token',
    cyberguard_user: '{}',
    cyberguard_current_decision: 'pending',
    cyberguard_onboarded: '1',
    cyberguard_tour_completed: '1',
  });
  clearAuthSession(storage);
  assert.deepEqual(storage.snapshot(), {
    cyberguard_onboarded: '1',
    cyberguard_tour_completed: '1',
  });
});
