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
  it('renders exactly one Sign In link, as the primary action', () => {
    renderWithAuth(mockUnauth)

    const signInLinks = screen.getAllByRole('link', { name: 'Sign In' })
    expect(signInLinks).toHaveLength(1)
    expect(signInLinks[0]).toHaveClass('btn-primary')
    expect(signInLinks[0]).toHaveAttribute('href', '/login')
  })

  it('renders exactly one Register link, as the secondary action', () => {
    renderWithAuth(mockUnauth)

    const registerLinks = screen.getAllByRole('link', { name: 'Register' })
    expect(registerLinks).toHaveLength(1)
    expect(registerLinks[0]).toHaveClass('btn-secondary')
    expect(registerLinks[0]).not.toHaveClass('btn-primary')
    expect(registerLinks[0]).toHaveAttribute('href', '/register')
  })

  it('does not duplicate the old two-copy-string sign-in pitch', () => {
    renderWithAuth(mockUnauth)

    // Old copy no longer present as two separate lines
    expect(screen.queryByText(/sign in to keep going/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/create an account/i)).not.toBeInTheDocument()
  })

  it('renders a link to browse the public course', () => {
    renderWithAuth(mockUnauth)

    const browseLink = screen.getByRole('link', { name: /browse the public course/i })
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
