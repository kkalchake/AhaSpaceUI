import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Chat from './Chat'

const mockAuth = {
  auth: { token: 'test-token', username: 'testuser' },
  isAuthenticated: true
}

const renderWithAuth = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuth}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('Chat Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Default mock handles the sessions fetch that fires on every mount
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('renders chat interface with input and button', () => {
    renderWithAuth(<Chat />)

    expect(screen.getByText('AI Chat')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    expect(screen.getByText('Powered by Google Gemini')).toBeInTheDocument()
  })

  it('renders sidebar with new chat button', () => {
    renderWithAuth(<Chat />)
    expect(screen.getByText('+ New Chat')).toBeInTheDocument()
  })

  it('fetches sessions on mount and displays them in sidebar', async () => {
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, title: 'Old convo', createdAt: '2024-01-01T00:00:00' }])
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    renderWithAuth(<Chat />)

    await waitFor(() => {
      expect(screen.getByText('Old convo')).toBeInTheDocument()
    })
  })

  it('displays empty state message when no messages', () => {
    renderWithAuth(<Chat />)

    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument()
  })

  it('sends message and displays it in chat history', async () => {
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ response: 'AI response', model: 'gemini-2.0-flash', sessionId: 1, sessionTitle: 'Test' })
      })
    })

    renderWithAuth(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Hello AI' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument()
    })
  })

  it('calls API with correct message, sessionId, and authorization header', async () => {
    const fetchMock = vi.fn((url, options) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ response: 'Test response', model: 'gemini-2.0-flash', sessionId: 1, sessionTitle: 'Test message' })
      })
    })
    global.fetch = fetchMock

    renderWithAuth(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8080/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          // sessionId is null because no session is active when the first message is sent
          body: JSON.stringify({ message: 'Test message', sessionId: null })
        })
      )
    })
  })

  it('displays AI response after receiving it', async () => {
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ response: 'AI says hello!', model: 'gemini-2.0-flash', sessionId: 1, sessionTitle: 'Test' })
      })
    })

    renderWithAuth(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('AI says hello!')).toBeInTheDocument()
    })
  })

  it('displays error message when API fails', async () => {
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      })
    })

    renderWithAuth(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('shows loading state while waiting for response', async () => {
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/chat/sessions') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 200,
            json: () => Promise.resolve({ response: 'Delayed response', model: 'gemini-2.0-flash', sessionId: 1, sessionTitle: 'Test' })
          })
        }, 100)
      })
    })

    renderWithAuth(<Chat />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()
    expect(screen.getByText(/thinking/i)).toBeInTheDocument()
  })

  it('disables send button when input is empty', () => {
    renderWithAuth(<Chat />)

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })
})
