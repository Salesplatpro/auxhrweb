import { describe, expect, it } from 'vitest'

import {
  EMPTY_JOB_FORM,
  jobFormToPayload,
  jobToFormValues,
} from './jobFormValues'

describe('jobToFormValues', () => {
  it('maps an API job onto the form', () => {
    const values = jobToFormValues({
      jobBrief: '<p>Brief</p>',
      role: { id: 'role-1', name: 'engineer' },
      requirements: '<p>Req</p>',
      minSalary: 100,
      maxSalary: null,
      compensationPeriod: 'monthly',
      currency: 'USD',
      workMode: ['onSite'],
      experienceLevel: '1-3 years',
      locationCountry: 'Nigeria',
      skills: ['Go'],
      goals: null,
    })
    expect(values).toMatchObject({
      role: 'role-1',
      minSalary: '100',
      maxSalary: '',
      workMode: ['onSite'],
      goals: [],
    })
    expect(values.location.country.name).toBe('Nigeria')
  })

  it('maps the department, job type, closing date and share options', () => {
    expect(
      jobToFormValues({
        department: 'Design',
        employmentType: 'contract',
        closesAt: '2026-11-24',
        shareOptions: true,
      }),
    ).toMatchObject({
      department: 'Design',
      employmentType: 'contract',
      closesAt: '2026-11-24',
      shareOptions: true,
    })
    expect(jobToFormValues({})).toMatchObject({
      department: '',
      employmentType: 'full_time',
      closesAt: '',
      shareOptions: false,
    })
  })

  it('accepts a legacy single work mode string and defaults the period', () => {
    const values = jobToFormValues({ workMode: 'remote' })
    expect(values.workMode).toEqual(['remote'])
    expect(values.compensationPeriod).toBe('yearly')
  })
})

describe('jobFormToPayload', () => {
  it('drops an empty max salary and clears location for remote jobs', () => {
    const payload = jobFormToPayload({
      ...EMPTY_JOB_FORM,
      workMode: ['remote'],
      minSalary: '100',
    })
    expect(payload).not.toHaveProperty('maxSalary')
    expect(payload).not.toHaveProperty('location')
    expect(payload.locationCountry).toBeNull()
  })

  it('sends a blank department and closing date as null', () => {
    const payload = jobFormToPayload({
      ...EMPTY_JOB_FORM,
      workMode: ['remote'],
      department: '  ',
    })
    expect(payload).toMatchObject({
      department: null,
      closesAt: null,
      employmentType: 'full_time',
      shareOptions: false,
    })
  })

  it('sends location names for on-site jobs', () => {
    const payload = jobFormToPayload({
      ...EMPTY_JOB_FORM,
      workMode: ['onSite'],
      maxSalary: '200',
      location: {
        country: { name: 'Nigeria', isoCode: 'NG' },
        state: { name: 'Lagos', isoCode: 'LA' },
        city: { name: '', isoCode: '' },
      },
    })
    expect(payload).toMatchObject({
      maxSalary: '200',
      locationCountry: 'Nigeria',
      locationState: 'Lagos',
    })
    expect(payload).not.toHaveProperty('locationCity')
  })
})
