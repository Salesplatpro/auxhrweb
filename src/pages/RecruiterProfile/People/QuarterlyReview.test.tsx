import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { SWRConfig } from 'swr'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuarterlyReviewPerson } from '@/features/people/types'

import { QuarterlyReview, sortPeople } from './QuarterlyReview'

const mocks = vi.hoisted(() => ({
  fetchQuarterlyReview: vi.fn(),
  saveQuarterGoal: vi.fn(),
}))

vi.mock('@/features/people/services/peopleService', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...mocks,
}))
vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'o-1' }),
}))
vi.mock('@/utils/toastNotifications', () => ({ notify: vi.fn() }))

const person = (
  fullName: string,
  overrides: Partial<QuarterlyReviewPerson> = {},
): QuarterlyReviewPerson => ({
  staffId: fullName,
  fullName,
  jobTitle: 'Role',
  department: null,
  goalProgress: 50,
  score: 60,
  partial: false,
  capacity: 'medium',
  ...overrides,
})

const review = {
  quarter: '2026-Q4',
  goal: null,
  revenuePercent: null,
  teamProgress: null,
  people: [] as QuarterlyReviewPerson[],
  truncated: false,
}

const renderPage = (overrides: Partial<typeof review> = {}) => {
  mocks.fetchQuarterlyReview.mockResolvedValue({ ...review, ...overrides })
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <QuarterlyReview />
    </SWRConfig>,
  )
}

describe('sortPeople', () => {
  const people = [
    person('A', { score: null, capacity: 'high' }),
    person('B', { score: 90, capacity: 'low' }),
    person('C', { score: 10, capacity: 'not_enough_data' }),
  ]

  it('keeps people with no number at the bottom both ways', () => {
    expect(sortPeople(people, 'score', true).map((p) => p.fullName)).toEqual([
      'C',
      'B',
      'A',
    ])
    expect(sortPeople(people, 'score', false).map((p) => p.fullName)).toEqual([
      'B',
      'C',
      'A',
    ])
  })

  it('orders capacity by meaning, not spelling', () => {
    expect(sortPeople(people, 'capacity', true).map((p) => p.fullName)).toEqual(
      ['C', 'B', 'A'],
    )
  })

  it('does not change the list it was given', () => {
    sortPeople(people, 'score', true)
    expect(people[0]!.fullName).toBe('A')
  })
})

describe('QuarterlyReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles no goal and no staff', async () => {
    renderPage()
    expect(await screen.findByText('No goal set')).toBeTruthy()
    expect(screen.getByText('No goals yet')).toBeTruthy()
    expect(screen.getByText('No current staff yet.')).toBeTruthy()
  })

  it('shows revenue above 100% truthfully, marks partial scores and the guide', async () => {
    renderPage({
      goal: {
        quarter: '2026-Q4',
        currency: 'NGN',
        revenueGoal: 100,
        revenueSoFar: 150,
        version: 1,
        updatedByName: 'H',
        updatedAt: '',
      } as never,
      revenuePercent: 150 as never,
      teamProgress: 40 as never,
      people: [
        person('Ada', { partial: true, capacity: 'high' }),
        person('Bo', { score: null }),
      ],
    })
    expect(await screen.findByText('150%')).toBeTruthy()
    expect(screen.getByText('Partial')).toBeTruthy()
    expect(screen.getByText('Not enough data')).toBeTruthy()
    expect(screen.getByText(/Directional/)).toBeTruthy()
    expect(screen.getByText('High')).toBeTruthy()
  })

  it('sorts when a column is clicked, and reverses on a second click', async () => {
    renderPage({
      people: [person('Ada', { score: 10 }), person('Bo', { score: 90 })],
    })
    await screen.findByText('Ada')
    const names = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent)
    fireEvent.click(screen.getByRole('button', { name: 'Efficiency' }))
    expect(names()[0]).toContain('Ada')
    fireEvent.click(screen.getByRole('button', { name: 'Efficiency' }))
    expect(names()[0]).toContain('Bo')
  })

  it('blocks a goal of 0 or a negative amount, and saves a valid one', async () => {
    mocks.saveQuarterGoal.mockResolvedValue({
      quarter: '2026-Q4',
      currency: 'NGN',
      revenueGoal: 1000,
      revenueSoFar: 250,
      version: 1,
      updatedByName: 'H',
      updatedAt: '',
    })
    renderPage()
    const goal = await screen.findByLabelText('Revenue goal')
    const soFar = screen.getByLabelText('Revenue so far')
    const save = screen.getByRole('button', {
      name: 'Save',
    }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.change(goal, { target: { value: '0' } })
    expect(save.disabled).toBe(true)
    fireEvent.change(goal, { target: { value: '1000' } })
    fireEvent.change(soFar, { target: { value: '-1' } })
    expect(save.disabled).toBe(true)
    fireEvent.change(soFar, { target: { value: '250' } })
    fireEvent.click(save)
    await waitFor(() =>
      expect(mocks.saveQuarterGoal).toHaveBeenCalledWith('o-1', {
        quarter: expect.any(String),
        currency: 'NGN',
        revenueGoal: 1000,
        revenueSoFar: 250,
        version: null,
      }),
    )
    expect(await screen.findByText('25%')).toBeTruthy()
  })

  it('loads the chosen quarter', async () => {
    renderPage()
    const select = (await screen.findByLabelText(
      'Quarter',
    )) as HTMLSelectElement
    const other = Array.from(select.options)[0]!.value
    fireEvent.change(select, { target: { value: other } })
    await waitFor(() =>
      expect(mocks.fetchQuarterlyReview).toHaveBeenCalledWith('o-1', other),
    )
  })

  it('explains a load failure and a cut-off list', async () => {
    renderPage({ truncated: true, people: [person('Ada')] })
    expect(await screen.findByText(/first 1,000/)).toBeTruthy()
  })
})
