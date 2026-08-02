import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SlowRequestProvider } from '../context/SlowRequestContext'
import { useAsyncAction } from '../hooks/useAsyncAction'
import ColdStartBanner from './ColdStartBanner'

// Minimal harness: a button that starts a controllable async action via
// useAsyncAction, so the test can drive beginRequest/endRequest exactly like
// a real page would, instead of reaching into SlowRequestContext directly.
function Harness({ promise }) {
  const { run } = useAsyncAction()
  return <button onClick={() => run(() => promise)}>go</button>
}

describe('ColdStartBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is absent before 3000ms, present at 3000ms, and gone once the request settles', async () => {
    let resolvePending
    const promise = new Promise((resolve) => { resolvePending = resolve })

    render(
      <SlowRequestProvider>
        <ColdStartBanner />
        <Harness promise={promise} />
      </SlowRequestProvider>
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      screen.getByText('go').click()
    })

    // Just under the threshold: still absent.
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument()

    // Crosses the 3000ms threshold: banner appears.
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByText(/waking up the server/i)).toBeInTheDocument()

    // Request settles: banner clears itself.
    await act(async () => {
      resolvePending('done')
      await promise
    })
    expect(screen.queryByText(/waking up the server/i)).not.toBeInTheDocument()
  })
})
