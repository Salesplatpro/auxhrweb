import { describe, expect, it } from 'vitest'

import {
  buildBuilderBaseline,
  buildBuilderValues,
  buildProfilePatch,
  cvFileError,
  formatSalaryRange,
  profileBuilderSchema,
  roleCapFor,
  rolesLocked,
  splitFullName,
} from './profileBuilder'

const profile = {
  firstName: 'Tunde',
  lastName: 'Bakare',
  bio: 'Data analyst',
  userRoles: [{ id: 'r1' }, { id: 'r2' }],
  experience: '4-6 years',
  workType: ['hybrid' as const],
  locationCountry: 'Nigeria',
  minSalary: 6000000,
  maxSalary: 9000000,
  currency: 'NGN',
  compensationPeriod: 'yearly',
}

describe('profile builder helpers', () => {
  it('splits a full name into first and last name', () => {
    expect(splitFullName('  Mary   Jane Smith ')).toEqual({
      firstName: 'Mary',
      lastName: 'Jane Smith',
    })
  })

  it('rejects a one-word name', async () => {
    await expect(
      profileBuilderSchema.validateAt('fullName', { fullName: 'Tunde' }),
    ).rejects.toThrow('Enter your first and last name')
  })

  it('sends nothing when nothing changed', () => {
    const baseline = buildBuilderBaseline(profile)
    expect(buildProfilePatch(baseline, { ...baseline })).toEqual({})
  })

  it('does not resend roles picked in another order', () => {
    const baseline = buildBuilderValues(profile)
    const patch = buildProfilePatch(baseline, {
      ...baseline,
      role: ['r2', 'r1'],
    })
    expect(patch).not.toHaveProperty('roleIds')
  })

  it('sends the name only when it changed', () => {
    const baseline = buildBuilderValues(profile)
    expect(
      buildProfilePatch(baseline, { ...baseline, fullName: 'Tunde B Bakare' }),
    ).toEqual({ firstName: 'Tunde', lastName: 'B Bakare' })
  })

  it('saves the default currency and pay period for a new profile', () => {
    const patch = buildProfilePatch(
      buildBuilderBaseline({}),
      buildBuilderValues({}),
    )
    expect(patch).toMatchObject({
      currency: 'NGN',
      compensationPeriod: 'yearly',
    })
  })

  it('defaults the pay period to yearly for a new profile', () => {
    expect(buildBuilderValues({}).compensationPeriod).toBe('yearly')
    expect(
      buildBuilderValues({ compensationPeriod: 'monthly' }).compensationPeriod,
    ).toBe('monthly')
  })

  it('keeps more than three existing roles but caps new picks at three', () => {
    expect(roleCapFor(1)).toBe(3)
    expect(roleCapFor(5)).toBe(5)
  })

  it('locks roles once the change limit is used up', () => {
    expect(rolesLocked({ roleChangeCount: 3 })).toBe(true)
    expect(rolesLocked({ roleChangeCount: 2 })).toBe(false)
  })

  it('checks salary order and ceiling', async () => {
    await expect(
      profileBuilderSchema.validateAt('maxSalary', {
        minSalary: '9000000',
        maxSalary: '6000000',
      }),
    ).rejects.toThrow('Maximum salary must be more than the minimum')
    await expect(
      profileBuilderSchema.validateAt('minSalary', { minSalary: '100000001' }),
    ).rejects.toThrow('Salary must be 100,000,000 or less')
  })

  it('accepts only PDF or DOCX up to 5 MB', () => {
    const file = (name: string, size: number) =>
      Object.defineProperty(new File(['x'], name), 'size', { value: size })
    expect(cvFileError(file('cv.pdf', 1024))).toBeUndefined()
    expect(cvFileError(file('cv.DOCX', 1024))).toBeUndefined()
    expect(cvFileError(file('cv.png', 1024))).toBe('Upload a PDF or DOCX file.')
    expect(cvFileError(file('cv.pdf', 5 * 1024 * 1024 + 1))).toBe(
      'Your CV must be 5 MB or smaller.',
    )
  })

  it('formats the salary range for the preview', () => {
    expect(formatSalaryRange('NGN', '6000000', '9000000', 'yearly')).toBe(
      '₦6M to ₦9M a year',
    )
    expect(formatSalaryRange('NGN', '', '9000000', 'yearly')).toBeUndefined()
  })
})
