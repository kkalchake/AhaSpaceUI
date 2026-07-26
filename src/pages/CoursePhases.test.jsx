import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import CoursePhases from './CoursePhases'
import { API_BASE_URL } from '../config'

const PHASES_URL = `${API_BASE_URL}/api/courses/1/phases`

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true
}

const renderAtRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/courses/1']}>
      <AuthContext.Provider value={mockAuth}>
        <Routes>
          <Route path="/courses/:courseId" element={<CoursePhases />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('CoursePhases Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === PHASES_URL) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, title: 'Phase 0: Setup & Tooling', description: 'Get ready.', orderIndex: 0, courseId: 1 },
            { id: 2, title: 'Phase 1: Math Foundations', description: 'The math.', orderIndex: 1, courseId: 1 }
          ])
        })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('renders phases in the order given by the API response', async () => {
    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByText('Phase 0: Setup & Tooling')).toBeInTheDocument()
    })
    expect(screen.getByText('Phase 1: Math Foundations')).toBeInTheDocument()
    expect(screen.getByText('Get ready.')).toBeInTheDocument()
  })

  it('shows empty state when there are no phases', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))

    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByText('No phases available yet.')).toBeInTheDocument()
    })
  })

  it('shows an error when the course is not found', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }))

    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByText('Course not found.')).toBeInTheDocument()
    })
  })
})
