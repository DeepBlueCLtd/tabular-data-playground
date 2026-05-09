import { useCallback, useState } from 'react';

const STORAGE_KEY = 'landing-seen';

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // localStorage unavailable (private mode, quota, etc).
    return false;
  }
}

function writeSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // No-op: session-only fallback per FR-006.
  }
}

export interface LandingState {
  /** True iff the landing page should be hidden right now. */
  hidden: boolean;
  /** Mark the landing page seen and hide it (also persists when possible). */
  markSeen: () => void;
  /** Re-show the landing page from the IDE chrome ("What is this?"). */
  reshow: () => void;
}

export function useLandingState(): LandingState {
  const [seenInSession, setSeenInSession] = useState<boolean>(() => readSeen());
  const [reshowing, setReshowing] = useState<boolean>(false);

  const markSeen = useCallback(() => {
    writeSeen();
    setSeenInSession(true);
    setReshowing(false);
  }, []);

  const reshow = useCallback(() => {
    setReshowing(true);
  }, []);

  const hidden = seenInSession && !reshowing;
  return { hidden, markSeen, reshow };
}
