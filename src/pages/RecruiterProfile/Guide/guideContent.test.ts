import { describe, expect, it } from 'vitest'

import { filterGuide, GUIDE_SECTIONS, guideLink } from './guideContent'

const allIds = GUIDE_SECTIONS.flatMap((section) => [
  section.id,
  ...section.entries.map((entry) => entry.id),
])

describe('guide content', () => {
  it('uses unique ids so every link lands in one place', () => {
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('has an entry for every screening tip link', () => {
    for (const id of [
      'skills-test-score',
      'cv-match',
      'tailored-questions',
      'personality-check',
      'company-tests',
      'notes-for-ai',
      'setup-name',
    ]) {
      expect(allIds).toContain(id)
    }
  })

  it('covers every recruiter sidebar page', () => {
    const titles = GUIDE_SECTIONS.find((s) => s.id === 'pages')!.entries.map(
      (entry) => entry.title,
    )
    for (const page of [
      'Dashboard',
      'Post a Job',
      'My Job Posts',
      'Scout',
      'Talent Search',
      'Chat',
      'Shortlist',
    ]) {
      expect(titles).toContain(page)
    }
  })

  it('keeps every entry short and to the point', () => {
    for (const section of GUIDE_SECTIONS) {
      for (const entry of section.entries) {
        expect(entry.body.length).toBeLessThanOrEqual(320)
      }
    }
  })

  it('builds guide links', () => {
    expect(guideLink('cv-match')).toBe('/recruiterDashboard/guide#cv-match')
  })
})

describe('filterGuide', () => {
  it('returns everything for an empty search', () => {
    expect(filterGuide('   ')).toEqual(GUIDE_SECTIONS)
  })

  it('matches titles, bodies and tips, ignoring case', () => {
    const titles = (query: string) =>
      filterGuide(query).flatMap((s) => s.entries.map((e) => e.title))
    expect(titles('cv MATCH')).toContain('CV match')
    expect(titles('sensible bar')).toEqual(['CV match'])
  })

  it('needs every word to match', () => {
    expect(
      filterGuide('shortlist zzzz').flatMap((section) => section.entries),
    ).toEqual([])
  })

  it('drops sections with no matching entries', () => {
    const result = filterGuide('verify your email')
    expect(result.every((section) => section.entries.length > 0)).toBe(true)
    expect(result.map((section) => section.id)).toContain('getting-started')
  })
})
