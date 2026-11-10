import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardHeader } from './DashboardHeader'

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  )
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/pages/LoggedInUserBadge', () => ({
  LoggedInUserBadge: () => <div data-tour="profile-menu" />,
}))

const renderHeader = (audience: 'recruiter' | 'talent') =>
  render(
    <MemoryRouter>
      <DashboardHeader audience={audience} />
    </MemoryRouter>,
  )

const search = (text: string) => {
  const input = screen.getByRole('searchbox')
  fireEvent.change(input, { target: { value: text } })
  fireEvent.submit(input.closest('form')!)
}

describe('DashboardHeader', () => {
  beforeEach(() => navigateMock.mockReset())

  it('focuses the search box on Cmd+K or Ctrl+K', () => {
    renderHeader('talent')
    const input = screen.getByRole('searchbox')

    const cmd = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      cancelable: true,
    })
    window.dispatchEvent(cmd)
    expect(document.activeElement).toBe(input)
    expect(cmd.defaultPrevented).toBe(true)

    input.blur()
    fireEvent.keyDown(window, { key: 'K', ctrlKey: true })
    expect(document.activeElement).toBe(input)
  })

  it('stops listening for the shortcut once it unmounts', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHeader('talent')

    unmount()

    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
    remove.mockRestore()
  })

  it('does nothing for a blank search', () => {
    renderHeader('talent')
    search('   ')

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('sends talent to Find Jobs with the keyword encoded', () => {
    renderHeader('talent')
    search('  UX & research  ')

    expect(navigateMock).toHaveBeenCalledWith(
      '/talentDashboard/job?q=UX%20%26%20research',
    )
  })

  it('sends recruiters to Talent Search, where the text only fills the form', () => {
    renderHeader('recruiter')
    search('Senior designer')

    expect(navigateMock).toHaveBeenCalledWith(
      '/recruiterDashboard/talent-search?q=Senior%20designer',
    )
  })

  it('caps what can be typed at 100 characters', () => {
    renderHeader('talent')

    expect(screen.getByRole('searchbox').getAttribute('maxlength')).toBe('100')
  })

  it('gives recruiters a Post A Job button that the tour can find', () => {
    renderHeader('recruiter')
    const button = screen.getByRole('button', { name: 'Post a job' })

    fireEvent.click(button)

    expect(button.getAttribute('data-tour')).toBe('nav-post-job')
    expect(navigateMock).toHaveBeenCalledWith('/recruiterDashboard/postjob')
  })

  it('shows talent no Post A Job button', () => {
    renderHeader('talent')

    expect(screen.queryByRole('button', { name: 'Post a job' })).toBeNull()
  })
})
