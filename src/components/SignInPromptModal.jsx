import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SignInPromptModal.css';

/*
 * Purely presentational gate dialog. This is now the only route back to
 * /login or /register from an unauthenticated section page, since NavBar no
 * longer renders Sign In / Register links once a visitor is inside the
 * public course pages.
 */
export default function SignInPromptModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Remember what had focus before opening so it can be restored on close.
    triggerRef.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="sign-in-prompt-backdrop"
      onClick={onClose}
    >
      <div
        className="sign-in-prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-prompt-heading"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="sign-in-prompt-heading">Sign in to continue</h2>
        <p>Sign in to chat with the AI about this section - or create a free account</p>
        <div className="sign-in-prompt-actions">
          <Link to="/login" className="btn-primary" onClick={onClose}>Sign In</Link>
          <Link to="/register" className="btn-secondary" onClick={onClose}>Register</Link>
        </div>
      </div>
    </div>
  );
}
