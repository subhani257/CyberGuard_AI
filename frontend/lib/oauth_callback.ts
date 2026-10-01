import { decodeJwtClaims, isAccessTokenValid, type JwtClaims } from './auth_session.ts';

export interface OAuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company: string;
  access_role: 'learner';
  avatar_url: string;
}

export type OAuthCallbackResult =
  | { kind: 'none' }
  | { kind: 'error'; message: string }
  | { kind: 'token'; accessToken: string; claims: JwtClaims; user: OAuthUser };

type InitializationFlag = { current: boolean };

export function beginSingleInitialization(flag: InitializationFlag): boolean {
  if (flag.current) return false;
  flag.current = true;
  return true;
}

function cleanText(value: unknown, fallback: string, maxLength = 160): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSource(raw: string, allowLegacyToken: boolean, nowSeconds: number): OAuthCallbackResult {
  if (!raw) return { kind: 'none' };
  const params = new URLSearchParams(raw.replace(/^[?#]/, ''));
  const providerError = params.get('error_description') || params.get('error');
  if (providerError) {
    return { kind: 'error', message: cleanText(providerError, 'Google authentication was cancelled.', 300) };
  }

  const candidates = params.getAll('access_token');
  if (allowLegacyToken) candidates.push(...params.getAll('token'));
  const distinctTokens = Array.from(new Set(candidates.filter(Boolean)));
  if (distinctTokens.length === 0) return { kind: 'none' };
  if (distinctTokens.length !== 1) {
    return { kind: 'error', message: 'The Google callback contained conflicting access tokens.' };
  }

  const accessToken = distinctTokens[0];
  if (!isAccessTokenValid(accessToken, nowSeconds)) {
    return { kind: 'error', message: 'The Google session is invalid or expired. Please sign in again.' };
  }

  const claims = decodeJwtClaims(accessToken);
  if (!claims) return { kind: 'error', message: 'The Google session token is malformed.' };

  const id = cleanText(claims.sub || claims.id, '', 128);
  const email = cleanText(claims.email, '', 254).toLowerCase();
  if (!id || !email || !email.includes('@')) {
    return { kind: 'error', message: 'The Google account is missing a valid identity or email address.' };
  }

  const userMetadata = isRecord(claims.user_metadata) ? claims.user_metadata : {};
  const emailName = email.split('@')[0] || 'Team Member';
  const user: OAuthUser = {
    id,
    email,
    full_name: cleanText(userMetadata.full_name || userMetadata.name, emailName, 100),
    role: cleanText(userMetadata.role, 'Employee', 100),
    company: cleanText(userMetadata.company, 'Your Organization', 150),
    // Authorization is assigned by the API. Never trust a role supplied by an
    // external identity token in browser code.
    access_role: 'learner',
    avatar_url: cleanText(userMetadata.avatar_url || userMetadata.picture, '', 2_048),
  };

  return { kind: 'token', accessToken, claims, user };
}

export function parseOAuthCallback(
  hash: string,
  search = '',
  includeQueryFallback = false,
  nowSeconds = Math.floor(Date.now() / 1000),
): OAuthCallbackResult {
  const fragmentResult = parseSource(hash, false, nowSeconds);
  if (fragmentResult.kind !== 'none') return fragmentResult;
  return includeQueryFallback ? parseSource(search, true, nowSeconds) : fragmentResult;
}
