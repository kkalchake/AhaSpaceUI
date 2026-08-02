import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsyncAction } from './useAsyncAction'

// Deferred promise helper: lets a test control exactly when the wrapped
// async function resolves, so pending state can be observed mid-flight.
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('useAsyncAction', () => {
  it('toggles isPending around a resolving promise', async () => {
    const { promise, resolve } = deferred()
    const { result } = renderHook(() => useAsyncAction())

    expect(result.current.isPending).toBe(false)

    let runPromise
    act(() => {
      runPromise = result.current.run(() => promise)
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))

    await act(async () => {
      resolve('done')
      await runPromise
    })

    expect(result.current.isPending).toBe(false)
  })

  it('drops a second run() while pending when guard is true (default)', async () => {
    const { promise, resolve } = deferred()
    const fn = vi.fn(() => promise)
    const { result } = renderHook(() => useAsyncAction())

    act(() => {
      result.current.run(fn)
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    const secondFn = vi.fn(() => Promise.resolve('second'))
    await act(async () => {
      await result.current.run(secondFn)
    })

    expect(secondFn).not.toHaveBeenCalled()

    await act(async () => {
      resolve('first')
      await promise
    })
  })

  it('does not drop a second run() while pending when guard is false', async () => {
    const first = deferred()
    const { result } = renderHook(() => useAsyncAction({ guard: false }))

    act(() => {
      result.current.run(() => first.promise)
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    const second = deferred()
    const secondFn = vi.fn(() => second.promise)
    act(() => {
      result.current.run(secondFn)
    })

    // Unlike the guard:true case, the second call must actually invoke its
    // function - this is the SectionView prev/next race: a param change
    // mid-flight must not be silently swallowed.
    expect(secondFn).toHaveBeenCalledTimes(1)

    await act(async () => {
      first.resolve('first')
      second.resolve('second')
      await Promise.all([first.promise, second.promise])
    })
  })

  it('starts pending when initialPending is true', () => {
    const { result } = renderHook(() => useAsyncAction({ initialPending: true }))
    expect(result.current.isPending).toBe(true)
  })

  it('clears isPending and rethrows on rejection', async () => {
    const { result } = renderHook(() => useAsyncAction())
    const error = new Error('boom')

    let caught
    await act(async () => {
      try {
        await result.current.run(() => Promise.reject(error))
      } catch (err) {
        caught = err
      }
    })

    expect(caught).toBe(error)
    expect(result.current.isPending).toBe(false)
  })
})
