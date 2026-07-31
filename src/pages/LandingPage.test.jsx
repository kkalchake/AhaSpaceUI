import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import LandingPage from './LandingPage'

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true,
  logout: () => {}
}

const mockUnauth = {
  auth: null,
  isAuthenticated: false
}

const renderWithAuth = (authValue) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <LandingPage />
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('LandingPage Component - unauthenticated', () => {
  it('renders no Sign In link in the page body (nav bar carries it now)', () => {
    renderWithAuth(mockUnauth)

    expect(screen.queryByRole('link', { name: 'Sign In' })).not.toBeInTheDocument()
  })

  it('renders no Register link in the page body (nav bar carries it now)', () => {
    renderWithAuth(mockUnauth)

    expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument()
  })

  it('does not duplicate the old two-copy-string sign-in pitch', () => {
    renderWithAuth(mockUnauth)

    // Old copy no longer present as two separate lines
    expect(screen.queryByText(/sign in to keep going/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/create an account/i)).not.toBeInTheDocument()
  })

  it('renders a link to browse public courses', () => {
    renderWithAuth(mockUnauth)

    const browseLink = screen.getByRole('link', { name: /browse public courses/i })
    expect(browseLink).toHaveAttribute('href', '/courses')
  })
})

describe('LandingPage Component - authenticated', () => {
  it('renders the greeting and AI Chat / Courses / Logout actions', () => {
    renderWithAuth(mockAuth)

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'AI Chat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Courses' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })
})
