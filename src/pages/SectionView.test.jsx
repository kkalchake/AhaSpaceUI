import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import SectionView from './SectionView'
import { API_BASE_URL } from '../config'

const SECTIONS_URL = `${API_BASE_URL}/api/courses/1/phases/3/sections`
const SECTION_SESSIONS_URL = `${API_BASE_URL}/api/courses/1/phases/3/sections/2/chat/sessions`

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true
}

const renderAtRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/courses/1/phases/3/sections/2']}>
      <AuthContext.Provider value={mockAuth}>
        <Routes>
          <Route path="/courses/:courseId/phases/:phaseId/sections/:sectionId" element={<SectionView />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('SectionView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === SECTIONS_URL) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 2, title: 'Heading', orderIndex: 1, content: '# Heading\n\nSome body text.', phaseId: 3 }
          ])
        })
      }
      if (url === SECTION_SESSIONS_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    })
  })

  it('renders Markdown content, turning a # heading into an <h1>', async () => {
    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Heading' })).toBeInTheDocument()
    })
    expect(screen.getByText('Some body text.')).toBeInTheDocument()
  })

  it('renders the SectionAssistantPanel alongside the lecture notes', async () => {
    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByText('Section Assistant')).toBeInTheDocument()
    })
  })

  it('shows an error when the section is not found in the list', async () => {
    global.fetch = vi.fn((url) => {
      if (url === SECTIONS_URL) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByText('Section not found.')).toBeInTheDocument()
    })
  })

  it('renders prev/next chapter navigation with a progress indicator', async () => {
    renderAtRoute()

    await waitFor(() => {
      expect(screen.getAllByText('Section 1 of 1').length).toBeGreaterThan(0)
    })
    const prevButtons = screen.getAllByRole('button', { name: /previous/i })
    const nextButtons = screen.getAllByRole('button', { name: /next/i })
    // Only section in its phase: both prev and next must be disabled.
    prevButtons.forEach(btn => expect(btn).toBeDisabled())
    nextButtons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('renders a toggle for the all-sections list panel', async () => {
    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show section list/i })).toBeInTheDocument()
    })
  })
})
