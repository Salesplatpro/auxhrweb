import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Goal, GoalReportsData } from '@/features/people/types'

import { GoalReportAction, goalReportProblem } from './GoalReportAction'

const { useGoalReports, submitGoalReport, mutate } = vi.hoisted(() => ({
  useGoalReports: vi.fn(),
  submitGoalReport: vi.fn(),
  mutate: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePerformance', () => ({ useGoalReports }))
vi.mock('@/features/people/services/peopleService', () => ({
  myGoalReportsKey: (staffId: string, goalId: string) =>
    `/my-work/${staffId}/goals/${goalId}/reports`,
  submitGoalReport,
  downloadGoalReportFile: vi.fn(),
  goalReportsKey: vi.fn(),
  saveGoalReportNote: vi.fn(),
}))
vi.mock('@/utils/toastNotifications', () => ({ notify: vi.fn() }))

const goal = {
  id: 'g-1',
  title: 'Call 20 merchants',
  reportFrequency: 'weekly',
  status: 'approved',
} as Goal

const reports: GoalReportsData = {
  goalId: 'g-1',
  frequency: 'weekly',
  submitted: 1,
  missed: 1,
  periods: [
    { periodStart: '2026-11-23', state: 'open', open: true, report: null },
    {
      periodStart: '2026-11-16',
      state: 'submitted',
      open: false,
      report: {
        id: 'r-1',
        periodStart: '2026-11-16',
        frequency: 'weekly',
        text: 'Called 22 merchants',
        links: [],
        files: [],
        textVersion: 1,
        submittedAt: '2026-11-20T10:00:00.000Z',
        reviewerNote: 'Great work',
        reviewerNoteByName: 'Hana Head',
        reviewerNoteAt: '2026-11-21T10:00:00.000Z',
        noteVersion: 1,
      },
    },
    { periodStart: '2026-11-09', state: 'missed', open: false, report: null },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  useGoalReports.mockReturnValue({
    reports,
    isLoading: false,
    hasError: false,
    mutate,
  })
})

describe('goalReportProblem', () => {
  it('needs text, a link or a file, and only https links', () => {
    expect(goalReportProblem('  ', [], 0, [])).toBe(
      'Write something, add a link or attach a file.',
    )
    expect(goalReportProblem('', ['http://x.com'], 0, [])).toBe(
      'Links must start with https://',
    )
    expect(goalReportProblem('Done', [], 0, [])).toBeNull()
  })
})

describe('GoalReportAction', () => {
  it('loads reports only once opened, shows each period and sends the open one', async () => {
    submitGoalReport.mockResolvedValue({
      ...reports.periods[1]!.report!,
      id: 'r-2',
    })
    render(<GoalReportAction staffId="s-1" goal={goal} />)
    expect(useGoalReports).toHaveBeenLastCalledWith(null)

    fireEvent.click(screen.getByRole('button', { name: 'Weekly reports' }))
    expect(useGoalReports).toHaveBeenLastCalledWith(
      '/my-work/s-1/goals/g-1/reports',
    )
    expect(screen.getByText('Missed')).toBeTruthy()
    expect(screen.getByText('Note from Hana Head:')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Send report' })).toHaveLength(
      1,
    )

    fireEvent.change(
      screen.getByLabelText('What did you do for Week of 23 Nov 2026?'),
      { target: { value: 'Called 18 merchants' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }))

    await waitFor(() =>
      expect(submitGoalReport).toHaveBeenCalledWith(
        's-1',
        'g-1',
        '2026-11-23',
        expect.any(FormData),
      ),
    )
    const form = submitGoalReport.mock.calls[0]![3] as FormData
    expect(form.get('text')).toBe('Called 18 merchants')
    expect(mutate).toHaveBeenCalled()
  })

  it('shows nothing for a goal without reports', () => {
    render(
      <GoalReportAction
        staffId="s-1"
        goal={{ ...goal, reportFrequency: null }}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Weekly reports' })).toBeNull()
  })
})
