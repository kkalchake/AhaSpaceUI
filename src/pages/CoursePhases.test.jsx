import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CoursePhases from './CoursePhases'
import { API_BASE_URL } from '../config'

const COURSES_URL = `${API_BASE_URL}/api/courses`
const PHASES_URL = `${API_BASE_URL}/api/courses/1/phases`
const PUBLIC_COURSE_URL = `${API_BASE_URL}/api/public/courses/1`
const PUBLIC_PHASES_URL = `${API_BASE_URL}/api/public/courses/1/phases`

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true
}

const mockUnauth = {
  auth: null,
  isAuthenticated: false
}

const COURSE = {
  id: 1,
  title: 'AI Engineering From Scratch',
  description: 'What this course covers, in prose.',
  isPublic: true,
  sourceName: 'AI Engineering from Scratch by rohitg00',
  sourceUrl: 'https://github.com/rohitg00/ai-engineering-from-scratch',
  sourceLicense: 'MIT License — Copyright (c) 2026 Rohit Ghumare',
  insights: ['Hands-on, code-first lessons', 'Math foundations before ML']
}

const PHASES = [
  { id: 1, title: 'Phase 0: Setup & Tooling', description: 'Get ready.', orderIndex: 0, courseId: 1 },
  { id: 2, title: 'Phase 1: Math Foundations', description: 'The math.', orderIndex: 1, courseId: 1 }
]

const renderAtRoute = (authValue) => {
  return render(
    <MemoryRouter initialEntries={['/courses/1']}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/courses/:courseId" element={<CoursePhases />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CoursePhases Component - authenticated', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === COURSES_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([COURSE]) })
      }
      if (url === PHASES_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(PHASES) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('renders phases in the order given by the API response', async () => {
    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('Phase 0: Setup & Tooling')).toBeInTheDocument()
    })
    expect(screen.getByText('Phase 1: Math Foundations')).toBeInTheDocument()
    expect(screen.getByText('Get ready.')).toBeInTheDocument()
  })

  it('renders course title, description, source link + license, and insights', async () => {
    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: COURSE.title })).toBeInTheDocument()
    })
    expect(screen.getByText(COURSE.description)).toBeInTheDocument()
    const sourceLink = screen.getByRole('link', { name: COURSE.sourceName })
    expect(sourceLink).toHaveAttribute('href', COURSE.sourceUrl)
    expect(sourceLink).toHaveAttribute('target', '_blank')
    expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText(COURSE.sourceLicense)).toBeInTheDocument()
    expect(screen.getByText('Hands-on, code-first lessons')).toBeInTheDocument()
    expect(screen.getByText('Math foundations before ML')).toBeInTheDocument()
  })

  it('renders back-to-courses and main-page nav links', async () => {
    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: COURSE.title })).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /back to courses/i })).toHaveAttribute('href', '/courses')
    expect(screen.getByRole('link', { name: 'Main page' })).toHaveAttribute('href', '/')
  })

  it('shows empty state when there are no phases', async () => {
    global.fetch = vi.fn((url) => {
      if (url === COURSES_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([COURSE]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('No phases available yet.')).toBeInTheDocument()
    })
  })

  it('shows an error when the course is not found in the authenticated list', async () => {
    global.fetch = vi.fn((url) => {
      if (url === COURSES_URL) {
        // List doesn't contain course id 1 - fetchCourseMeta reports this as a 404.
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(PHASES) })
    })

    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('Course not found.')).toBeInTheDocument()
    })
  })

  it('shows an error when the phases endpoint 404s', async () => {
    global.fetch = vi.fn((url) => {
      if (url === COURSES_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([COURSE]) })
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
    })

    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('Course not found.')).toBeInTheDocument()
    })
  })
})

describe('CoursePhases Component - unauthenticated', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === PUBLIC_COURSE_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(COURSE) })
      }
      if (url === PUBLIC_PHASES_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(PHASES) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('fetches the public course and phases URLs with no Authorization header', async () => {
    const fetchMock = global.fetch

    renderAtRoute(mockUnauth)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: COURSE.title })).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(PUBLIC_COURSE_URL)
    expect(fetchMock).toHaveBeenCalledWith(PUBLIC_PHASES_URL, { headers: {} })
  })

  it('shows preview-unavailable copy on a 404 from the public course endpoint', async () => {
    global.fetch = vi.fn((url) => {
      if (url === PUBLIC_COURSE_URL) {
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(PHASES) })
    })

    renderAtRoute(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText("This course isn't available to preview. Sign in to view it.")).toBeInTheDocument()
    })
  })
})
