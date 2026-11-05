import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ManagedPerformance } from '../../types'
import { PerformanceCards } from './PerformanceCards'

const mocks = vi.hoisted(() => ({
  fetchPerformance: vi.fn(),
  approveGoal: vi.fn(),
  addGoal: vi.fn(),
  addDevelopmentItem: vi.fn(),
  suggestGoals: vi.fn(),
  requestEfficiencyTip: vi.fn(),
  saveReportNote: vi.fn(),
  saveFeedback: vi.fn(),
  editDevelopmentItem: vi.fn(),
  writeJobDescription: vi.fn(),
  saveJobDescription: vi.fn(),
  approveCompletion: vi.fn(),
  returnCompletion: vi.fn(),
  downloadEvidence: vi.fn(),
  completeGoal: vi.fn(),
  reopenGoal: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('../../services/peopleService', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...mocks,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: mocks.notify }))

const performance: ManagedPerformance = {
  completionRequests: [],
  staffId: 's-1',
  isExecutive: false,
  jobDescription: null,
  goals: [
    {
      id: 'g-1',
      title: 'Ship the redesign',
      keyResults: ['Launch by March'],
      target: '1 launch',
      dueOn: '2099-01-01',
      progress: 0,
      status: 'draft',
      source: 'ai',
      version: 3,
      approvedByName: null,
      approvedAt: null,
      completedAt: null,
      completedByName: null,
    },
  ],
  reports: {
    total: 1,
    items: [
      {
        id: 'r-1',
        weekStart: '2026-11-02',
        did: 'Shipped <b>page</b>',
        blocked: '',
        nextWeek: '',
        textVersion: 2,
        submittedAt: '',
        managerNote: null,
        managerNoteByName: null,
        managerNoteAt: null,
        noteVersion: 0,
        advice: null,
        adviceAt: null,
      },
    ],
  },
  development: [
    {
      id: 'd-1',
      weakArea: 'SQL',
      action: 'Take the course',
      dueOn: null,
      status: 'proposed',
      source: 'ai',
      version: 1,
    },
  ],
  feedback: [],
  efficiency: {
    quarter: '2026-Q4',
    score: 70,
    partial: true,
    parts: [
      { key: 'goals', weight: 0.5, value: 70 },
      { key: 'reports', weight: 0.25, value: null },
      { key: 'rating', weight: 0.25, value: null },
    ],
  },
  efficiencyTip: null,
}

const renderCards = (
  overrides: Partial<ManagedPerformance> = {},
  props: { readOnly?: boolean; hr?: boolean; canReview?: boolean } = {},
) => {
  mocks.fetchPerformance.mockResolvedValue({ ...performance, ...overrides })
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MemoryRouter>
        <PerformanceCards
          base="/base"
          readOnly={props.readOnly ?? false}
          hr={props.hr ? { organizationId: 'o', staffId: 's-1' } : undefined}
          canReview={props.canReview}
        />
      </MemoryRouter>
    </SWRConfig>,
  )
}

