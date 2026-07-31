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
  it('renders neither Sign In nor Register when logged out', () => {
    renderWithAuth(mockUnauth)

    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Register')).not.toBeInTheDocument()
    expect(screen.getByText('AhaSpace')).toBeInTheDocument()
  })

  it('still renders AI Chat, Courses, and Logout when logged in', () => {
    renderWithAuth(mockAuth)

    expect(screen.getByText('AI Chat')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })
})
