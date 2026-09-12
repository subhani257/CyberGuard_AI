/**
 * Pure helper functions for the scenario workflow, keyboard guards,
 * and unsaved progress detection.
 */

export function isInputElement(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as HTMLElement;
  const tagName = el.tagName ? el.tagName.toLowerCase() : '';
  if (['input', 'textarea', 'select'].includes(tagName)) return true;
  if (el.isContentEditable) return true;
  if (el.getAttribute && el.getAttribute('contenteditable') === 'true') return true;
  return false;
}

export function shouldIgnoreKeyboardEvent(e: {
  target?: EventTarget | null;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
  repeat?: boolean;
}): boolean {
  if (e.repeat) return true;
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  if (e.isComposing) return true;
  if (isInputElement(e.target ?? null)) return true;
  return false;
}

export function hasUnsavedProgress(
  currentState: string,
  selectedChoice: string | null,
  reasoning: string
): boolean {
  // If user selected a choice during DECIDE, it's unsaved progress
  if (currentState === 'DECIDE' && selectedChoice !== null) {
    return true;
  }
  // If user is in REASONING state
  if (currentState === 'REASONING') {
    return true;
  }
  return false;
}

export type SectorStatusType = 'ACTIVE' | 'PRIORITY' | 'MASTERED' | 'WEAK' | 'NEW';

export function getSectorStatus(
  channel: string,
  activeChannel: string,
  isPriority: boolean,
  score: number
): SectorStatusType {
  if (channel === activeChannel) return 'ACTIVE';
  if (isPriority) return 'PRIORITY';
  if (score >= 80) return 'MASTERED';
  if (score > 0 && score < 40) return 'WEAK';
  return 'NEW';
}

export function formatReadiness(readiness?: number | null): number {
  if (typeof readiness !== 'number' || isNaN(readiness)) return 74;
  return Math.max(0, Math.min(100, Math.round(readiness)));
}
