import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignInPromptModal from './SignInPromptModal'

const renderModal = (props = {}) => {
  return render(
    <BrowserRouter>
      <SignInPromptModal isOpen onClose={() => {}} {...props} />
    </BrowserRouter>
  )
}

describe('SignInPromptModal Component', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <BrowserRouter>
        <SignInPromptModal isOpen={false} onClose={() => {}} />
      </BrowserRouter>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders as a modal dialog', () => {
    renderModal()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('renders Sign In as the primary action linking to /login', () => {
    renderModal()

    const signIn = screen.getByRole('link', { name: 'Sign In' })
    expect(signIn).toHaveClass('btn-primary')
    expect(signIn).toHaveAttribute('href', '/login')
  })

  it('renders Register as the secondary action linking to /register', () => {
    renderModal()

    const register = screen.getByRole('link', { name: 'Register' })
    expect(register).toHaveClass('btn-secondary')
    expect(register).not.toHaveClass('btn-primary')
    expect(register).toHaveAttribute('href', '/register')
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    renderModal({ onClose })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click but not on dialog content click', () => {
    const onClose = vi.fn()
    renderModal({ onClose })

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    // Backdrop is the dialog's parent; clicking it (outside the dialog) should close.
    fireEvent.click(screen.getByRole('dialog').parentElement)
    expect(onClose).toHaveBeenCalled()
  })

  it('moves focus into the dialog on open', () => {
    renderModal()

    expect(screen.getByRole('dialog')).toHaveFocus()
  })
})
