import { describe, expect, it } from 'vitest'

import { describeStaffChange } from './staffChanges'

const before = {
  fullName: 'Ada Obi',
  email: 'ada@kosanatech.ng',
  jobTitle: 'Product Designer',
  department: 'Design',
  managerId: 'm-1',
  startDate: '2025-02-03',
  isExecutive: false,
  phone: '',
  homeAddress: '',
}

const managers: Record<string, string> = { 'm-2': 'Tunde Bakare' }
const describeChange = (after: Partial<typeof before>) =>
  describeStaffChange(before, { ...before, ...after }, (id) => managers[id])

describe('describeStaffChange', () => {
  it('names the one field that changed', () => {
    expect(describeChange({ jobTitle: 'Senior Product Designer' })).toBe(
      "Ada's job title is now Senior Product Designer.",
    )
    expect(describeChange({ managerId: 'm-2' })).toBe(
      "Ada's manager is now Tunde Bakare.",
    )
    expect(describeChange({ startDate: '2025-03-01' })).toBe(
      "Ada's start date is now 1 Mar 2025.",
    )
    expect(describeChange({ isExecutive: true })).toBe(
      'Ada is now marked as an executive.',
    )
    expect(describeChange({ department: '' })).toBe(
      "Ada's department was removed.",
    )
  })

  it('says nothing extra when several fields or none changed', () => {
    expect(
      describeChange({ jobTitle: 'Lead', phone: '+2348035550198' }),
    ).toBeUndefined()
    expect(describeChange({ jobTitle: ' Product Designer ' })).toBeUndefined()
  })
})
