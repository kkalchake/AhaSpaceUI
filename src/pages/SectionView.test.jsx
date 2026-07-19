import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import SectionView from './SectionView'

const mockAuth = {
  auth: { token: 'test-token', username: 'testuser' },
  isAuthenticated: true
}

const renderAtRoute = () => {
  return render(
    <MemoryRouter initialEntries={['/courses/1/sections/2']}>
      <AuthContext.Provider value={mockAuth}>
        <Routes>
          <Route path="/courses/:courseId/sections/:sectionId" element={<SectionView />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('SectionView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn((url) => {
      if (url === 'http://localhost:8080/api/courses/1/sections') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 2, content: '# Heading\n\nSome body text.', courseId: 1 }
          ])
        })
      }
      if (url === 'http://localhost:8080/api/courses/1/sections/2/chat/sessions') {
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
      if (url === 'http://localhost:8080/api/courses/1/sections') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    renderAtRoute()

    await waitFor(() => {
      expect(screen.getByText('Section not found.')).toBeInTheDocument()
    })
  })
})
