import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DefaultChecklist } from './DefaultChecklist'

const mocks = vi.hoisted(() => ({
  saveDefaultChecklist: vi.fn(),
}))

vi.mock('@/features/people/hooks/usePeopleAccess', () => ({
  usePeopleAccess: () => ({ organizationId: 'o-1' }),
}))
vi.mock('@/features/people/hooks/useStaffData', () => ({
  useChecklistDefaults: () => ({
    isLoading: false,
    items: [
      {
        title: 'Collect your laptop',
        dueInDays: 0,
        description: 'IT hands it over',
        owner: 'it',
      },
      { title: 'Meet your team', dueInDays: 2, owner: 'manager' },
    ],
  }),
}))
vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    saveDefaultChecklist: mocks.saveDefaultChecklist,
    isSaving: false,
  }),
}))

const show = () =>
  render(
    <MemoryRouter>
      <DefaultChecklist />
    </MemoryRouter>,
  )

describe('DefaultChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.saveDefaultChecklist.mockResolvedValue([])
  })

  it('shows each task with who it applies to, the day it is due and its owner', () => {
    show()
    expect(
      screen.getByText(
        'These tasks are added to every new hire. Change them here and new hires get the new list.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('2 tasks')).toBeTruthy()
    expect(screen.getByText('Day 1')).toBeTruthy()
    expect(screen.getByText('Day 3')).toBeTruthy()
    expect(screen.getByText('IT')).toBeTruthy()
    expect(screen.getByText('The manager')).toBeTruthy()
    expect(screen.getAllByText('Everyone').length).toBeGreaterThan(0)
  })

  it('adds a task to the end of the whole list', async () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    fireEvent.change(screen.getByLabelText('Task'), {
      target: { value: 'Read the welcome pack' },
    })
    fireEvent.change(screen.getByLabelText('Days after start'), {
      target: { value: '1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
    await waitFor(() =>
      expect(mocks.saveDefaultChecklist).toHaveBeenCalledWith([
        {
          title: 'Collect your laptop',
          dueInDays: 0,
          description: 'IT hands it over',
          owner: 'it',
        },
        { title: 'Meet your team', dueInDays: 2, owner: 'manager' },
        {
          title: 'Read the welcome pack',
          description: null,
          owner: null,
          dueInDays: 1,
        },
      ]),
    )
  })

  it('removes one task and keeps the others', async () => {
    show()
    fireEvent.click(screen.getAllByLabelText('Task actions')[0]!)
    fireEvent.click(screen.getByText('Remove'))
    await waitFor(() =>
      expect(mocks.saveDefaultChecklist).toHaveBeenCalledWith([
        { title: 'Meet your team', dueInDays: 2, owner: 'manager' },
      ]),
    )
  })
})
