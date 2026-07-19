import React from 'react';

export default function SessionSidebar({ sessions, activeSessionId, onSelectSession, onNewSession, onDeleteSession, isLoading }) {
  return (
    <div style={{
      width: '250px',
      borderRight: '1px solid #ddd',
      padding: '10px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <button
        onClick={onNewSession}
        style={{
          padding: '8px',
          borderRadius: '6px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        + New Chat
      </button>
      {isLoading && <p style={{ color: '#999', fontSize: '13px' }}>Loading...</p>}
      {sessions.map(session => (
        <div
          key={session.id}
          onClick={() => onSelectSession(session.id)}
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: session.id === activeSessionId ? '#e8f0fe' : 'transparent',
            border: session.id === activeSessionId ? '1px solid #007bff' : '1px solid transparent'
          }}
        >
          {/*
            Row content and the delete button are split into a flex row so the
            button pins to the right edge without affecting the title/date
            stack's own layout. The button is always visible (not hover-only)
            since hover has no equivalent on touch devices.
          */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 500,
                fontSize: '14px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              }}>
                {session.title}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </div>
            {/*
              stopPropagation prevents this click from bubbling to the row's
              onClick (onSelectSession) — without it, deleting a session would
              also select it right before it disappears from the list.
            */}
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
              aria-label="Delete conversation"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#c00', fontSize: '13px' }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
