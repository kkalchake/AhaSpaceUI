import React, { useState, useRef, useEffect } from 'react';
import './ChatToolbar.css';

/*
 * Replaces the old fixed-width SessionSidebar column. "New Chat" and the
 * conversation history now live in one toolbar above the message list:
 * history opens as a dropdown instead of taking up a permanent column,
 * which is also what frees up the layout to be a clean two-pane
 * (course content | chat) drag-resize in SectionView instead of three.
 *
 * The history panel is always mounted (visibility toggled by the `open`
 * class, not conditional rendering) so its rows stay queryable in tests
 * without needing the dropdown to be open first.
 */
export default function ChatToolbar({ sessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="chat-toolbar" ref={containerRef}>
      <button className="btn-new-chat" onClick={onNewSession}>
        + New Chat
      </button>
      <div className="history-dropdown">
        <button
          className="history-toggle"
          onClick={() => setIsOpen(prev => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          History{sessions.length > 0 ? ` (${sessions.length})` : ''} <span aria-hidden="true">▾</span>
        </button>
        <div className={`history-panel ${isOpen ? 'open' : ''}`} role="listbox" aria-label="Conversation history">
          {isLoading && <p className="history-empty">Loading...</p>}
          {!isLoading && sessions.length === 0 && <p className="history-empty">No conversations yet</p>}
          {sessions.map(session => (
            <div
              key={session.id}
              role="option"
              aria-selected={session.id === activeSessionId}
              onClick={() => { onSelectSession(session.id); setIsOpen(false); }}
              className={`history-row ${session.id === activeSessionId ? 'active' : ''}`}
            >
              <div style={{ minWidth: 0 }}>
                <div className="history-title">{session.title}</div>
                <div className="history-date">{new Date(session.createdAt).toLocaleDateString()}</div>
              </div>
              {/*
                stopPropagation prevents this click from bubbling to the row's
                onClick (onSelectSession) — without it, deleting a session
                would also select it right before it disappears from the list.
              */}
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                aria-label="Delete conversation"
                className="history-delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
