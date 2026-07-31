import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatToolbar from './ChatToolbar';
import MessageBubble, { ThinkingIndicator } from './MessageBubble';
import SignInPromptModal from './SignInPromptModal';
import { API_BASE_URL } from '../config';
import './SectionAssistantPanel.css';

/*
 * SectionAssistantPanel reuses Chat.jsx's fetch/send/session-switch logic,
 * but scopes every request to a single course section instead of the
 * account-wide /api/chat endpoints. courseId/phaseId/sectionId are passed in
 * as props (rather than read from useParams here) so this component stays a
 * plain, reusable panel and SectionView owns the routing concerns.
 *
 * This component is only ever mounted inside SectionView, which is what
 * satisfies the "assistant appears only on a section content page"
 * requirement — there's no separate route that renders it standalone.
 */
export default function SectionAssistantPanel({ courseId, phaseId, sectionId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const { auth, isAuthenticated } = useAuth();

  const basePath = `${API_BASE_URL}/api/courses/${courseId}/phases/${phaseId}/sections/${sectionId}/chat`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Skip the session-history fetch entirely for logged-out visitors - it
    // would otherwise fire with `Bearer undefined` and get a guaranteed 403.
    if (!isAuthenticated) return;
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, courseId, phaseId, sectionId]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch(`${basePath}/sessions`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      // Non-critical: sidebar stays empty if fetch fails
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    setError(null);
    try {
      const res = await fetch(`${basePath}/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessionId(data.id);
        setMessages(data.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          model: m.model,
          timestamp: m.createdAt
        })));
      } else {
        setError('Failed to load session.');
      }
    } catch (err) {
      setError('Network error loading session.');
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  };

  /*
   * Same reset-and-refresh pattern as Chat.jsx's handleDeleteSession: reuse
   * handleNewSession for the active-session reset instead of duplicating it,
   * and always re-fetch the list afterward so the sidebar drops the deleted
   * row. Uses basePath (already scoped to this course/section) rather than
   * the global /api/chat/sessions endpoint Chat.jsx hits.
   */
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      const res = await fetch(`${basePath}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) {
        if (sessionId === activeSessionId) handleNewSession();
        loadSessions();
      } else {
        setError('Failed to delete conversation.');
      }
    } catch (err) {
      setError('Network error deleting conversation.');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    /*
     * This is a UX nudge, not a security boundary: it only stops the panel
     * from firing a request that would fail anyway (no token to send).
     * SectionChatController on the backend, unchanged this week, remains
     * the actual enforcement point for every chat endpoint.
     */
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(basePath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        // sessionId tells the backend which session to append to; null creates a new one
        body: JSON.stringify({ message: userMessage.content, sessionId: activeSessionId })
      });

      if (response.status === 200) {
        const data = await response.json();
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          model: data.model,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        setActiveSessionId(data.sessionId);
        loadSessions();
      } else if (response.status === 401 || response.status === 403) {
        setError('Session expired. Please log in again.');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to get AI response');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-assistant-main">
      <h2>Section Assistant</h2>
      <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '20px' }}>
        Ask questions about this section
      </p>

      {/* Session history is meaningless without an account to attach it to. */}
      {isAuthenticated && (
        <ChatToolbar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionsLoading}
        />
      )}

      {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div
          className="chat-message-list"
          role="log"
          aria-live="polite"
          aria-label="Section assistant messages"
        >
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '50px' }}>
              Ask a question about this section below.
            </p>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                model={msg.model}
                timestamp={msg.timestamp}
              />
            ))
          )}
          {isLoading && <ThinkingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            aria-label="Type your message"
            disabled={isLoading}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: isLoading ? 'var(--border)' : 'var(--accent)',
              color: '#fff',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>

        <SignInPromptModal isOpen={showSignInPrompt} onClose={() => setShowSignInPrompt(false)} />
    </div>
  );
}
