export interface JwtClaims {
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  email?: string;
  [key: string]: unknown;
}

interface JwtHeader {
  alg?: string;
  typ?: string;
}

export interface StoredAuthSession {
  token: string;
  user: Record<string, unknown>;
  claims: JwtClaims;
}

export const AUTH_STORAGE_KEYS = {
  token: 'cyberguard_token',
  user: 'cyberguard_user',
  activeDecision: 'cyberguard_current_decision',
} as const;

type AuthStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeJwtHeader(token: string): JwtHeader | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(decodeBase64Url(parts[0]));
    return isRecord(header) ? header as JwtHeader : null;
  } catch {
    return null;
  }
}

export function decodeJwtClaims(token: string): JwtClaims | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const claims = JSON.parse(decodeBase64Url(parts[1]));
    return isRecord(claims) ? claims as JwtClaims : null;
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
  if (!Number.isFinite(nowSeconds) || !Number.isFinite(clockSkewSeconds) || clockSkewSeconds < 0) return false;
  const header = decodeJwtHeader(token);
  if (!header || !isNonEmptyString(header.alg) || header.alg.toLowerCase() === 'none') return false;
  const claims = decodeJwtClaims(token);
  if (!claims || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) return false;
  if (!isNonEmptyString(claims.sub) && !isNonEmptyString(claims.email)) return false;
  if (claims.exp <= nowSeconds + clockSkewSeconds) return false;
  if (claims.iat !== undefined && (typeof claims.iat !== 'number' || !Number.isFinite(claims.iat))) return false;
  if (typeof claims.iat === 'number' && claims.iat > nowSeconds + clockSkewSeconds) return false;
  if (claims.nbf !== undefined && (typeof claims.nbf !== 'number' || !Number.isFinite(claims.nbf))) return false;
  if (typeof claims.nbf === 'number' && claims.nbf > nowSeconds + clockSkewSeconds) return false;
  return true;
}

export function clearAuthSession(storage: AuthStorage): void {
  // Attempt every removal even if a browser storage implementation rejects one
  // operation. Logout must never leave the bearer token behind just because a
  // separate transient key could not be removed.
  for (const key of Object.values(AUTH_STORAGE_KEYS)) {
    try {
      storage.removeItem(key);
    } catch {
      // A disabled/quota-blocked storage area should not crash the UI.
    }
  }
}

function isValidStoredUser(user: unknown): user is Record<string, unknown> {
  if (!isRecord(user)) return false;
  return isNonEmptyString(user.id) || isNonEmptyString(user.email);
}

function sessionIdentitiesMatch(claims: JwtClaims, user: Record<string, unknown>): boolean {
  if (isNonEmptyString(claims.sub) && isNonEmptyString(user.id) && claims.sub !== user.id) return false;
  if (
    isNonEmptyString(claims.email)
    && isNonEmptyString(user.email)
    && claims.email.trim().toLowerCase() !== user.email.trim().toLowerCase()
  ) return false;
  return true;
}

export function saveAuthSession(storage: AuthStorage, token: string, user: Record<string, unknown>): void {
  if (!isAccessTokenValid(token)) {
    throw new Error('Authentication service returned an invalid or expired access token.');
  }
  if (!isValidStoredUser(user)) {
    throw new Error('Authentication service returned an invalid user profile.');
  }

  const claims = decodeJwtClaims(token) as JwtClaims;
  if (!sessionIdentitiesMatch(claims, user)) {
    throw new Error('Authentication token does not match the returned user profile.');
  }

  let serializedUser: string;
  try {
    serializedUser = JSON.stringify(user);
  } catch {
    throw new Error('Authentication user profile could not be stored.');
  }

  try {
    // The token is the commit marker and is deliberately written last. A
    // partially written user profile therefore cannot look authenticated.
    storage.setItem(AUTH_STORAGE_KEYS.user, serializedUser);
    storage.setItem(AUTH_STORAGE_KEYS.token, token);
  } catch {
    clearAuthSession(storage);
    throw new Error('Authentication session could not be saved in this browser.');
  }
}

export function readAuthSession(
  storage: AuthStorage,
  nowSeconds = Math.floor(Date.now() / 1000),
): StoredAuthSession | null {
  let token: string | null;
  let rawUser: string | null;
  try {
    token = storage.getItem(AUTH_STORAGE_KEYS.token);
    rawUser = storage.getItem(AUTH_STORAGE_KEYS.user);
  } catch {
    return null;
  }
  if (!isAccessTokenValid(token, nowSeconds) || !rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    const claims = decodeJwtClaims(token as string);
    if (!isValidStoredUser(user) || !claims || !sessionIdentitiesMatch(claims, user)) return null;
    return { token: token as string, user, claims };
  } catch {
    return null;
  }
}
