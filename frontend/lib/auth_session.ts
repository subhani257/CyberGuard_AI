export interface JwtClaims {
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

export interface StoredAuthSession {
  token: string;
  user: Record<string, unknown>;
  claims: JwtClaims;
}

const AUTH_TOKEN_KEY = 'cyberguard_token';
const AUTH_USER_KEY = 'cyberguard_user';
const ACTIVE_DECISION_KEY = 'cyberguard_current_decision';

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

export function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const claims = JSON.parse(decodeBase64Url(parts[1]));
    return claims && typeof claims === 'object' ? claims as JwtClaims : null;
  } catch {
    return null;
  }
}

export function isAccessTokenValid(
  token: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
  clockSkewSeconds = 30,
): boolean {
  if (!token) return false;
  const claims = decodeJwtClaims(token);
  if (!claims || typeof claims.exp !== 'number') return false;
  if (claims.exp <= nowSeconds + clockSkewSeconds) return false;
  if (typeof claims.iat === 'number' && claims.iat > nowSeconds + clockSkewSeconds) return false;
  return true;
}

export function clearAuthSession(storage: Storage): void {
  storage.removeItem(AUTH_TOKEN_KEY);
  storage.removeItem(AUTH_USER_KEY);
  storage.removeItem(ACTIVE_DECISION_KEY);
}

export function saveAuthSession(storage: Storage, token: string, user: Record<string, unknown>): void {
  if (!isAccessTokenValid(token)) {
    throw new Error('Authentication service returned an invalid or expired access token.');
  }
  storage.setItem(AUTH_TOKEN_KEY, token);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function readAuthSession(
  storage: Storage,
  nowSeconds = Math.floor(Date.now() / 1000),
): StoredAuthSession | null {
  const token = storage.getItem(AUTH_TOKEN_KEY);
  const rawUser = storage.getItem(AUTH_USER_KEY);
  if (!isAccessTokenValid(token, nowSeconds) || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    const claims = decodeJwtClaims(token as string);
    if (!user || typeof user !== 'object' || (!user.id && !user.email) || !claims) return null;
    return { token: token as string, user, claims };
  } catch {
    return null;
  }
}
