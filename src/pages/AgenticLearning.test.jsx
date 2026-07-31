import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AgenticLearning from './AgenticLearning'

const renderPage = () => {
  return render(
    <BrowserRouter>
      <AgenticLearning />
    </BrowserRouter>
  )
}

describe('AgenticLearning Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  it('renders all three group headings', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Reading' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Watching' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Code Reference' })).toBeInTheDocument()
  })

  it('renders 15 resource links total', () => {
    renderPage()

    const links = document.querySelectorAll('.agentic-list a')
    expect(links).toHaveLength(15)
  })

  it('every resource link opens in a new tab with rel="noopener noreferrer"', () => {
    renderPage()

    const links = document.querySelectorAll('.agentic-list a')
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('renders back-to-courses and main-page nav links (not opened in a new tab)', () => {
    renderPage()

    const backLink = screen.getByRole('link', { name: /back to courses/i })
    const homeLink = screen.getByRole('link', { name: 'Main page' })
    expect(backLink).toHaveAttribute('href', '/courses')
    expect(homeLink).toHaveAttribute('href', '/')
    expect(backLink).not.toHaveAttribute('target')
    expect(homeLink).not.toHaveAttribute('target')
  })

  it('never calls fetch', () => {
    renderPage()

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows real titles for Watching and Code Reference items, not raw URLs as link text', () => {
    renderPage()

    expect(screen.getByRole('link', { name: '20 AI Concepts Explained in 40 Minutes' })).toHaveAttribute(
      'href', 'https://www.youtube.com/watch?v=OYvlznJ4IZQ'
    )
    expect(screen.getByRole('link', { name: 'moazbuilds/CodeMachine-CLI' })).toHaveAttribute(
      'href', 'https://github.com/moazbuilds/CodeMachine-CLI'
    )
    expect(screen.queryByRole('link', { name: /^https:\/\/www\.youtube\.com/ })).not.toBeInTheDocument()
  })
})
