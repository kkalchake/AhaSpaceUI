import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import './MessageBubble.css';

/*
 * Shared by Chat.jsx and SectionAssistantPanel.jsx so both chat surfaces
 * render messages identically. Previously each file had its own copy of this
 * markup, and only SectionAssistantPanel's copy ran assistant replies through
 * ReactMarkdown — Chat.jsx's copy rendered them as raw text. Centralizing the
 * rendering here means that gap can't reappear next time one file is edited
 * without the other.
 *
 * User bubbles still render as plain text: they store only the raw question,
 * so Markdown parsing would be wasted work.
 */
export default function MessageBubble({ role, content, model, timestamp }) {
  const isUser = role === 'user';
  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      <div className="message-badge" aria-hidden="true">{isUser ? 'U' : 'AI'}</div>
      <div className="message-stack">
        <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
          {isUser ? (
            content
          ) : (
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {content}
            </ReactMarkdown>
          )}
        </div>
        <div className="message-meta">
          {role === 'assistant' && model && <span>{model} • </span>}
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="message-row message-row-assistant">
      <div className="message-badge" aria-hidden="true">AI</div>
      <div className="message-bubble message-bubble-assistant message-bubble-thinking">
        Thinking...
      </div>
    </div>
  );
}
