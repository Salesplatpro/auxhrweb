import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { Goal, GoalReportsData } from '../../types'
import { GoalReportsReview } from './GoalReportsDrawer'

const { useGoalReports } = vi.hoisted(() => ({ useGoalReports: vi.fn() }))

vi.mock('../../hooks/usePerformance', () => ({ useGoalReports }))

const goal = {
  id: 'g-1',
  title: 'Call 20 merchants',
  reportFrequency: 'daily',
  status: 'approved',
} as Goal

const reports: GoalReportsData = {
  goalId: 'g-1',
  frequency: 'daily',
  submitted: 1,
  missed: 1,
  periods: [
    {
      periodStart: '2026-11-24',
      state: 'submitted',
      open: true,
      report: {
        id: 'r-1',
        periodStart: '2026-11-24',
        frequency: 'daily',
        text: 'Visited two shops',
        links: ['https://example.com/photos'],
        files: [],
        textVersion: 1,
        submittedAt: '2026-11-24T16:00:00.000Z',
        reviewerNote: null,
        reviewerNoteByName: null,
        reviewerNoteAt: null,
        noteVersion: 0,
      },
    },
    { periodStart: '2026-11-23', state: 'missed', open: false, report: null },
  ],
}

describe('GoalReportsReview', () => {
  it('shows each day as sent or missed, with a note form only for reviewers who can write', () => {
    useGoalReports.mockReturnValue({
      reports,
      isLoading: false,
      mutate: vi.fn(),
    })
    const { unmount } = render(
      <GoalReportsReview base="/b" goal={goal} canNote onClose={vi.fn()} />,
    )

    expect(screen.getByText('Daily reports')).toBeTruthy()
    expect(
      screen.getByText('Call 20 merchants · 1 sent · 1 missed'),
    ).toBeTruthy()
    expect(screen.getByText('Visited two shops')).toBeTruthy()
    expect(screen.getByText('Missed')).toBeTruthy()
    expect(screen.getByText('Your note')).toBeTruthy()
    unmount()

    render(
      <GoalReportsReview
        base="/b"
        goal={goal}
        canNote={false}
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByText('Your note')).toBeNull()
  })
})
