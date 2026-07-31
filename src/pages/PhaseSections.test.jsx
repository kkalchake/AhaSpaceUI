import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import PhaseSections from './PhaseSections'
import { API_BASE_URL } from '../config'

const SECTIONS_URL = `${API_BASE_URL}/api/courses/1/phases/2/sections`
const PUBLIC_SECTIONS_URL = `${API_BASE_URL}/api/public/courses/1/phases/2/sections`
const COURSES_URL = `${API_BASE_URL}/api/courses`
const PUBLIC_COURSE_URL = `${API_BASE_URL}/api/public/courses/1`

const COURSE = { id: 1, title: 'AI Engineering From Scratch', description: 'What this course covers.' }

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true
}

const mockUnauth = {
  auth: null,
  isAuthenticated: false
}

const renderAtRoute = (authValue) => {
  return render(
    <MemoryRouter initialEntries={['/courses/1/phases/2']}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/courses/:courseId/phases/:phaseId" element={<PhaseSections />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

const SECTIONS = [
  { id: 12, title: 'Chain Rule and Autodiff', orderIndex: 5, content: '# Chain Rule...', phaseId: 2 },
  { id: 3, title: 'Intro to Gradients', orderIndex: 1, content: '# Intro...', phaseId: 2 }
]

describe('PhaseSections Component - authenticated', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === SECTIONS_URL) {
        // Response is intentionally out of orderIndex order to prove the
        // component renders in the order the backend sends, with no
        // client-side re-sort.
        return Promise.resolve({ ok: true, json: () => Promise.resolve(SECTIONS) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('renders sections in the order given by the API response, with title and orderIndex visible', async () => {
    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('5. Chain Rule and Autodiff')).toBeInTheDocument()
    })
    expect(screen.getByText('1. Intro to Gradients')).toBeInTheDocument()

    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map(h => h.textContent)).toEqual([
      '5. Chain Rule and Autodiff',
      '1. Intro to Gradients'
    ])
  })

  it('shows an error when the phase is not found', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }))

    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('Phase not found.')).toBeInTheDocument()
    })
  })

  it('renders the back-to-phases, Courses, and Main page nav links', async () => {
    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('5. Chain Rule and Autodiff')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /back to phases/i })).toHaveAttribute('href', '/courses/1')
    expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/courses')
    expect(screen.getByRole('link', { name: 'Main page' })).toHaveAttribute('href', '/')
  })

  it('renders the course title when the course-meta fetch resolves 200', async () => {
    global.fetch = vi.fn((url) => {
      if (url === SECTIONS_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(SECTIONS) })
      }
      if (url === COURSES_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([COURSE]) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })

    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('Course: AI Engineering From Scratch')).toBeInTheDocument()
    })
  })

  it('still renders sections with no error banner when the course-meta fetch fails', async () => {
    // Default beforeEach mock already 500s every URL but SECTIONS_URL,
    // which covers the meta call - assert that failure stays silent.
    renderAtRoute(mockAuth)

    await waitFor(() => {
      expect(screen.getByText('5. Chain Rule and Autodiff')).toBeInTheDocument()
    })
    expect(screen.queryByText('Course:', { exact: false })).not.toBeInTheDocument()
    expect(document.querySelector('.error-banner')).not.toBeInTheDocument()
  })
})

describe('PhaseSections Component - unauthenticated', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === PUBLIC_SECTIONS_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(SECTIONS) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('fetches the public sections URL with no Authorization header', async () => {
    const fetchMock = global.fetch

    renderAtRoute(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText('5. Chain Rule and Autodiff')).toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(PUBLIC_SECTIONS_URL, { headers: {} })
  })

  it('renders the course title when the public course-meta fetch resolves 200', async () => {
    global.fetch = vi.fn((url) => {
      if (url === PUBLIC_SECTIONS_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(SECTIONS) })
      }
      if (url === PUBLIC_COURSE_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(COURSE) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })

    renderAtRoute(mockUnauth)

    await waitFor(() => {
      expect(screen.getByText('Course: AI Engineering From Scratch')).toBeInTheDocument()
    })
  })
})