describe('PerformanceCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('explains a load failure, such as a person leaving the team', async () => {
    mocks.fetchPerformance.mockRejectedValue(new Error('404'))
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <PerformanceCards base="/base" readOnly={false} />
      </SWRConfig>,
    )
    expect(await screen.findByText("Couldn't load performance")).toBeTruthy()
  })

  it('shows a partial score and says which parts are missing', async () => {
    renderCards()
    expect(await screen.findByText('70 / 100')).toBeTruthy()
    expect(screen.getByText(/Partial score/)).toBeTruthy()
    expect(screen.getAllByText('No data')).toHaveLength(2)
  })

  it('says not enough data instead of showing 0', async () => {
    renderCards({
      efficiency: { ...performance.efficiency, score: null },
    })
    expect(await screen.findByText('Not enough data yet.')).toBeTruthy()
    expect(screen.queryByText('0 / 100')).toBeNull()
  })

  it('hides the tip for an executive', async () => {
    renderCards({ isExecutive: true })
    await screen.findByText('70 / 100')
    expect(screen.queryByRole('button', { name: 'Get a tip' })).toBeNull()
  })

  it('offers a new tip only when the saved one is out of date', async () => {
    const first = renderCards({
      efficiencyTip: { tip: 'Keep going', current: true },
    })
    expect(await screen.findByText(/Keep going/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /tip/ })).toBeNull()
    first.unmount()

    renderCards({ efficiencyTip: { tip: 'Keep going', current: false } })
    expect(
      await screen.findByRole('button', { name: 'Get a new tip' }),
    ).toBeTruthy()
  })

  it('Cancel closes a goal or plan form without submitting it', async () => {
    renderCards()
    fireEvent.click(await screen.findByRole('button', { name: 'Add goal' }))
    fireEvent.change(screen.getByLabelText(/^Goal/), {
      target: { value: 'Half typed' },
    })
    fireEvent.change(screen.getByLabelText(/^Due date/), {
      target: { value: '2099-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull(),
    )
    expect(mocks.addGoal).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    fireEvent.change(screen.getByLabelText(/^Weak area/), {
      target: { value: 'Half typed' },
    })
    fireEvent.change(screen.getByLabelText('Action'), {
      target: { value: 'Half typed' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull(),
    )
    expect(mocks.addDevelopmentItem).not.toHaveBeenCalled()
  })

  it('approves with the version that was read', async () => {
    mocks.approveGoal.mockResolvedValue({
      ...performance.goals[0],
      status: 'approved',
      approvedByName: 'Mo',
    })
    renderCards()
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await waitFor(() =>
      expect(mocks.approveGoal).toHaveBeenCalledWith('/base', 'g-1', 3),
    )
    expect(await screen.findByText(/Approved by Mo/)).toBeTruthy()
  })

  it('reloads and says why when someone else changed the goal', async () => {
    mocks.approveGoal.mockRejectedValue({
      response: {
        status: 409,
        data: { error: { message: 'Someone changed this goal' } },
      },
    })
    renderCards()
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith(
        'error',
        'Someone changed this goal',
      ),
    )
    await waitFor(() =>
      expect(mocks.fetchPerformance.mock.calls.length).toBeGreaterThan(1),
    )
  })

  it('re-fetches after a network failure in case the AI saved anyway', async () => {
    mocks.suggestGoals.mockRejectedValue(new Error('Network Error'))
    renderCards()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Suggest goals' }),
    )
    await waitFor(() =>
      expect(mocks.fetchPerformance.mock.calls.length).toBeGreaterThan(1),
    )
    expect(mocks.notify).toHaveBeenCalledWith(
      'error',
      'Could not suggest goals. Please try again.',
    )
  })

  it('does not re-fetch on a plain refusal, which would log another read', async () => {
    mocks.approveGoal.mockRejectedValue({ response: { status: 400 } })
    renderCards()
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await waitFor(() => expect(mocks.notify).toHaveBeenCalled())
    expect(mocks.fetchPerformance).toHaveBeenCalledTimes(1)
  })

  it('merges suggested drafts without duplicating ones on screen', async () => {
    mocks.suggestGoals.mockResolvedValue([performance.goals[0]])
    renderCards()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Suggest goals' }),
    )
    await waitFor(() => expect(mocks.suggestGoals).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.getAllByText('Ship the redesign')).toHaveLength(1),
    )
  })

  it('shows report text as plain text, never as markup', async () => {
    const { container } = renderCards()
    await screen.findByText(/Shipped <b>page<\/b>/)
    expect(container.querySelector('b')).toBeNull()
  })

  it('sends both versions with a manager note', async () => {
    mocks.saveReportNote.mockResolvedValue({
      ...performance.reports.items[0],
      managerNote: 'Nice',
      managerNoteByName: 'Mo',
      noteVersion: 1,
    })
    renderCards()
    fireEvent.change(await screen.findByLabelText('Your note'), {
      target: { value: ' Nice ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }))
    await waitFor(() =>
      expect(mocks.saveReportNote).toHaveBeenCalledWith(
        '/base',
        'r-1',
        'Nice',
        2,
        0,
      ),
    )
    expect(await screen.findByText('Note from Mo:')).toBeTruthy()
  })

  it('accepts a proposal by moving it to open', async () => {
    mocks.editDevelopmentItem.mockResolvedValue({
      ...performance.development[0],
      status: 'open',
    })
    renderCards()
    fireEvent.click(await screen.findByRole('button', { name: 'Accept' }))
    await waitFor(() =>
      expect(mocks.editDevelopmentItem).toHaveBeenCalledWith(
        '/base',
        performance.development[0],
        'open',
      ),
    )
    expect(await screen.findByText('Open')).toBeTruthy()
  })

  it('saves feedback with the version of the month chosen, and needs a rating', async () => {
    mocks.saveFeedback.mockResolvedValue({
      id: 'f-1',
      month: '2026-10',
      rating: 5,
      notes: 'New',
      byName: 'Mo',
      version: 3,
      updatedAt: '',
    })
    renderCards({
      feedback: [
        {
          id: 'f-1',
          month: '2026-10',
          rating: 2,
          notes: 'Old',
          byName: 'Mo',
          version: 2,
          updatedAt: '',
        },
      ],
    })
    fireEvent.change(await screen.findByLabelText('Month'), {
      target: { value: '2026-10' },
    })
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
      'Old',
    )
    fireEvent.change(screen.getByLabelText('Rating from 1 to 5'), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Update feedback' }))
    await waitFor(() =>
      expect(mocks.saveFeedback).toHaveBeenCalledWith('/base', '2026-10', {
        rating: 5,
        notes: 'Old',
        version: 2,
      }),
    )
  })

  it('makes everything read-only for someone who has left', async () => {
    renderCards({}, { readOnly: true, hr: true })
    await screen.findByText('Ship the redesign')
    for (const name of [
      'Approve',
      'Suggest goals',
      'Add goal',
      'Save note',
      'Accept',
      'Write with AI',
      'Save feedback',
      'Get a tip',
    ]) {
      expect(screen.queryByRole('button', { name })).toBeNull()
    }
  })

  it('gives a manager no way to edit the job description', async () => {
    renderCards()
    await screen.findByText('No job description yet.')
    expect(screen.queryByRole('button', { name: 'Write with AI' })).toBeNull()
  })

  it('lets HR draft with AI and saves nothing until Save', async () => {
    mocks.writeJobDescription.mockResolvedValue({ body: 'Leads design' })
    mocks.saveJobDescription.mockResolvedValue({
      body: 'Leads design',
      version: 1,
      updatedByName: 'H',
      updatedAt: '',
    })
    renderCards({}, { hr: true })
    fireEvent.click(
      await screen.findByRole('button', { name: 'Write with AI' }),
    )
    expect(await screen.findByDisplayValue('Leads design')).toBeTruthy()
    expect(mocks.saveJobDescription).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(mocks.saveJobDescription).toHaveBeenCalledWith(
        'o',
        's-1',
        'Leads design',
        null,
      ),
    )
  })

  describe('completion requests', () => {
    const approvedGoal = {
      ...performance.goals[0]!,
      status: 'approved' as const,
      approvedAt: 'now',
    }
    const waiting = {
      id: 'r-1',
      itemType: 'goal' as const,
      itemId: 'g-1',
      itemTitle: 'Ship the redesign',
      summary: 'I shipped it.',
      links: ['https://example.com/report'],
      files: [
        { id: 'f-1', name: 'proof.pdf', mimeType: 'application/pdf', size: 10 },
      ],
      status: 'pending' as const,
      reviewNote: null,
      reviewedByName: null,
      reviewedAt: null,
      createdAt: '2026-11-01T00:00:00.000Z',
    }

    it('lets a read-only assigned HR review, with nothing else to edit', async () => {
      renderCards(
        { goals: [approvedGoal], completionRequests: [waiting] },
        { readOnly: true, canReview: true },
      )

      expect(await screen.findByText('Completion requests')).toBeTruthy()
      expect(screen.getByText('I shipped it.')).toBeTruthy()
      const link = screen.getByRole('link', {
        name: 'https://example.com/report',
      })
      expect(link.getAttribute('rel')).toBe('noopener noreferrer nofollow')
      expect(screen.queryByRole('button', { name: 'Add goal' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
    })

    it('sends the goal version with an approval and shows the result', async () => {
      mocks.approveCompletion.mockResolvedValue({
        goal: {
          ...approvedGoal,
          progress: 100,
          completedAt: 'now',
          completedByName: 'Hana',
        },
        task: null,
        request: { ...waiting, status: 'approved' },
      })
      renderCards(
        { goals: [approvedGoal], completionRequests: [waiting] },
        { readOnly: true, canReview: true },
      )

      const list = await screen.findByText('Completion requests')
      expect(list).toBeTruthy()
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Mark complete' })[0]!,
      )

      await waitFor(() =>
        expect(mocks.approveCompletion).toHaveBeenCalledWith('/base', 'r-1', {
          version: 3,
          note: null,
        }),
      )
      expect(await screen.findByText('Complete')).toBeTruthy()
      await waitFor(() =>
        expect(screen.queryByText('Completion requests')).toBeNull(),
      )
    })

    it('needs a note before sending work back', async () => {
      renderCards(
        { goals: [approvedGoal], completionRequests: [waiting] },
        { readOnly: true, canReview: true },
      )

      fireEvent.click(await screen.findByRole('button', { name: 'Send back' }))

      expect(
        await screen.findByText('Add a note saying what they need to change'),
      ).toBeTruthy()
      expect(mocks.returnCompletion).not.toHaveBeenCalled()
    })

    it('hides review actions when reviewing is not allowed', async () => {
      renderCards(
        { goals: [approvedGoal], completionRequests: [waiting] },
        { readOnly: true, canReview: false },
      )

      expect(await screen.findByText('Goals')).toBeTruthy()
      expect(screen.queryByText('Completion requests')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Mark complete' })).toBeNull()
    })

    it('offers to reopen a completed goal', async () => {
      mocks.reopenGoal.mockResolvedValue({
        goal: { ...approvedGoal, progress: 40 },
        task: null,
        request: null,
      })
      renderCards(
        {
          goals: [
            {
              ...approvedGoal,
              progress: 100,
              completedAt: 'now',
              completedByName: 'Hana',
            },
          ],
        },
        { readOnly: true, canReview: true },
      )

      expect(await screen.findByText(/Marked complete by Hana/)).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Reopen' }))

      await waitFor(() =>
        expect(mocks.reopenGoal).toHaveBeenCalledWith('/base', 'g-1'),
      )
    })
  })
})
