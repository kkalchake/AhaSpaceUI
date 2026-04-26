import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Register.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { auth } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        body: JSON.stringify({ message: userMessage.content })
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
    <div className="register-container" style={{ maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
      <h2>AI Chat</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
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
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
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
                  backgroundColor: msg.role === 'user' ? '#007bff' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#333',
                  border: msg.role === 'user' ? 'none' : '1px solid #ddd',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}
              >
                {msg.content}
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
  );
}
