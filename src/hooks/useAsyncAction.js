import { useState, useCallback } from 'react';
import { useSlowRequestTracker } from '../context/SlowRequestContext';

/*
 * `isPending` is useState-only (no useRef): the whole point is that its
 * change re-renders the calling component (to show/hide a spinner), and a
 * ref update alone wouldn't do that. The tradeoff this creates is that
 * `run`'s identity changes every time `isPending` toggles (see the dep array
 * below) - callers must never put `run` itself in a useEffect dependency
 * array, or the effect refires on every toggle and loops.
 *
 * `guard` controls whether a call while already pending is dropped
 * (duplicate-submit protection for buttons) or allowed through (route pages
 * whose effect re-runs on a param change need the newer fetch to win, not be
 * silently swallowed by an in-flight older one).
 */
export function useAsyncAction({ initialPending = false, guard = true } = {}) {
  const [isPending, setIsPending] = useState(initialPending);
  const { beginRequest, endRequest } = useSlowRequestTracker();

  const run = useCallback(async (asyncFn) => {
    if (guard && isPending) return;

    setIsPending(true);
    beginRequest();
    try {
      return await asyncFn();
    } finally {
      // finally (not a mounted-ref check) is what guarantees endRequest()
      // fires even if the component unmounted mid-flight - otherwise
      // pendingCount on SlowRequestContext could leak upward forever.
      setIsPending(false);
      endRequest();
    }
  }, [guard, isPending, beginRequest, endRequest]);

  return { isPending, run };
}
