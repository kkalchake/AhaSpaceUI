import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Login from './Login'
import { API_BASE_URL } from '../config'

const LOGIN_URL = `${API_BASE_URL}/api/auth/login`

const mockAuth = {
  login: vi.fn()
}

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={mockAuth}>
        <Login />
      </AuthContext.Provider>
    </MemoryRouter>
  )

const fillEmailStep = () => {
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: /continue/i }))
}

describe('Login Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('issues no fetch and never spins on the step-1 Continue click', () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock

    renderLogin()
    fillEmailStep()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument()
  })

  it('shows "Signing in…" and disables the button while the login request is in flight', async () => {
    let resolveFetch
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve }))

    renderLogin()
    fillEmailStep()
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    const pendingButton = await screen.findByRole('button', { name: /signing in/i })
    expect(pendingButton).toBeDisabled()

    resolveFetch({ status: 200, json: () => Promise.resolve({ token: 't', email: 'user@example.com' }) })

    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument()
    })
  })
})
