import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import NavBar from './NavBar'

const mockAuth = {
  auth: { token: 'test-token', email: 'testuser@example.com' },
  isAuthenticated: true,
  logout: () => {}
}

const mockUnauth = {
  auth: null,
  isAuthenticated: false,
  logout: () => {}
}

const renderWithAuth = (authValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <NavBar />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('NavBar Component', () => {
  it('renders the brand link with the full accessible name', () => {
    renderWithAuth(mockUnauth)

    expect(screen.getByRole('link', { name: /AhaSpace/ })).toHaveAttribute('href', '/')
  })

  it('renders Sign In and Register when logged out', () => {
    renderWithAuth(mockUnauth)

    const signInLink = screen.getByText('Sign In')
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login')

    const registerLink = screen.getByText('Register')
    expect(registerLink).toBeInTheDocument()
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
  })

  it('does not render an AI Agentic link (reachable via the /courses catalog instead)', () => {
    renderWithAuth(mockUnauth)

    expect(screen.queryByRole('link', { name: 'AI Agentic' })).not.toBeInTheDocument()
  })

  it('still renders AI Chat, Courses, and Logout when logged in', () => {
    renderWithAuth(mockAuth)

    expect(screen.getByText('AI Chat')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
