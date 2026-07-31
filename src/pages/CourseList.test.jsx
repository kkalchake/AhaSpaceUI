import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CourseList from './CourseList'
import { API_BASE_URL } from '../config'

const COURSES_URL = `${API_BASE_URL}/api/courses`
const PUBLIC_COURSES_URL = `${API_BASE_URL}/api/public/courses`

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true
}

const mockUnauth = {
  auth: null,
  isAuthenticated: false
}

const COURSES = [
  { id: 1, title: 'AI Engineering From Scratch', description: 'What this course covers.', isPublic: true, insights: [] }
]

const renderWithAuth = (authValue) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <CourseList />
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CourseList Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches the authenticated courses URL with an Authorization header when logged in', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(COURSES) }))
    global.fetch = fetchMock

    renderWithAuth(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('AI Engineering From Scratch')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      COURSES_URL,
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
    )
  })

  it('fetches the public courses URL with no Authorization header when logged out', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(COURSES) }))
    global.fetch = fetchMock

    renderWithAuth(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText('AI Engineering From Scratch')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(PUBLIC_COURSES_URL, { headers: {} })
    expect(screen.getByText('Public courses')).toBeInTheDocument()
  })

  it('shows a distinct empty state for logged-out visitors', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))

    renderWithAuth(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText('No public courses available yet. Sign in to see more.')).toBeInTheDocument()
    })
  })

  it('renders the sign-in gate notice as a standalone callout below the course list, with Sign in and Register', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(COURSES) }))
    global.fetch = fetchMock

    renderWithAuth(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText('AI Engineering From Scratch')).toBeInTheDocument()
    })

    const notice = screen.getByText('Sign in to see the full course catalog.').closest('.course-page-notice')
    expect(notice).toBeInTheDocument()
    expect(notice.closest('.course-card-list')).toBeNull()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register')
  })

  it('lists AI Agentic: Self Learning as the second course, linking to /agentic-learning', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(COURSES) }))
    global.fetch = fetchMock

    renderWithAuth(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText('AI Engineering From Scratch')).toBeInTheDocument()
    })

    const cards = screen.getAllByRole('link').filter((link) => link.className.includes('course-card-link'))
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('AI Engineering From Scratch')
    expect(cards[1]).toHaveTextContent('AI Agentic: Self Learning')
    expect(cards[1]).toHaveAttribute('href', '/agentic-learning')
  })

  it('shows AI Agentic: Self Learning even when the real catalog is empty', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))

    renderWithAuth(mockUnauth)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /AI Agentic: Self Learning/ })).toHaveAttribute('href', '/agentic-learning')
    })
    expect(screen.getByText('No public courses available yet. Sign in to see more.')).toBeInTheDocument()
  })
})
