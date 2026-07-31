import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import PhaseSections from './PhaseSections'
import { API_BASE_URL } from '../config'

const SECTIONS_URL = `${API_BASE_URL}/api/courses/1/phases/2/sections`
const PUBLIC_SECTIONS_URL = `${API_BASE_URL}/api/public/courses/1/phases/2/sections`

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
})
