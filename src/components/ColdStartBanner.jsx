import React, { useContext } from 'react';
import { SlowRequestContext } from '../context/SlowRequestContext';
import Spinner from './Spinner';
import './ColdStartBanner.css';

/*
 * Reads the context directly (not useSlowRequestTracker) because this is the
 * one consumer that legitimately needs to know "is there a provider at all" -
 * every other consumer just wants a callable beginRequest/endRequest pair
 * and is fine with the no-op fallback. Rendered inside SlowRequestProvider
 * by App.jsx, so context is non-null in the app itself; this only stays
 * null in a test that mounts the banner standalone.
 *
 * Cold start and a slow network are indistinguishable from the client, so
 * the copy intentionally covers both rather than claiming to diagnose which
 * one is happening.
 */
export default function ColdStartBanner() {
  const context = useContext(SlowRequestContext);
  const isSlow = context?.isSlow ?? false;

  if (!isSlow) return null;

  return (
    <div className="cold-start-banner" role="status" aria-live="polite">
      <Spinner />
      <span>Waking up the server — this can take a few seconds on first load.</span>
    </div>
  );
}
