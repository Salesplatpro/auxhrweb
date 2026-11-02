import { beforeEach, describe, expect, it } from 'vitest'

import {
  applicantSourceLabel,
  matchesApplicantSource,
  readApplicantSource,
  recallApplicantSource,
  rememberApplicantSource,
} from './applicantSource'

const JOB = 'job-1'

describe('applicant source (Day 9)', () => {
  beforeEach(() => localStorage.clear())

  it('reads ?source= from the link', () => {
    expect(readApplicantSource('?source=whatsapp')).toBe('whatsapp')
  })

  it('falls back to utm_source', () => {
    expect(readApplicantSource('?utm_source=LinkedIn&utm_medium=social')).toBe(
      'linkedin',
    )
  })

  it('ignores a missing, empty or over-long source', () => {
    expect(readApplicantSource('')).toBeNull()
    expect(readApplicantSource('?source=%20')).toBeNull()
    expect(readApplicantSource(`?source=${'x'.repeat(51)}`)).toBeNull()
  })

  it('remembers the source per job until the candidate applies', () => {
    rememberApplicantSource(JOB, '?source=facebook')
    expect(recallApplicantSource(JOB)).toBe('facebook')
    expect(recallApplicantSource('other-job')).toBeNull()
  })

  it('keeps the first remembered source when a later visit has none', () => {
    rememberApplicantSource(JOB, '?source=x')
    rememberApplicantSource(JOB, '')
    expect(recallApplicantSource(JOB)).toBe('x')
  })
})

describe('applicant source in the applicants table (Day 9)', () => {
  it('labels the known sources the way the networks write them', () => {
    expect(applicantSourceLabel('whatsapp')).toBe('WhatsApp')
    expect(applicantSourceLabel('linkedin')).toBe('LinkedIn')
    expect(applicantSourceLabel('x')).toBe('X')
    expect(applicantSourceLabel('facebook')).toBe('Facebook')
    expect(applicantSourceLabel('indeed')).toBe('Indeed')
  })

  it('shows any other source as it came, and a dash when there is none', () => {
    expect(applicantSourceLabel('newsletter')).toBe('newsletter')
    expect(applicantSourceLabel(null)).toBe('—')
    expect(applicantSourceLabel(undefined)).toBe('—')
  })

  it('filters by source, with all and none', () => {
    expect(matchesApplicantSource('whatsapp', 'all')).toBe(true)
    expect(matchesApplicantSource('whatsapp', 'whatsapp')).toBe(true)
    expect(matchesApplicantSource('linkedin', 'whatsapp')).toBe(false)
    expect(matchesApplicantSource(null, 'none')).toBe(true)
    expect(matchesApplicantSource('x', 'none')).toBe(false)
  })
})
