import React from 'react';
import './Spinner.css';

/*
 * aria-hidden because the spinner never carries meaning on its own - every
 * place it's used sits next to text that already says what's happening
 * ("Signing in…", "Loading section…", the ColdStartBanner copy). Announcing
 * the spinner itself would just be visual noise read out twice.
 */
export default function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function LoadingState({ label }) {
  return (
    <div className="loading-state" role="status">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
