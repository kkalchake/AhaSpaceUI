import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AsyncButton from './AsyncButton'

describe('AsyncButton', () => {
  it('is not disabled/busy and shows children when not pending', () => {
    render(<AsyncButton isPending={false}>Submit</AsyncButton>)

    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'false')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })

  it('flips disabled/aria-disabled/aria-busy and swaps in pendingLabel while pending', () => {
    render(<AsyncButton isPending={true} pendingLabel="Sending…">Ask</AsyncButton>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveTextContent('Sending…')
    expect(button).not.toHaveTextContent('Ask')
  })

  it('is disabled via the disabled prop independently of isPending', () => {
    render(<AsyncButton isPending={false} disabled={true}>Ask</AsyncButton>)

    const button = screen.getByRole('button', { name: 'Ask' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute('aria-busy', 'false')
  })

  it('fires onClick only once for a rapid second click while pending', () => {
    const onClick = vi.fn()
    const { rerender } = render(
      <AsyncButton isPending={false} onClick={onClick} type="button">Ask</AsyncButton>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)
    // Simulate the click flipping the component into a pending state - the
    // native `disabled` attribute is what actually blocks the second click,
    // not any logic inside AsyncButton itself.
    rerender(<AsyncButton isPending={true} onClick={onClick} type="button">Ask</AsyncButton>)
    fireEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
