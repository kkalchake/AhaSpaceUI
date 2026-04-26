import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn()

afterEach(() => {
  cleanup()
})
