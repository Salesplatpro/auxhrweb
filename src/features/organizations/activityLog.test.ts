import { describe, expect, it } from 'vitest'

import {
  actionLabel,
  activityKey,
  changedText,
  CompanyActivityEntry,
  fieldLabel,
  targetText,
} from './activityLog'

const entry = (overrides: Partial<CompanyActivityEntry> = {}) => ({
  id: '1',
  createdAt: '2026-11-21T10:00:00Z',
  actorId: 'u1',
  actorName: 'Ada Obi',
  action: 'update job',
  targetType: 'job',
  targetId: 'j1',
  targetLabel: 'Sales Lead',
  changedFields: ['jobBrief', 'max_salary'],
  ip: null,
  ...overrides,
})

describe('company activity log rows', () => {
  it('reads field names as words', () => {
    expect(fieldLabel('jobBrief')).toBe('job brief')
    expect(fieldLabel('max_salary')).toBe('max salary')
    expect(changedText(entry().changedFields)).toBe('job brief, max salary')
    expect(changedText([])).toBe('—')
  })

  it('names the item with its kind when known', () => {
    expect(targetText(entry())).toBe('Job: Sales Lead')
    expect(targetText(entry({ targetType: 'other', targetLabel: 'X' }))).toBe(
      'X',
    )
    expect(targetText(entry({ targetLabel: null }))).toBe('Job')
    expect(targetText(entry({ targetLabel: null, targetType: null }))).toBe('—')
  })

  it('starts the action with a capital and skips empty filters in the key', () => {
    expect(actionLabel('update job')).toBe('Update job')
    expect(
      activityKey('org', {
        actorId: '',
        search: 'job',
        from: '',
        to: '',
        limit: 15,
        offset: 0,
      }),
    ).toBe('/organizations/org/activity?search=job&limit=15&offset=0')
  })
})
