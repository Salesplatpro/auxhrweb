import { describe, expect, it } from 'vitest'

import type { ChecklistTask } from '../types'
import {
  dayLabel,
  matchesSearch,
  ownerLabel,
  STATUS_FILTERS,
  TASK_STATUS,
  taskStatusOf,
} from './checklistRules'

const task = (overrides: Partial<ChecklistTask> = {}): ChecklistTask => ({
  id: 't-1',
  title: 'Collect your laptop',
  dueOn: '2026-11-03',
  doneAt: null,
  ...overrides,
})

describe('checklist rules', () => {
  it('uses the status the server worked out, and falls back to done or not done', () => {
    expect(taskStatusOf(task({ status: 'late' }))).toBe('late')
    expect(taskStatusOf(task({ doneAt: '2026-11-04T10:00:00Z' }))).toBe('done')
    expect(taskStatusOf(task())).toBe('not_done')
    expect(Object.values(TASK_STATUS).map((status) => status.label)).toEqual([
      'Done',
      'Not done',
      'Late',
    ])
    expect(STATUS_FILTERS.map((filter) => filter.label)).toEqual([
      'All',
      'Done',
      'Not done',
      'Late',
    ])
  })

  it('counts days from day one', () => {
    expect(dayLabel(0)).toBe('Day 1')
    expect(dayLabel(2)).toBe('Day 3')
  })

  it('names owners', () => {
    expect(ownerLabel('new_hire')).toBe('The new hire')
    expect(ownerLabel(null)).toBe('—')
  })

  it('searches any part of a task, ignoring case', () => {
    expect(
      matchesSearch(['Collect your laptop', 'IT hands it over'], 'LAPTOP'),
    ).toBe(true)
    expect(matchesSearch(['Collect your laptop'], 'email')).toBe(false)
    expect(matchesSearch(['x'], '  ')).toBe(true)
  })
})
