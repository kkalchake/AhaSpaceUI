import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import SectionAssistantPanel from './SectionAssistantPanel'

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true
}

const BASE = 'http://localhost:8080/api/courses/1/sections/2/chat'

const renderWithAuth = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuth}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('SectionAssistantPanel Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Default mock handles the sessions fetch that fires on every mount
    global.fetch = vi.fn((url) => {
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('renders assistant panel with input and button', () => {
    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    expect(screen.getByText('Section Assistant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('renders sidebar with new chat button', () => {
    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)
    expect(screen.getByText('+ New Chat')).toBeInTheDocument()
  })

  it('fetches sessions from the nested section endpoint on mount', async () => {
    const fetchMock = vi.fn((url) => {
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, title: 'Old convo', createdAt: '2024-01-01T00:00:00' }])
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
    global.fetch = fetchMock

    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    await waitFor(() => {
      expect(screen.getByText('Old convo')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE}/sessions`,
      expect.objectContaining({ headers: { 'Authorization': 'Bearer test-token' } })
    )
  })

  it('displays empty state message when no messages', () => {
    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    expect(screen.getByText(/ask a question about this section/i)).toBeInTheDocument()
  })

  it('disables send button when input is empty', () => {
    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('sends message and displays it in chat history', async () => {
    global.fetch = vi.fn((url) => {
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ response: 'AI response', model: 'gemini-2.5-flash-lite', sessionId: 1, sessionTitle: 'Test' })
      })
    })

    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'What is this section about?' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('What is this section about?')).toBeInTheDocument()
    })
  })

  it('POSTs to the nested chat endpoint with correct body and authorization header', async () => {
    const fetchMock = vi.fn((url) => {
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ response: 'Test response', model: 'gemini-2.5-flash-lite', sessionId: 1, sessionTitle: 'Test message' })
      })
    })
    global.fetch = fetchMock

    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        BASE,
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
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ response: 'AI says hello!', model: 'gemini-2.5-flash-lite', sessionId: 1, sessionTitle: 'Test' })
      })
    })

    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

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
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ error: 'Failed to get AI response' })
      })
    })

    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to get AI response')).toBeInTheDocument()
    })
  })

  it('shows loading state while waiting for response', async () => {
    global.fetch = vi.fn((url) => {
      if (url === `${BASE}/sessions`) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            status: 200,
            json: () => Promise.resolve({ response: 'Delayed response', model: 'gemini-2.5-flash-lite', sessionId: 1, sessionTitle: 'Test' })
          })
        }, 100)
      })
    })

    renderWithAuth(<SectionAssistantPanel courseId={1} sectionId={2} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(sendButton)

    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()
    expect(screen.getByText(/thinking/i)).toBeInTheDocument()
  })
})
