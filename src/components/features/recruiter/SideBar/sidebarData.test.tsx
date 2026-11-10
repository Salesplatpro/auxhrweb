import { describe, expect, it } from 'vitest'

import { recruiterNavSections } from './sidebarData'

const names = (sections: ReturnType<typeof recruiterNavSections>) =>
  sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => item.name),
  }))

describe('recruiterNavSections', () => {
  it('follows the design order and hides People without access', () => {
    expect(names(recruiterNavSections({}, false))).toEqual([
      {
        label: 'Hiring',
        items: [
          'Dashboard',
          'Job Posts',
          'Applications',
          'Pre-Screening',
          'AI Configuration',
          'Shortlist',
          'Scout',
          'Talent Search',
        ],
      },
      {
        label: 'Workspace',
        items: [
          'Notifications',
          'Chats',
          'Company',
          'Guide',
          'Support',
          'Settings',
        ],
      },
    ])
  })

  it('shows all eight People links to the owner and people managers', () => {
    const people = recruiterNavSections({}, true).find(
      (section) => section.label === 'People',
    )

    expect(people?.items.map((item) => item.name)).toEqual([
      'Employees',
      'Org chart',
      'Company profile',
      'Benefits',
      'Commission plans',
      'Headcount cost',
      'Quarterly review',
      'Access log',
    ])
  })

  it('puts each count on its item', () => {
    const items = recruiterNavSections(
      {
        jobPosts: 12,
        applications: 48,
        shortlist: 24,
        employees: 9,
        notifications: 6,
        chats: 3,
      },
      true,
    ).flatMap((section) => section.items)
    const count = (name: string) =>
      items.find((item) => item.name === name)?.count

    expect(count('Job Posts')).toBe(12)
    expect(count('Applications')).toBe(48)
    expect(count('Shortlist')).toBe(24)
    expect(count('Employees')).toBe(9)
    expect(count('Notifications')).toBe(6)
    expect(count('Chats')).toBe(3)
    expect(count('Dashboard')).toBeUndefined()
  })

  it('sends Settings to the change-password page', () => {
    const settings = recruiterNavSections({}, false)
      .flatMap((section) => section.items)
      .find((item) => item.name === 'Settings')

    expect(settings?.link).toBe('/recruiterDashboard/change-password')
  })
})
