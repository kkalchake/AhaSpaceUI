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
})
