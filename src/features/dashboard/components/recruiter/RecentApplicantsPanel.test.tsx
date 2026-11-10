import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RecentApplicantsPanel } from './RecentApplicantsPanel'

const state = vi.hoisted(() => ({
  total: 16,
  error: undefined as unknown,
  pages: [] as number[],
  retry: vi.fn(),
}))

vi.mock('../../hooks/useRecruiterDashboard', () => ({
  APPLICANTS_PAGE_SIZE: 7,
  useRecruiterApplicants: (page: number) => {
    state.pages.push(page)
    const offset = page * 7
    const count = Math.max(0, Math.min(7, state.total - offset))
    return {
      applicants: Array.from({ length: count }, (_, index) => ({
        id: `a${offset + index}`,
        jobId: 'j1',
        applicantName: `Person ${offset + index}`,
        role: 'UX Writer',
        cvMatch: 88,
        prescreeningScore: 79,
        status: 'shortlisted',
        currentStage: 'completed',
        dateApplied: new Date().toISOString(),
      })),
      total: state.total,
      offset,
      error: state.error,
      isLoading: false,
      retry: state.retry,
    }
  },
}))

const renderPanel = () =>
  render(
    <MemoryRouter>
      <RecentApplicantsPanel />
    </MemoryRouter>,
  )

describe('RecentApplicantsPanel', () => {
  beforeEach(() => {
    state.total = 16
    state.error = undefined
    state.pages = []
  })

  it('pages through applicants and stops at both ends', () => {
    renderPanel()
    const previous = screen.getByRole('button', { name: 'Previous' })
    const next = screen.getByRole('button', { name: 'Next' })

    expect(screen.getByText('Showing 1–7 of 16 applications')).toBeTruthy()
    expect(previous.hasAttribute('disabled')).toBe(true)

    fireEvent.click(next)
    fireEvent.click(next)
    expect(screen.getByText('Showing 15–16 of 16 applications')).toBeTruthy()
    expect(next.hasAttribute('disabled')).toBe(true)
    expect(previous.hasAttribute('disabled')).toBe(false)
  })

  it('shows the score out of 100 and a readable status', () => {
    renderPanel()

    expect(screen.getAllByText('Shortlisted').length).toBeGreaterThan(0)
    expect(screen.getAllByText('88%').length).toBeGreaterThan(0)
  })

  it('offers a retry when the applicants fail to load', () => {
    state.error = new Error('404')
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(state.retry).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })

  it('hides the pager when there are no applications', () => {
    state.total = 0
    renderPanel()

    expect(screen.getByText('No applications yet')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
  })
})
