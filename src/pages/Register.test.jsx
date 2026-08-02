import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import Register from './Register'
import { API_BASE_URL } from '../config'

const mockAuth = {
  login: vi.fn()
}

const renderRegister = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={mockAuth}>
        <Register />
      </AuthContext.Provider>
    </MemoryRouter>
  )

const fillForm = () => {
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'user@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
  fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'password123' } })
}

describe('Register Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows "Creating account…" and disables the button while the request is in flight', async () => {
    let resolveFetch
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve }))

    renderRegister()
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    const pendingButton = await screen.findByRole('button', { name: /creating account/i })
    expect(pendingButton).toBeDisabled()

    resolveFetch({ status: 201, json: () => Promise.resolve({ token: 't', email: 'user@example.com' }) })

    await waitFor(() => {
      expect(screen.queryByText(/creating account/i)).not.toBeInTheDocument()
    })
  })

  it('re-enables the button with its original label after a failed request', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      status: 400,
      json: () => Promise.resolve({ email: 'Email already in use' })
    }))

    renderRegister()
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Register' })).not.toBeDisabled()
    })
  })
})
