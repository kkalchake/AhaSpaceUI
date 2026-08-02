import React from 'react';
import Spinner from './Spinner';
import './AsyncButton.css';

/*
 * `disabled` and `aria-disabled` are both set, deliberately overlapping:
 * native `disabled` is what actually blocks the click and is what every
 * screen reader already announces, but requirement 5 calls for
 * `aria-disabled` explicitly, so it's emitted too rather than relying on the
 * native attribute to imply it.
 *
 * `...rest` carries through whatever the caller already had on its
 * `<button>` (type, className, onClick, form, etc.) - this component only
 * adds the pending behavior on top, it doesn't replace the button's own API.
 */
export default function AsyncButton({ isPending, pendingLabel, disabled, children, className, ...rest }) {
  // Boolean(...) matters here, not just `isPending || disabled`: when
  // neither prop is passed (disabled is undefined, isPending is false),
  // the bare `||` expression evaluates to `undefined`, and React omits an
  // attribute entirely when its value is undefined - so aria-disabled would
  // silently disappear from the DOM instead of rendering "false".
  const isBlocked = Boolean(isPending || disabled);

  return (
    <button
      className={className ? `async-button ${className}` : 'async-button'}
      disabled={isBlocked}
      aria-disabled={isBlocked}
      aria-busy={isPending}
      {...rest}
    >
      {isPending ? (
        <>
          <Spinner /> {pendingLabel ?? 'Loading…'}
        </>
      ) : (
        children
      )}
    </button>
  );
}
