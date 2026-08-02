import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export const SlowRequestContext = createContext(null);

/*
 * Single app-wide cold-start detector instead of one timer per loading
 * component. `pendingCount` tracks how many requests are in flight at once
 * (multiple pages/panels can be loading simultaneously); `isSlow` only flips
 * on once *any* request has been outstanding for 3s straight, and flips off
 * the instant the count drains back to zero - so the banner reflects "is the
 * app currently waiting on something slow", not any single request's timing.
 *
 * The setTimeout lives in this effect, not in useAsyncAction, so that N
 * concurrent requests share exactly one timer instead of racing N of them
 * (which would just re-trigger the same setIsSlow(true) redundantly, but
 * still means N timers to clean up instead of one).
 */
export function SlowRequestProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSlow, setIsSlow] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (pendingCount > 0) {
      if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => setIsSlow(true), 3000);
      }
    } else {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsSlow(false);
    }
  }, [pendingCount]);

  const beginRequest = useCallback(() => {
    setPendingCount(prev => prev + 1);
  }, []);

  const endRequest = useCallback(() => {
    setPendingCount(prev => Math.max(0, prev - 1));
  }, []);

  const value = { pendingCount, isSlow, beginRequest, endRequest };

  return <SlowRequestContext.Provider value={value}>{children}</SlowRequestContext.Provider>;
}

const NOOP_TRACKER = { beginRequest: () => {}, endRequest: () => {} };

/*
 * Unlike useAuth(), this does NOT throw when rendered outside a provider.
 * Every existing page test (CourseList, CoursePhases, PhaseSections,
 * SectionView, Chat, SectionAssistantPanel) renders its component directly
 * without wrapping it in SlowRequestProvider, so a throw here would break
 * all of them. Falling back to a stable no-op pair keeps useAsyncAction
 * callable in that context with zero behavior change beyond "no banner."
 */
export function useSlowRequestTracker() {
  const context = useContext(SlowRequestContext);
  return context ?? NOOP_TRACKER;
}
