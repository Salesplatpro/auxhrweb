import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChecklistTask, StaffMember } from '@/features/people/types'

import { ChecklistTab } from './ChecklistTab'

const mocks = vi.hoisted(() => ({
  tasks: [] as ChecklistTask[],
  addTask: vi.fn(),
  removeTask: vi.fn(),
}))

vi.mock('@/features/people/hooks/useStaffData', () => ({
  useChecklist: () => ({
    tasks: mocks.tasks,
    isLoading: false,
    hasError: false,
    reload: vi.fn(),
  }),
}))
vi.mock('@/features/people/hooks/useStaffActions', () => ({
  useStaffActions: () => ({
    addTask: mocks.addTask,
    removeTask: mocks.removeTask,
    isSaving: false,
  }),
}))

const staff = {
  id: 's-1',
  fullName: 'Ada Obi',
  status: 'active',
} as StaffMember

const task = (overrides: Partial<ChecklistTask>): ChecklistTask => ({
  id: 't',
  title: 'Task',
  dueOn: '2026-11-03',
  doneAt: null,
  ...overrides,
})

const renderTab = () =>
  render(
    <MemoryRouter>
      <ChecklistTab staff={staff} organizationId="org-1" canEdit />
    </MemoryRouter>,
  )

describe('ChecklistTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.tasks = [
      task({
        id: '1',
        title: 'Collect your laptop',
        description: 'IT hands it over',
        status: 'done',
        doneAt: '2026-11-03T10:00:00Z',
        ownerName: 'Chidi Eze',
      }),
      task({
        id: '2',
        title: 'Meet your team',
        description: '30 minute intro call',
        status: 'not_done',
        ownerName: 'Tunde Bakare',
      }),
      task({
        id: '3',
        title: 'Set up your work email',
        status: 'late',
        ownerName: 'Chidi Eze',
      }),
    ]
  })

  it('lists tasks with their note, a Done, Not done or Late status, and the owner', () => {
    renderTab()
    expect(screen.getByText('3 tasks · 1 done')).toBeTruthy()
    expect(screen.getByText('IT hands it over')).toBeTruthy()
    for (const label of ['Done', 'Not done', 'Late']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText('Chidi Eze')).toHaveLength(2)
  })

  it('searches tasks and filters by status', () => {
    renderTab()
    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: { value: 'team' },
    })
    expect(screen.getByText('Meet your team')).toBeTruthy()
    expect(screen.queryByText('Collect your laptop')).toBeNull()

    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByText('Status: All'))
    const late = screen.getAllByText('Late')
    fireEvent.click(late[late.length - 1]!)
    expect(screen.getByText('Set up your work email')).toBeTruthy()
    expect(screen.queryByText('Meet your team')).toBeNull()
  })

  it('adds a task with a note, an owner and a due date', async () => {
    mocks.addTask.mockResolvedValue({ id: 'new' })
    renderTab()
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    fireEvent.change(screen.getByLabelText('Task'), {
      target: { value: 'Read the welcome pack' },
    })
    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: 'Welcome pack PDF' },
    })
    fireEvent.change(screen.getByLabelText('Due date'), {
      target: { value: '2026-11-10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Choose an owner' }))
    fireEvent.click(screen.getByText('The new hire'))
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
    await vi.waitFor(() =>
      expect(mocks.addTask).toHaveBeenCalledWith('s-1', {
        title: 'Read the welcome pack',
        dueOn: '2026-11-10',
        description: 'Welcome pack PDF',
        owner: 'new_hire',
      }),
    )
  })

  it('refuses a task with no name', () => {
    renderTab()
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))
    expect(mocks.addTask).not.toHaveBeenCalled()
    expect(screen.getByText('Name the task')).toBeTruthy()
  })
})
