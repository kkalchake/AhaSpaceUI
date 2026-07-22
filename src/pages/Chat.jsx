import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SessionSidebar from '../components/SessionSidebar';
import './Auth.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Track which session is active; null means a new conversation not yet saved to the backend
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { auth } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/chat/sessions', {
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
      const res = await fetch(`http://localhost:8080/api/chat/sessions/${sessionId}`, {
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
   * If the deleted session is the one currently open, reset to a blank
   * conversation via handleNewSession rather than duplicating that reset
   * logic here. loadSessions() re-fetches the list either way so the
   * sidebar drops the deleted row regardless of which session was active.
   */
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/chat/sessions/${sessionId}`, {
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
      const response = await fetch('http://localhost:8080/api/chat', {
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
    <div style={{ display: 'flex', height: '80vh', maxWidth: '1100px', margin: '0 auto' }}>
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isLoading={sessionsLoading}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        <h2>AI Chat</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: '20px' }}>
          Powered by Google Gemini
        </p>

        {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          backgroundColor: 'var(--bg)'
        }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '50px' }}>
              Start a conversation by sending a message below.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '15px',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    maxWidth: '70%',
                    padding: '10px 15px',
                    borderRadius: '15px',
                    backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--surface)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-h)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word'
                  }}
                >
                  {msg.content}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '5px' }}>
                  {msg.role === 'assistant' && msg.model && (
                    <span>{msg.model} • </span>
                  )}
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div style={{ textAlign: 'left', marginBottom: '15px' }}>
              <div style={{
                display: 'inline-block',
                padding: '10px 15px',
                borderRadius: '15px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--muted)'
              }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
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
      </div>
    </div>
  );
}
