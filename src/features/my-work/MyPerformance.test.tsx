import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MyPerformance as MyPerformanceData } from '@/features/people/types'

import { MyPerformance } from './MyPerformance'

const mocks = vi.hoisted(() => ({
  fetchMyPerformance: vi.fn(),
  submitMyReport: vi.fn(),
  requestMyAdvice: vi.fn(),
  setMyGoalProgress: vi.fn(),
  setMyDevelopmentDone: vi.fn(),
  notify: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...mocks,
}))

vi.mock('@/utils/toastNotifications', () => ({ notify: mocks.notify }))

const WEEK = '2026-11-02'

const report = {
  id: 'r-1',
  weekStart: WEEK,
  did: 'Shipped',
  blocked: '',
  nextWeek: '',
  textVersion: 1,
  submittedAt: '',
  managerNote: null,
  managerNoteByName: null,
  managerNoteAt: null,
  noteVersion: 0,
  advice: null,
  adviceAt: null,
}

const base: MyPerformanceData = {
  staffId: 's-1',
  isExecutive: false,
  currentWeek: WEEK,
  jobDescription: null,
  goals: [],
  reports: { items: [], total: 0 },
  development: [],
  feedback: [],
  completionRequests: [],
}

const renderPage = (overrides: Partial<MyPerformanceData> = {}) => {
  mocks.fetchMyPerformance.mockResolvedValue({ ...base, ...overrides })
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <MyPerformance staffId="s-1" />
    </SWRConfig>,
  )
}

describe('MyPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("submits to the server's current week, then offers advice", async () => {
    mocks.submitMyReport.mockResolvedValue(report)
    renderPage()
    fireEvent.change(await screen.findByLabelText('What I did'), {
      target: { value: ' Shipped ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(mocks.submitMyReport).toHaveBeenCalledWith('s-1', WEEK, {
        did: 'Shipped',
        blocked: '',
        nextWeek: '',
      }),
    )
    expect(
      await screen.findByRole('button', { name: 'Get advice' }),
    ).toBeTruthy()
  })

  it('refuses an empty report before calling the server', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Submit' }))
    expect(await screen.findByText('Write what you did')).toBeTruthy()
    expect(mocks.submitMyReport).not.toHaveBeenCalled()
  })

  it('hides advice for an executive', async () => {
    renderPage({
      isExecutive: true,
      reports: { items: [report], total: 1 },
    })
    await screen.findByRole('button', { name: 'Update report' })
    expect(screen.queryByRole('button', { name: 'Get advice' })).toBeNull()
  })

  it('shows tips without an empty report label, and no second button', async () => {
    mocks.requestMyAdvice.mockResolvedValue({
      ...report,
      advice: ['Tip one', 'Tip two', 'Tip three'],
    })
    renderPage({ reports: { items: [report], total: 1 } })
    fireEvent.click(await screen.findByRole('button', { name: 'Get advice' }))
    expect(await screen.findByText('Tip one')).toBeTruthy()
    expect(screen.getByText('AI suggestion')).toBeTruthy()
    expect(screen.queryByText('What I did:')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Get advice' })).toBeNull()
  })

  it('locks the form once the manager has added a note', async () => {
    renderPage({
      reports: {
        items: [
          { ...report, managerNote: 'Nice work', managerNoteByName: 'Mo' },
        ],
        total: 1,
      },
    })
    expect(await screen.findByText('Nice work')).toBeTruthy()
    expect(screen.queryByLabelText('What I did')).toBeNull()
  })

  it('keeps what was typed when submitting fails, and reloads on a conflict', async () => {
    mocks.submitMyReport.mockRejectedValue({
      response: {
        status: 409,
        data: { error: { message: 'Reports for this week are closed' } },
      },
    })
    renderPage()
    const box = (await screen.findByLabelText(
      'What I did',
    )) as HTMLTextAreaElement
    fireEvent.change(box, { target: { value: 'My long report' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith(
        'error',
        'Reports for this week are closed',
      ),
    )
    expect(
      (screen.getByLabelText('What I did') as HTMLTextAreaElement).value,
    ).toBe('My long report')
  })

  it('saves goal progress only for a whole number from 0 to 99', async () => {
    mocks.setMyGoalProgress.mockResolvedValue({
      id: 'g-1',
      title: 'Ship it',
      keyResults: [],
      target: null,
      dueOn: '2099-01-01',
      progress: 99,
      status: 'approved',
      source: 'manual',
      version: 1,
      approvedByName: 'Mo',
      approvedAt: 'now',
    })
    renderPage({
      goals: [
        {
          id: 'g-1',
          title: 'Ship it',
          keyResults: [],
          target: null,
          dueOn: '2099-01-01',
          progress: 40,
          status: 'approved',
          source: 'manual',
          version: 1,
          approvedByName: 'Mo',
          approvedAt: 'now',
          completedAt: null,
          completedByName: null,
        },
      ],
    })
    const input = await screen.findByLabelText('Percent done on Ship it')
    const save = screen.getByRole('button', { name: 'Save' })
    expect((save as HTMLButtonElement).disabled).toBe(true)
    for (const bad of ['100', '101', '-1', '5.5', '']) {
      fireEvent.change(input, { target: { value: bad } })
      expect((save as HTMLButtonElement).disabled).toBe(true)
    }
    fireEvent.change(input, { target: { value: '99' } })
    fireEvent.click(save)
    await waitFor(() =>
      expect(mocks.setMyGoalProgress).toHaveBeenCalledWith('s-1', 'g-1', 99),
    )
    expect(
      (
        await screen.findByRole('progressbar', {
          name: 'Progress on Ship it',
        })
      ).getAttribute('aria-valuenow'),
    ).toBe('99')
  })

  it('lets the employee tick off a plan item and read their feedback', async () => {
    mocks.setMyDevelopmentDone.mockResolvedValue({
      id: 'd-1',
      weakArea: 'SQL',
      action: 'Course',
      dueOn: null,
      status: 'done',
      source: 'manual',
      version: 1,
    })
    renderPage({
      development: [
        {
          id: 'd-1',
          weakArea: 'SQL',
          action: 'Course',
          dueOn: null,
          status: 'open',
          source: 'manual',
          version: 1,
        },
      ],
      feedback: [
        {
          id: 'f-1',
          month: '2026-10',
          rating: 4,
          notes: 'Solid month',
          byName: 'Mo',
          version: 1,
          updatedAt: '',
        },
      ],
    })
    expect(await screen.findByText('Solid month')).toBeTruthy()
    expect(screen.getByText('2026-10: 4 / 5')).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox'))
    await waitFor(() =>
      expect(mocks.setMyDevelopmentDone).toHaveBeenCalledWith(
        's-1',
        'd-1',
        true,
      ),
    )
  })

  it('explains a load failure', async () => {
    mocks.fetchMyPerformance.mockRejectedValue(new Error('down'))
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <MyPerformance staffId="s-1" />
      </SWRConfig>,
    )
    expect(
      await screen.findByText("Couldn't load your goals and reports"),
    ).toBeTruthy()
  })
})
