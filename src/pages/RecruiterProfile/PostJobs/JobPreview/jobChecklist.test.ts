import { describe, expect, it } from 'vitest'

import { EMPTY_JOB_FORM } from '../utils/jobFormValues'
import { jobChecklist } from './jobChecklist'

const done = (values: Parameters<typeof jobChecklist>[0]) =>
  Object.fromEntries(jobChecklist(values).map((item) => [item.key, item.done]))

describe('jobChecklist', () => {
  it('marks everything to do on an empty form', () => {
    expect(Object.values(done(EMPTY_JOB_FORM)).every((value) => !value)).toBe(
      true,
    )
  })

  it('treats an editor with only empty paragraphs as empty', () => {
    expect(done({ ...EMPTY_JOB_FORM, jobBrief: '<p><br></p>' }).jobBrief).toBe(
      false,
    )
  })

  it('needs a country for on-site or hybrid work, but not for remote', () => {
    const hybrid = { ...EMPTY_JOB_FORM, workMode: ['hybrid' as const] }
    expect(done(hybrid).workMode).toBe(false)
    expect(
      done({
        ...hybrid,
        location: {
          ...EMPTY_JOB_FORM.location,
          country: { name: 'Nigeria', isoCode: 'NG' },
        },
      }).workMode,
    ).toBe(true)
    expect(done({ ...EMPTY_JOB_FORM, workMode: ['remote'] }).workMode).toBe(
      true,
    )
  })

  it('needs currency, minimum and period for pay', () => {
    const partial = { ...EMPTY_JOB_FORM, currency: 'NGN', minSalary: '100' }
    expect(done(partial).pay).toBe(false)
    expect(done({ ...partial, compensationPeriod: 'monthly' }).pay).toBe(true)
  })

  it('labels the work mode item by whether a country is needed', () => {
    const label = (workMode: ('remote' | 'onSite')[]) =>
      jobChecklist({ ...EMPTY_JOB_FORM, workMode }).find(
        (i) => i.key === 'workMode',
      )?.label
    expect(label(['onSite'])).toBe('Work mode and country')
    expect(label(['remote'])).toBe('Work mode')
  })
})
