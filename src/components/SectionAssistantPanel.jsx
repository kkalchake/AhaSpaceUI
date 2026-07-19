import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useAuth } from '../context/AuthContext';
import SessionSidebar from './SessionSidebar';

/*
 * SectionAssistantPanel reuses Chat.jsx's fetch/send/session-switch logic,
 * but scopes every request to a single course section instead of the
 * account-wide /api/chat endpoints. courseId/sectionId are passed in as
 * props (rather than read from useParams here) so this component stays a
 * plain, reusable panel and SectionView owns the routing concerns.
 *
 * This component is only ever mounted inside SectionView, which is what
 * satisfies the "assistant appears only on a section content page"
 * requirement — there's no separate route that renders it standalone.
 */
export default function SectionAssistantPanel({ courseId, sectionId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { auth } = useAuth();

  const basePath = `http://localhost:8080/api/courses/${courseId}/sections/${sectionId}/chat`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session list on mount so the sidebar is populated immediately
  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, sectionId]);

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
        // Map backend message format to the local message format used by the render loop
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
        // Store the session id returned by the backend so subsequent messages continue this session
        setActiveSessionId(data.sessionId);
        // Refresh the sidebar to show the newly created or updated session
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
    <div style={{ display: 'flex', height: '100%' }}>
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        isLoading={sessionsLoading}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px', minWidth: 0 }}>
        <h2>Section Assistant</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Ask questions about this section
        </p>

        {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          backgroundColor: '#f9f9f9'
        }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
              Ask a question about this section below.
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
                    maxWidth: '85%',
                    padding: '10px 15px',
                    borderRadius: '15px',
                    backgroundColor: msg.role === 'user' ? '#007bff' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    border: msg.role === 'user' ? 'none' : '1px solid #ddd',
                    whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                    wordWrap: 'break-word',
                    textAlign: 'left'
                  }}
                >
                  {/*
                    User bubbles render as plain text: they store only the raw
                    question, so Markdown parsing would just be wasted work.
                    Assistant bubbles run through ReactMarkdown for formatting
                    parity with the lecture-notes panel (headings, math, etc.).
                  */}
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
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
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                color: '#666'
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
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: isLoading ? '#ccc' : '#007bff',
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
