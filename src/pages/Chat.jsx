import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatToolbar from '../components/ChatToolbar';
import MessageBubble, { ThinkingIndicator } from '../components/MessageBubble';
import { API_BASE_URL } from '../config';
import './Auth.css';
import './Chat.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Track which session is active; null means a new conversation not yet saved to the backend
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isAskFocused, setIsAskFocused] = useState(false);
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
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
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
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
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
      const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
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
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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

  // Caption shows on focus OR while there's typed text - same pattern as
  // SectionAssistantPanel's assistant-ask-box.
  const captionVisible = isAskFocused || inputValue.trim().length > 0;

  return (
    <div className="chat-layout">
      <div className="chat-main">
        {/*
          Same cleanup as SectionAssistantPanel: "AI Chat" / "Powered by
          Google Gemini" / "Start a conversation by sending a message below."
          were three separate lines saying overlapping things. Down to one
          header plus one empty-state line - the "Powered by Google Gemini"
          attribution now lives in the ask box's caption below instead of
          its own paragraph up here.
        */}
        <h2 className="chat-heading">AI Chat</h2>

        <ChatToolbar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionsLoading}
        />

        {error && (
          <div className="error-banner" style={{ marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div
          className="chat-message-list"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 ? (
            <p className="assistant-empty-state">No messages yet — ask below.</p>
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

        <form className="assistant-ask" onSubmit={sendMessage}>
          <div className="assistant-ask-box">
            <div className="assistant-ask-label">
              <span>Ask AhaSpace</span>
              <span className="assistant-ask-rule" aria-hidden="true" />
            </div>
            <div className="assistant-ask-row">
              <input
                className="assistant-ask-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsAskFocused(true)}
                onBlur={() => setIsAskFocused(false)}
                placeholder="Ask anything..."
                aria-label="Type your message"
                disabled={isLoading}
              />
              <button
                className="assistant-ask-button"
                type="submit"
                disabled={isLoading || !inputValue.trim()}
              >
                <span aria-hidden="true">✨</span> {isLoading ? 'Sending...' : 'Ask'}
              </button>
            </div>
          </div>
          <p className={`assistant-ask-caption${captionVisible ? ' visible' : ''}`}>
            Responses are AI-generated by Google Gemini.
          </p>
        </form>
      </div>
    </div>
  );
}
