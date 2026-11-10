import { describe, expect, it } from 'vitest'

import {
  hiringItems,
  peopleItems,
  workspaceItems,
} from '@/components/features/recruiter/SideBar/sidebarData'
import {
  accountItems,
  menuItems,
  workItems,
} from '@/components/features/talent/SideBar/SideBarData'

import {
  PAGE_TOURS,
  pageTourFor,
  RECRUITER_TOUR,
  STAGE_TOURS,
  TALENT_TOUR,
} from './tourSteps'

const sources = import.meta.glob('/src/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const anchorExists = (id: string) =>
  Object.entries(sources).some(
    ([path, source]) =>
      !path.endsWith('.test.tsx') &&
      new RegExp(`(data-tour|tourId)[^\\n]{0,40}['"]${id}['"]`).test(source),
  )

// Anchors outside the sidebar lists, set directly on their components.
const LAYOUT_ANCHORS = ['company-switcher', 'profile-menu', 'nav-notifications']
const RECRUITER_HEADER_ANCHORS = ['nav-post-job']

const recruiterSidebar = [...hiringItems, ...peopleItems, ...workspaceItems]
const talentSidebar = [...menuItems, ...workItems, ...accountItems]

const ids = (items: { tourId?: string }[]) =>
  items.map((item) => item.tourId).filter(Boolean)

describe('tour steps', () => {
  it('points every recruiter step at something on the page', () => {
    const available = [
      ...ids(recruiterSidebar),
      ...LAYOUT_ANCHORS,
      ...RECRUITER_HEADER_ANCHORS,
    ]
    for (const step of RECRUITER_TOUR) {
      if (step.target) expect(available).toContain(step.target)
    }
  })

  it('points every talent step at something on the page', () => {
    const available = [...ids(talentSidebar), ...LAYOUT_ANCHORS]
    for (const step of TALENT_TOUR) {
      if (step.target) expect(available).toContain(step.target)
    }
  })

  it('finds the header anchors in the app', () => {
    for (const id of [...RECRUITER_HEADER_ANCHORS, ...LAYOUT_ANCHORS]) {
      expect(anchorExists(id)).toBe(true)
    }
  })

  it('never puts the same anchor on two things in one shell', () => {
    for (const shell of [
      [
        ...ids(recruiterSidebar),
        ...LAYOUT_ANCHORS,
        ...RECRUITER_HEADER_ANCHORS,
      ],
      [...ids(talentSidebar), ...LAYOUT_ANCHORS],
    ]) {
      expect(new Set(shell).size).toBe(shell.length)
    }
  })

  it('starts each tour with a centred welcome and keeps copy short', () => {
    for (const tour of [RECRUITER_TOUR, TALENT_TOUR]) {
      expect(tour[0].target).toBeUndefined()
      for (const step of tour) {
        expect(step.body.length).toBeLessThanOrEqual(160)
      }
    }
  })

  describe('stage tours', () => {
    const allSteps = Object.entries(STAGE_TOURS).flatMap(([stage, steps]) =>
      (steps ?? []).map((step) => ({ stage, step })),
    )

    it('points every step at an anchor that exists in the app', () => {
      for (const { step } of allSteps) {
        if (step.target) expect(anchorExists(step.target)).toBe(true)
      }
    })

    it('gives every step a target, a reason and short copy', () => {
      for (const { step } of allSteps) {
        expect(step.target).toBeTruthy()
        expect(step.why).toBeTruthy()
        expect(step.body.length).toBeLessThanOrEqual(160)
        expect(step.why!.length).toBeLessThanOrEqual(120)
      }
    })

    it('only ends a tour on a step that waits for the stage to change', () => {
      for (const steps of Object.values(STAGE_TOURS)) {
        const waiting = (steps ?? []).filter((s) => s.advanceOn === 'stage')
        expect(waiting.length).toBeLessThanOrEqual(1)
        if (waiting.length) expect(steps?.at(-1)?.advanceOn).toBe('stage')
      }
    })

    it('tells click steps where the click leads, for phones', () => {
      for (const { step } of allSteps) {
        if (step.advanceOn === 'click' && step.target?.startsWith('nav-')) {
          expect(step.to).toBeTruthy()
        }
      }
    })
  })

  describe('page tours', () => {
    const routes = Object.entries(sources).find(([path]) =>
      path.endsWith('navigation/route-config.tsx'),
    )?.[1]

    it('has unique ids and short copy', () => {
      const ids = PAGE_TOURS.map((tour) => tour.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const step of PAGE_TOURS.flatMap((tour) => tour.steps)) {
        expect(step.body.length).toBeLessThanOrEqual(160)
        expect(step.why?.length ?? 0).toBeGreaterThan(0)
        expect(step.why!.length).toBeLessThanOrEqual(120)
        expect(step.advanceOn).toBeUndefined()
      }
    })

    it('belong to routes that exist', () => {
      expect(routes).toBeTruthy()
      for (const tour of PAGE_TOURS) {
        const last = tour.path.split('/').pop()
        expect(routes).toMatch(new RegExp(`path: '${last}('|/)`))
      }
    })

    it('finds the tour for a page, its sub-pages and only for its role', () => {
      expect(
        pageTourFor('recruiter', '/recruiterDashboard/shortlist')?.id,
      ).toBe('recruiter-shortlist')
      expect(
        pageTourFor('recruiter', '/recruiterDashboard/singleJobPost/abc')?.id,
      ).toBe('recruiter-applicants')
      expect(
        pageTourFor('talent', '/recruiterDashboard/shortlist'),
      ).toBeUndefined()
      expect(pageTourFor('talent', '/talentDashboard')).toBeUndefined()
    })
  })
})
